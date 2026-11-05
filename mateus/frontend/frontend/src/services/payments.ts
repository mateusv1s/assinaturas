import { request } from './api'
export type Payment = { id: number; subscriptionId: number; amount: number; status: string; createdAt: string }
export const paymentsApi = {
  listar: () => request<Payment[]>('/api/payments'),
  criar: (subscriptionId: string, simulateDecline: boolean, key: string) => request<Payment>('/api/payments', {
    method: 'POST', headers: { 'Idempotency-Key': key },
    body: JSON.stringify({ subscriptionId: Number(subscriptionId), simulateDecline }),
  }),
  consultar: (id: string) => request<Payment>('/api/payments/' + encodeURIComponent(id)),
  reenviar: (id: number) => request<Payment>('/api/payments/' + id + '/retry', { method: 'POST' }),
}
