import type { Assinatura, AssinaturaInput } from '../types/assinatura'
import { request } from './api'
import { auth } from './auth'
export type Plan = { plan: string; paymentAmount: number }
type Subscription = {
  idSubscription: number; status: string; plan: string; amount: number
  startSubscription: string; endSubscription: string | null
}

export const assinaturasApi = {
  plans: () => request<Plan[]>('/api/plans', {}, false),
  async listar(): Promise<Assinatura[]> {
    const [rows, user] = await Promise.all([request<Subscription[]>('/api/subscriptions'), auth.me()])
    return rows.map(s => ({
      id: String(s.idSubscription), cliente: user.name, email: user.email, plano: s.plan,
      valor: s.amount, status: s.status === 'ACTIVE' ? 'ATIVA' : s.status === 'EXPIRED' ? 'VENCIDA' : s.status === 'CANCELED' ? 'CANCELADA' : s.status === 'CANCEL_SCHEDULED' ? 'CANCELAMENTO_AGENDADO' : s.status === 'SUSPENDED' ? 'SUSPENSA' : 'PENDENTE',
      dataInicio: s.startSubscription, proximoVencimento: s.endSubscription || '',
    }))
  },
  async criar(input: AssinaturaInput) {
    await request('/api/subscriptions', { method: 'POST', body: JSON.stringify({ plan: input.plano }) })
  },
  async atualizar(id: string, input: AssinaturaInput) {
    await request('/api/subscriptions/' + id, { method: 'PUT', body: JSON.stringify({ plan: input.plano }) })
  },
  async retomar(id: string) { await request('/api/subscriptions/' + id + '/resume', { method: 'POST' }) },
  async excluir(id: string) { await request('/api/subscriptions/' + id + '/cancel', { method: 'POST' }) },
}