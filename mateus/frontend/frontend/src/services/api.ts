import { currentSession, endSession, isCurrentSession } from './session'

const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/backend').replace(/\/$/, '')

export async function request<T>(path: string, init: RequestInit = {}, withAuth = true): Promise<T> {
  const session = currentSession()
  const token = withAuth ? session.token : null
  let response: Response
  try {
    response = await fetch(`${baseUrl}${path.startsWith('/') ? path : '/' + path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    })
  } catch (error) {
    if (init.signal?.aborted) throw error
    throw new Error('Não foi possível conectar ao Spring Boot. Verifique a porta 8080 e o proxy do Docker.')
  }

  if (withAuth && !isCurrentSession(session)) throw new Error('Resposta de uma sessão encerrada.')
  if (response.status === 401 && withAuth) endSession()
  if (!response.ok) {
    let mensagem = ''
    try {
      const payload: unknown = await response.json()
      if (payload && typeof payload === 'object') {
        const body = payload as Record<string, unknown>
        mensagem = String(body.detail ?? body.message ?? body.error ?? '')
      }
    } catch {}
    const fallback = response.status === 401 ? 'Sessão inválida ou expirada. Entre novamente.'
      : response.status === 403 ? 'Acesso negado para este usuário.'
        : response.status === 404 ? `Registro não encontrado ou indisponível para esta conta.`
          : `Erro HTTP ${response.status} ao acessar ${path}.`
    throw new Error(mensagem || fallback)
  }
  if (response.status === 204) return undefined as T
  const text = await response.text()
  if (withAuth && !isCurrentSession(session)) throw new Error('Resposta de uma sessão encerrada.')
  if (!text) return undefined as T
  try { return JSON.parse(text) as T }
  catch { throw new Error('Resposta do backend não é JSON válido.') }
}
