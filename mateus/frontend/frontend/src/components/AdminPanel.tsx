import { useEffect, useState } from 'react'
import { request } from '../services/api'
import type { User } from '../services/auth'

type Subscription = { idSubscription: number; userId: number; plan: string; status: string }
type Payment = { id: number; subscriptionId: number; status: string; amount: number }
export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    Promise.all([
      request<User[]>('/api/admin/users?limit=200'),
      request<Subscription[]>('/api/admin/subscriptions?limit=200'),
      request<Payment[]>('/api/admin/payments?limit=200'),
    ]).then(([u, s, p]) => { if (active) { setUsers(u); setSubscriptions(s); setPayments(p) } })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'Falha ao consultar administração.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  return <div className="payments-content">
    <div className="page-heading"><div><h1>Administração</h1><p>Até 200 registros recentes por categoria.</p></div></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {loading ? <p role="status">Carregando…</p> : <>
      <section className="panel"><div className="panel-title"><h2>Usuários</h2></div><div className="table-scroll"><table className="data-table"><thead><tr><th>ID</th><th>Nome</th><th>E-mail</th><th>Papel</th></tr></thead><tbody>{users.map(u => <tr key={u.id}><td>{u.id}</td><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td></tr>)}</tbody></table></div></section>
      <section className="panel"><div className="panel-title"><h2>Assinaturas</h2></div><div className="table-scroll"><table className="data-table"><thead><tr><th>ID</th><th>Usuário</th><th>Plano</th><th>Status</th></tr></thead><tbody>{subscriptions.map(s => <tr key={s.idSubscription}><td>{s.idSubscription}</td><td>{s.userId}</td><td>{s.plan}</td><td>{s.status}</td></tr>)}</tbody></table></div></section>
      <section className="panel"><div className="panel-title"><h2>Pagamentos</h2></div><div className="table-scroll"><table className="data-table"><thead><tr><th>ID</th><th>Assinatura</th><th>Valor</th><th>Status</th></tr></thead><tbody>{payments.map(p => <tr key={p.id}><td>{p.id}</td><td>{p.subscriptionId}</td><td>{p.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td><td>{p.status}</td></tr>)}</tbody></table></div></section>
    </>}
  </div>
}
