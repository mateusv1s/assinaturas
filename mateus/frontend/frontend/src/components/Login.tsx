import { useState, type FormEvent } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react'
import { auth } from '../services/auth'
export default function Login({ onEntrar }: { onEntrar: () => void }) {
  const [register, setRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setBusy(true)
    try {
      if (register) await auth.register(name, email, password)
      else await auth.login(email, password)
      onEntrar()
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível entrar.') }
    finally { setBusy(false) }
  }
  return <div className="login-layout">
    <section className="login-brand-side">
      <div className="login-logo"><div className="brand-symbol"><ShieldCheck size={27}/></div><strong>Gestão de<br/><span>Assinaturas</span></strong></div>
      <div className="login-hero"><div className="login-eyebrow"><Sparkles size={15}/> CENTRAL DE ASSINATURAS</div>
        <h1>Seus planos.<br/><em>Tudo sob controle.</em></h1>
        <p>Escolha um plano, acompanhe sua assinatura e consulte seus pagamentos em um só lugar.</p>
        <div className="login-metric"><div className="login-metric-icon"><ShieldCheck size={21}/></div><div><strong>Seu espaço, suas assinaturas</strong><span>Acesso individual e histórico organizado</span></div></div>
      </div><small>Gestão de Assinaturas · Projeto de estudos</small>
    </section>
    <section className="login-form-side"><div className="login-form-wrapper">
      <div className="login-welcome-icon"><LockKeyhole size={26}/></div>
      <span className="eyebrow">{register ? 'COMECE POR AQUI' : 'BEM-VINDO DE VOLTA'}</span>
      <h2>{register ? 'Crie sua conta' : 'Acesse seu painel'}</h2>
      <p>{register ? 'Cadastre-se para escolher sua primeira assinatura.' : 'Entre para acompanhar seus planos e pagamentos.'}</p>
      <form onSubmit={submit} className="login-form">
        {register && <label className="field">Nome<input required maxLength={100} value={name} onChange={e=>setName(e.target.value)} autoComplete="name"/></label>}
        <label className="field">E-mail<input type="email" required maxLength={255} value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label>
        <label className="field">Senha<div className="password-wrap">
          <input type={visible ? 'text' : 'password'} required minLength={register ? 8 : undefined} maxLength={register ? 20 : 72} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={register ? 'new-password' : 'current-password'} placeholder={register ? 'De 8 a 20 caracteres' : 'Sua senha'}/>
          <button type="button" onClick={()=>setVisible(v=>!v)} aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
        </div></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="btn btn-primary login-submit" disabled={busy}>{busy ? 'Aguarde…' : register ? 'Criar conta' : 'Entrar'}<ArrowRight size={18}/></button>
      </form>
      <button className="login-token-toggle" disabled={busy} onClick={()=>{setRegister(v=>!v);setError('')}}>{register ? 'Já tenho conta. Entrar' : 'Ainda não tenho conta. Cadastrar'}</button>
    </div></section>
  </div>
}