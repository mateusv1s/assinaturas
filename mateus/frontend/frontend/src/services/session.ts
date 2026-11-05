const TOKEN_KEY = 'assinaturas.accessToken'
let revision = 0

export function currentSession() {
  return { token: sessionStorage.getItem(TOKEN_KEY), revision }
}

export function isCurrentSession(session: ReturnType<typeof currentSession>) {
  return session.revision === revision && session.token === sessionStorage.getItem(TOKEN_KEY)
}

export function startSession(token: string) {
  revision++
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function endSession() {
  revision++
  sessionStorage.removeItem(TOKEN_KEY)
  window.dispatchEvent(new Event('session-expired'))
}
