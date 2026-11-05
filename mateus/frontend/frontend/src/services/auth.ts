import { request } from './api'
import { currentSession, endSession, startSession } from './session'
export type User = { id: number; name: string; email: string; role: string }
type AuthResponse = { token: string; user: User }
async function authenticate(path: string, body: object) {
  const data = await request<AuthResponse>(path, { method: 'POST', body: JSON.stringify(body) }, false)
  startSession(data.token)
}
export const auth = {
  isSignedIn: () => Boolean(currentSession().token),
  login: (email: string, password: string) => authenticate('/api/auth/login', { email, password }),
  register: (name: string, email: string, password: string) => authenticate('/api/auth/register', { name, email, password }),
  me: () => request<User>('/api/users/me'),
  logout: endSession,
}
