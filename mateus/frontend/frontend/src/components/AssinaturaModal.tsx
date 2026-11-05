import { useEffect, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { Assinatura, AssinaturaInput } from '../types/assinatura'
import { assinaturasApi, type Plan } from '../services/assinaturas'
export default function AssinaturaModal({ inicial, onFechar, onSalvar }: {
  inicial?: Assinatura; onFechar: () => void; onSalvar: (input: AssinaturaInput) => Promise<void>
}) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [plan, setPlan] = useState(inicial?.plano || 'BASIC')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(()=>{ assinaturasApi.plans().then(setPlans).catch(e=>setError(e.message)) },[])
  useEffect(()=>{
    const key = (e: KeyboardEvent) => { if(e.key === 'Escape' && !busy) onFechar() }
    window.addEventListener('keydown',key); return ()=>window.removeEventListener('keydown',key)
  },[busy,onFechar])
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      await onSalvar({ cliente: '', email: '', plano: plan, valor: 0, status: 'PENDENTE', dataInicio: '', proximoVencimento: '' })
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar.') }
    finally { setBusy(false) }
  }
  return <div className="overlay"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div className="modal-header"><div><span className="eyebrow">SEU PRÓXIMO PLANO</span><h2 id="modal-title">{inicial ? 'Alterar plano' : 'Nova assinatura'}</h2><p>A assinatura será ativada após o pagamento aprovado.</p></div><button className="icon-btn" aria-label="Fechar" disabled={busy} onClick={onFechar}><X size={18}/></button></div>
    <form onSubmit={submit}><div className="form-body"><label className="field">Plano mensal<select autoFocus value={plan} onChange={e=>setPlan(e.target.value)} disabled={!plans.length || busy}>
      {plans.map(p=><option key={p.plan} value={p.plan}>{p.plan} — {p.paymentAmount.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}/mês</option>)}
    </select></label><p className="insight-caption">O preço é definido pelo plano. A contratação será vinculada à sua conta.</p>{error && <p role="alert" className="form-error">{error}</p>}</div>
    <div className="modal-footer"><button type="button" className="btn btn-light" disabled={busy} onClick={onFechar}>Voltar</button><button className="btn btn-primary" disabled={busy || !plans.length}>{busy ? 'Salvando…' : inicial ? 'Salvar plano' : 'Criar assinatura'}</button></div></form>
  </div></div>
}