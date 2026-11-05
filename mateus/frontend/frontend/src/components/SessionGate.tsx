import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { auth } from '../services/auth'
import { currentSession, isCurrentSession } from '../services/session'
import Login from './Login'

export default function SessionGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'checking' | 'guest' | 'ready' | 'error'>('checking')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    const session = currentSession()
    const expired = () => setState('guest')
    window.addEventListener('session-expired', expired)
    if (!session.token) setState('guest')
    else {
      setState('checking')
      auth.me().then(() => {
        if (active && isCurrentSession(session)) setState('ready')
      }).catch(() => {
        if (active && isCurrentSession(session)) setState('error')
      })
    }
    return () => { active = false; window.removeEventListener('session-expired', expired) }
  }, [attempt])

  if (state === 'guest') return <Login onEntrar={() => setAttempt(value => value + 1)} />
  if (state === 'checking') return <main className="content" role="status">Verificando sua sessão…</main>
  if (state === 'error') return <main className="content"><p role="alert">Não foi possível verificar sua sessão.</p><button className="btn btn-primary" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button><button className="btn btn-light" onClick={auth.logout}>Voltar ao login</button></main>
  return children
}
