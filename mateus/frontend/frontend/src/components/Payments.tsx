import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { CreditCard, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react'
import { request } from '../services/api'
import { paymentsApi, type Payment } from '../services/payments'
import { assinaturasApi } from '../services/assinaturas'
import type { Assinatura } from '../types/assinatura'
import { currentSession, isCurrentSession } from '../services/session'

const formatAmount = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const statusLabels: Record<string, string> = {
  APPROVED: 'Aprovado',
  RECUSED: 'Recusado',
  PENDING: 'Em processamento',
}

function resultMessage(payment: Payment) {
  if (payment.status === 'APPROVED') {
    return 'Pagamento aprovado. Sua assinatura está ativa.'
  }

  if (payment.status === 'RECUSED') {
    return 'Pagamento recusado. Confira a assinatura e tente novamente, se necessário.'
  }

  return 'Solicitação registrada. Acompanhe o processamento nesta tela.'
}

export default function Payments({ onChanged, today }: { onChanged: () => Promise<void>; today: string }) {
  const [billing, setBilling] = useState<{ mode: string; configured: boolean } | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [subscriptions, setSubscriptions] = useState<Assinatura[]>([])
  const [subscriptionId, setSubscriptionId] = useState('')
  const [simulateDecline, setSimulateDecline] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  const attempt = useRef<{ payload: string; key: string } | null>(null)
  const previousStatuses = useRef(new Map<number, string>())
  const mounted = useRef(false)
  const refreshSequence = useRef(0)
  const hasPending = payments.some(payment => payment.status === 'PENDING')

  const load = useCallback(async () => {
    const sequence = ++refreshSequence.current
    const session = currentSession()
    const result = await Promise.all([
      paymentsApi.listar(),
      assinaturasApi.listar(),
    ]).catch(reason => {
      if (!mounted.current || sequence !== refreshSequence.current || !isCurrentSession(session)) return null
      throw reason
    })

    if (!result || !mounted.current || sequence !== refreshSequence.current || !isCurrentSession(session)) return
    const [nextPayments, nextSubscriptions] = result

    const completed = nextPayments.find(payment =>
      previousStatuses.current.get(payment.id) === 'PENDING' && payment.status !== 'PENDING'
    )

    previousStatuses.current = new Map(nextPayments.map(payment => [payment.id, payment.status]))
    setPayments(nextPayments)
    setSubscriptions(nextSubscriptions)
    setLoading(false)
    setError('')

    if (completed) {
      setMessage(resultMessage(completed))
      await onChanged()
    }
  }, [onChanged])

  useEffect(() => {
    mounted.current = true
    const session = currentSession()
    void request<{ mode: string; configured: boolean }>('/api/billing/config').then(config => {
      if (mounted.current && isCurrentSession(session)) setBilling(config)
    }).catch(() => { if (mounted.current && isCurrentSession(session)) setBilling({ mode: 'unconfigured', configured: false }) })
    void load().catch(reason => {
      if (mounted.current) {
        setError(reason instanceof Error ? reason.message : 'Falha ao carregar pagamentos.')
        setLoading(false)
      }
    })

    return () => { mounted.current = false; refreshSequence.current++ }
  }, [load, today])

  useEffect(() => {
    if (!hasPending) return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    async function poll() {
      try {
        await load()
      } catch (reason) {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : 'Falha ao atualizar pagamentos.')
        }
      } finally {
        if (!cancelled) timer = setTimeout(() => void poll(), 3000)
      }
    }

    timer = setTimeout(() => void poll(), 3000)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [hasPending, load])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!billing?.configured) { setError("O pagamento ainda não foi configurado."); return }
    const session = currentSession()
    const isCurrent = () => mounted.current && isCurrentSession(session)
    setBusy(true)
    setError('')
    setMessage('')

    const payload = JSON.stringify({ subscriptionId, simulateDecline })
    if (attempt.current?.payload !== payload) {
      attempt.current = { payload, key: crypto.randomUUID() }
    }

    try {
      const payment = await paymentsApi.criar(
        subscriptionId,
        simulateDecline,
        attempt.current!.key,
      )
      if (!isCurrent()) return

      attempt.current = null
      previousStatuses.current.set(payment.id, payment.status)
      setPayments(current => [payment, ...current.filter(item => item.id !== payment.id)])
      setLoading(false)
      setMessage(resultMessage(payment))
      setSubscriptionId('')
      if (payment.status !== 'PENDING') await onChanged()
      await load()
    } catch (reason) {
      if (isCurrent()) setError(reason instanceof Error ? reason.message : 'Falha ao solicitar pagamento.')
    } finally {
      if (isCurrent()) setBusy(false)
    }
  }

  async function refresh() {
    const session = currentSession()
    setBusy(true)
    setError('')

    try {
      await load()
    } catch (reason) {
      if (mounted.current && isCurrentSession(session)) setError(reason instanceof Error ? reason.message : 'Falha ao carregar pagamentos.')
    } finally {
      if (mounted.current && isCurrentSession(session)) setBusy(false)
    }
  }

  async function retry(paymentId: number) {
    const session = currentSession()
    setBusy(true)
    setError('')

    try {
      const payment = await paymentsApi.reenviar(paymentId)
      if (!mounted.current || !isCurrentSession(session)) return
      setMessage(payment.status === 'PENDING'
        ? 'Reenvio solicitado. O pagamento mantém o mesmo ID e não será cobrado duas vezes.'
        : resultMessage(payment))
      await load()
      await onChanged()
    } catch (reason) {
      if (mounted.current && isCurrentSession(session)) setError(reason instanceof Error ? reason.message : 'Não foi possível reenviar.')
    } finally {
      if (mounted.current && isCurrentSession(session)) setBusy(false)
    }
  }

  const pendingSubscriptions = new Set(
    payments.filter(payment => payment.status === 'PENDING').map(payment => String(payment.subscriptionId))
  )
  const available = subscriptions.filter(subscription =>
    !pendingSubscriptions.has(subscription.id) && (
      subscription.status === 'PENDENTE' || subscription.status === 'VENCIDA' || subscription.status === 'SUSPENSA' ||
      (subscription.status === 'ATIVA' && subscription.proximoVencimento <= today)
    )
  )
  const selected = available.find(subscription => subscription.id === subscriptionId)

  return (
    <div className="payments-content">
      <div className="page-heading">
        <div>
          <div className="breadcrumb">MINHA CONTA / PAGAMENTOS</div>
          <h1>Pagamentos</h1>
          <p>Ative seu plano e acompanhe o histórico de cobranças.</p>
        </div>
        <button className="btn btn-light" disabled={busy} onClick={() => void refresh()}>
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>

      {billing?.mode === 'simulated' && <div className="payment-hint">
        <AlertTriangle size={19} />
        <p><strong>Ambiente de simulação.</strong> Nenhuma cobrança movimenta dinheiro real.</p>
      </div>}

      {billing && !billing.configured && <div className="alert-banner" role="alert">O provedor de pagamento ainda não foi configurado. As cobranças estão indisponíveis.</div>}
      <div className="payments-grid">
        <section className="panel pay-form-panel">
          <div className="panel-title">
            <div><h2>Pagar assinatura</h2><p>Selecione uma assinatura pendente ou vencida.</p></div>
            <CreditCard size={22} />
          </div>
          <form className="pay-form" onSubmit={submit}>
            <label className="field">
              Assinatura
              <select required value={subscriptionId}
                onChange={event => setSubscriptionId(event.target.value)} disabled={busy || loading}>
                <option value="">Selecione um plano</option>
                {available.map(subscription => (
                  <option key={subscription.id} value={subscription.id}>
                    #{subscription.id} · {subscription.plano} · {formatAmount(subscription.valor)}
                  </option>
                ))}
              </select>
            </label>

            {selected && <p>Total: <strong>{formatAmount(selected.valor)}</strong></p>}

            {billing?.mode === 'simulated' && <label className="field">
              Resultado da simulação
              <select value={simulateDecline ? 'decline' : 'approve'} disabled={busy}
                onChange={event => setSimulateDecline(event.target.value === 'decline')}>
                <option value="approve">Aprovar pagamento</option>
                <option value="decline">Recusar pagamento</option>
              </select>
            </label>}

            <button className="btn btn-primary" disabled={busy || !selected || loading || !billing?.configured}>
              {busy ? 'Enviando…' : 'Solicitar pagamento'} <ArrowRight size={17} />
            </button>
          </form>
        </section>

        <section className="panel pay-info-panel">
          <div className="panel-title">
            <div><h2>Do plano à ativação</h2><p>Acompanhe cada etapa da solicitação</p></div>
          </div>
          <div className="payment-flow">
            <div><span>01</span><p><strong>Escolha sua assinatura</strong><small>O valor acompanha o plano contratado.</small></p></div>
            <div><span>02</span><p><strong>Aguarde o processamento</strong><small>Sua solicitação será processada em segundo plano.</small></p></div>
            <div><span>03</span><p><strong>Acompanhe a ativação</strong><small>A tela atualiza automaticamente até o resultado final.</small></p></div>
          </div>
        </section>
      </div>

      {error && <div className="alert-banner" role="alert">{error}</div>}
      {message && <div className="success-banner" role="status">{message}</div>}
      {hasPending && (
        <div className="payment-hint" role="status">
          <RefreshCw size={18} />
          <p>Há pagamentos em processamento. Se demorarem, use <strong>Reenviar</strong> no histórico.</p>
        </div>
      )}

      <section className="panel pay-history">
        <div className="panel-title">
          <div><h2>Seu histórico</h2><p>Todas as tentativas registradas na sua conta</p></div>
        </div>

        {loading ? (
          <div className="empty-state">Carregando pagamentos…</div>
        ) : payments.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr><th>PAGAMENTO</th><th>ASSINATURA</th><th>VALOR</th><th>STATUS</th><th>DATA</th><th>AÇÕES</th></tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment.id}>
                    <td>#{payment.id}</td>
                    <td>#{payment.subscriptionId}</td>
                    <td className="amount">{formatAmount(payment.amount)}</td>
                    <td>
                      <span className={'status ' + (
                        payment.status === 'APPROVED' ? 'status-ativa' :
                          payment.status === 'RECUSED' ? 'status-cancelada' : 'status-pendente'
                      )}>
                        <i />{statusLabels[payment.status] || payment.status}
                      </span>
                    </td>
                    <td>{new Date(payment.createdAt).toLocaleString('pt-BR')}</td>
                    <td>
                      {payment.status === 'PENDING' && (
                        <button className="btn btn-light" disabled={busy}
                          onClick={() => void retry(payment.id)}>
                          Reenviar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <CreditCard size={27} />
            <strong>Nenhum pagamento registrado</strong>
            <p>Crie uma assinatura e solicite seu primeiro pagamento.</p>
          </div>
        )}
      </section>
    </div>
  )
}
