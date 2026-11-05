import { test, expect, type Page, type Route } from '@playwright/test'

test('token salvo não libera o painel sem validação da API', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('assinaturas.accessToken', 'inventado'))
  await page.route('**/backend/api/users/me', route => route.fulfill({ status: 401, json: { message: 'Sessão inválida' } }))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Acesse seu painel' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Visão geral' })).toHaveCount(0)
  expect(await page.evaluate(() => sessionStorage.getItem('assinaturas.accessToken'))).toBeNull()
})

const subscription = (id = 1, plan = 'BASIC', status = 'PENDENT', endSubscription: string | null = null) => ({
  idSubscription: id, userId: 1, plan, status, amount: 79.9,
  startSubscription: '2026-11-01', endSubscription,
})
const user = { id: 1, name: 'Ana Teste', email: 'ana@example.com', role: 'USER' }
const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, json: body })
function gate() {
  let release!: () => void
  const promise = new Promise<void>(resolve => { release = resolve })
  return { promise, release }
}
function stat(page: Page, label: string) {
  return page.locator('.stat-card').filter({
    has: page.locator('.stat-top > span').filter({ hasText: new RegExp(`^${label}$`) }),
  }).locator(':scope > strong')
}
async function mockApi(page: Page, rows = [subscription()]) {
  await page.addInitScript(() => sessionStorage.setItem('assinaturas.accessToken', 'session-a'))
  await page.route('**/backend/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/billing/config')) return json(route, { mode: 'simulated', configured: true })
    if (path.endsWith('/users/me')) return json(route, user)
    if (path.endsWith('/plans')) return json(route, [{ plan: 'BASIC', paymentAmount: 79.9 }, { plan: 'INTER', paymentAmount: 189.9 }])
    if (path.endsWith('/subscriptions')) return json(route, rows)
    if (path.endsWith('/payments')) return json(route, [])
    return json(route, { message: 'Rota não configurada no teste' }, 404)
  })
}

test('uma consulta antiga não substitui o resultado de uma criação', async ({ page }) => {
  await mockApi(page)
  await page.goto('/')
  await expect(stat(page, 'Assinaturas totais')).toHaveText('1')
  const old = gate()
  let started = false
  let hold = true
  let created = false
  await page.route('**/backend/api/subscriptions', async route => {
    if (route.request().method() === 'POST') {
      created = true
      return json(route, subscription(2), 201)
    }
    if (hold) {
      hold = false
      started = true
      await old.promise
      return json(route, [subscription()])
    }
    return json(route, created ? [subscription(), subscription(2)] : [subscription()])
  })
  try {
    await page.getByRole('button', { name: 'Atualizar', exact: true }).click()
    await expect.poll(() => started).toBe(true)
    await page.getByRole('button', { name: 'Nova assinatura', exact: true }).click()
    await page.getByRole('button', { name: 'Criar assinatura', exact: true }).click()
    await expect(stat(page, 'Assinaturas totais')).toHaveText('2')
    const oldResponse = page.waitForResponse(response => response.url().endsWith('/api/subscriptions') && response.request().method() === 'GET')
    old.release()
    await (await oldResponse).finished()
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
    await expect(stat(page, 'Assinaturas totais')).toHaveText('2')
  } finally { old.release() }
})

test('401 atrasado não encerra outra sessão e não restaura o modal antigo', async ({ page }) => {
  await mockApi(page)
  await page.goto('/')
  await expect(stat(page, 'Assinaturas totais')).toHaveText('1')
  const oldList = gate()
  const oldProfile = gate()
  let profileStarted = false
  await page.route('**/backend/api/users/me', async route => {
    if (route.request().headers().authorization === 'Bearer session-a') {
      profileStarted = true
      await oldProfile.promise
      return json(route, { message: 'Sessão expirada' }, 401)
    }
    return json(route, { ...user, id: 2, name: 'Bruno Teste' })
  })
  await page.route('**/backend/api/subscriptions', async route => {
    if (route.request().headers().authorization === 'Bearer session-a') {
      await oldList.promise
      return json(route, { message: 'Sessão antiga' }, 401)
    }
    return json(route, [subscription(2, 'INTER')])
  })
  await page.route('**/backend/api/auth/login', route => json(route, { token: 'session-b', user }))
  try {
    await page.getByRole('button', { name: 'Atualizar', exact: true }).click()
    await expect.poll(() => profileStarted).toBe(true)
    await page.getByRole('button', { name: 'Nova assinatura', exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    oldProfile.release()
    await expect(page.getByRole('heading', { name: 'Acesse seu painel' })).toBeVisible()
    await page.getByLabel('E-mail', { exact: true }).fill('bruno@example.com')
    await page.locator('input[autocomplete="current-password"]').fill('senha12345')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page.getByText('Bruno Teste', { exact: true })).toBeVisible()
    const oldResponse = page.waitForResponse(response => response.url().endsWith('/api/subscriptions') && response.status() === 401)
    oldList.release()
    await (await oldResponse).finished()
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
    await expect(page.getByRole('heading', { name: 'Visão geral', exact: true })).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem('assinaturas.accessToken'))).toBe('session-b')
  } finally { oldProfile.release(); oldList.release() }
})

