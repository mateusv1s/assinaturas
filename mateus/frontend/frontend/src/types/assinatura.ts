export type StatusAssinatura = 'ATIVA' | 'VENCIDA' | 'PENDENTE' | 'CANCELADA' | 'CANCELAMENTO_AGENDADO' | 'SUSPENSA'

export interface Assinatura {
  id: string
  cliente: string
  email: string
  plano: string
  valor: number
  status: StatusAssinatura
  dataInicio: string
  proximoVencimento: string
}

export type AssinaturaInput = Omit<Assinatura, 'id'>

export type FiltroStatus = 'TODAS' | StatusAssinatura
