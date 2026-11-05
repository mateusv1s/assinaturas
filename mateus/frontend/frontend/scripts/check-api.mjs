import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

const base = process.argv[2] || 'http://localhost:5173/backend'
let token
async function call(method, path, expected, body, extra = {}) {
  const response = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  })
  assert.equal(response.status, expected, `${method} ${path}: expected ${expected}, received ${response.status}`)
  console.log(`${response.status} ${method} ${path}`)
  return response.status === 204 ? null : response.json()
}

const credentials = { name: 'Verificação API', email: `check-${randomUUID()}@example.com`, password: randomUUID().slice(0, 20) }
await call('GET', '/api/plans', 200)
await call('GET', '/api/users/me', 401)
await call('POST', '/api/auth/register', 201, credentials)
await call('POST', '/api/auth/register', 409, credentials)
await call('POST', '/api/auth/login', 401, { ...credentials, password: 'incorrect-password' })
token = (await call('POST', '/api/auth/login', 200, credentials)).token
await call('GET', '/api/users/me', 200)
const sub = await call('POST', '/api/subscriptions', 201, { plan: 'BASIC' })
const path = `/api/subscriptions/${sub.idSubscription}`
await call('GET', '/api/subscriptions', 200)
await call('GET', path, 200)
assert.equal((await call('PUT', path, 200, { plan: 'INTER' })).plan, 'INTER')
assert.equal((await call('GET', path, 200)).plan, 'INTER')

for (const decline of [true, false]) {
  const body = { subscriptionId: sub.idSubscription, simulateDecline: decline }
  const headers = { 'Idempotency-Key': randomUUID() }
  const payment = await call('POST', '/api/payments', 202, body, headers)
  const paymentPath = `/api/payments/${payment.id}`
  let result
  const deadline = Date.now() + 30000
  do {
    result = await call('GET', paymentPath, 200)
    if (result.status !== 'PENDING') break
    await new Promise(resolve => setTimeout(resolve, 1000))
  } while (Date.now() < deadline)
  assert.equal(result.status, decline ? 'RECUSED' : 'APPROVED')
  assert.equal((await call('POST', '/api/payments', 200, body, headers)).id, payment.id)
  assert.equal((await call('POST', paymentPath + '/retry', 200)).id, payment.id)
}
await call('GET', '/api/payments', 200)
assert.equal((await call('GET', path, 200)).status, 'ACTIVE')
await call('PUT', path, 409, { plan: 'ADVANCED' })
await call('DELETE', path, 204)
assert.equal((await call('GET', path, 200)).status, 'CANCELED')
console.log('PASS: authentication, plans, subscriptions, cache invalidation and asynchronous payments.')