test('falha de cancelamento permanece no diálogo como erro', async ({ page }) => {
  await mockApi(page)
  await page.route('**/backend/api/subscriptions/1/cancel', route => json(route, { message: 'Serviço temporariamente indisponível' }, 503))
  await page.goto('/')
  await page.getByRole('button', { name: 'Cancelar Ana Teste', exact: true }).click()
  await page.getByRole('button', { name: 'Sim, cancelar' }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await expect(page.getByRole('alert')).toHaveText('Serviço temporariamente indisponível')
  await expect(page.locator('.toast')).toHaveCount(0)
})

test('contagem de vencimentos usa UTC mesmo com navegador em São Paulo', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-05T01:00:00Z'))
  await mockApi(page, [subscription(1, 'BASIC', 'ACTIVE', '2026-11-12'), subscription(2, 'INTER', 'ACTIVE', '2026-11-05')])
  await page.goto('/')
  await expect(stat(page, 'Vencendo em 7 dias')).toHaveText('1')
  await expect(stat(page, 'Assinaturas ativas')).toHaveText('1')
  await expect(page.locator('.status-vencida')).toHaveCount(1)
})

test('tela aberta acompanha o vencimento na meia-noite UTC', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-04T23:59:00Z') })
  await page.clock.pauseAt(new Date('2026-11-04T23:59:59Z'))
  await mockApi(page, [subscription(1, 'BASIC', 'ACTIVE', '2026-11-05')])
  await page.goto('/')
  await expect(stat(page, 'Assinaturas ativas')).toHaveText('1')
  await page.clock.runFor(1100)
  await expect(stat(page, 'Assinaturas ativas')).toHaveText('0')
  await expect(page.locator('.status-vencida')).toHaveText('Vencida')
})

test('pagamento aceito continua atualizando após falha na consulta seguinte', async ({ page }) => {
  await mockApi(page)
  let accepted = false
  let failed = false
  const payment = { id: 10, subscriptionId: 1, amount: 79.9, status: 'PENDING', createdAt: '2026-11-05T12:00:00Z' }
  await page.route('**/backend/api/payments', route => {
    if (route.request().method() === 'POST') {
      accepted = true
      return json(route, payment, 202)
    }
    if (!accepted) return json(route, [])
    if (!failed) { failed = true; return json(route, { message: 'Consulta indisponível' }, 503) }
    return json(route, [{ ...payment, status: 'APPROVED' }])
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Pagamentos', exact: true }).click()
  await page.getByRole('combobox', { name: 'Assinatura', exact: true }).selectOption('1')
  await page.getByRole('button', { name: 'Solicitar pagamento' }).click()
  await expect(page.getByRole('alert')).toHaveText('Consulta indisponível')
  await expect(page.getByRole('cell', { name: 'Em processamento', exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Aprovado', exact: true })).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('login permite digitar uma senha antiga com mais de vinte caracteres', async ({ page }) => {
  await page.goto('/')
  const password = page.locator('input[autocomplete="current-password"]')
  const value = 'senha-antiga-com-mais-de-vinte'
  await password.fill(value)
  await expect(password).toHaveValue(value)
  await expect(password).toHaveAttribute('maxlength', '72')
})

test('visual limpo funciona no desktop e no celular', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.clock.setFixedTime(new Date('2026-11-05T12:00:00Z'))
  await mockApi(page, [subscription(1, 'BASIC', 'ACTIVE', '2026-12-01'), subscription(2, 'INTER'), subscription(3, 'BASIC', 'CANCELED')])
  await page.goto('/')
  await expect(stat(page, 'Assinaturas totais')).toHaveText('3')
  await expect(page).toHaveTitle(/Gestão de Assinaturas/)
  await page.screenshot({ path: 'test-results/dashboard-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/dashboard-mobile.png', fullPage: true })
  await page.getByRole('button', { name: 'Abrir menu' }).click()
  await expect(page.getByRole('button', { name: 'Pagamentos', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Pagamentos', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Pagamentos', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Sair da conta' }).click()
  await page.setViewportSize({ width: 1440, height: 1000 })
  await expect(page.getByRole('heading', { name: 'Acesse seu painel' })).toBeVisible()
  await page.screenshot({ path: 'test-results/login-desktop.png', fullPage: true })
})


test('administração aparece apenas para administradores', async ({ page }) => {
  await mockApi(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Administração', exact: true })).toHaveCount(0)
  await page.route('**/backend/api/users/me', route => json(route, { ...user, role: 'ADMIN' }))
  await page.route('**/backend/api/admin/**', route => json(route, []))
  await page.reload()
  await page.getByRole('button', { name: 'Administração', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Administração', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Usuários', exact: true })).toBeVisible()
})

test('pagamento sem provedor configurado não permite aprovar simulação', async ({ page }) => {
  await mockApi(page)
  await page.route('**/backend/api/billing/config', route => json(route, { mode: 'unconfigured', configured: false }))
  await page.goto('/')
  await page.getByRole('button', { name: 'Pagamentos', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('provedor de pagamento ainda não foi configurado')
  await expect(page.getByRole('button', { name: 'Solicitar pagamento' })).toBeDisabled()
  await expect(page.getByText('Resultado da simulação')).toHaveCount(0)
})
