import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, CalendarDays, CheckCircle2,
  ChevronRight, CreditCard, LayoutDashboard, LoaderCircle, Menu,
  MoreHorizontal, Plus, RefreshCw, Search, Settings2, ShieldCheck, Trash2,
  TrendingUp, Users, Wallet, X, Pencil, AlertCircle, LogOut,
} from 'lucide-react'
import AssinaturaModal from './components/AssinaturaModal'
import Payments from './components/Payments'
import Login from './components/Login'
import AdminPanel from './components/AdminPanel'

import { auth } from './services/auth'
import { assinaturasApi } from './services/assinaturas'
import { currentSession, isCurrentSession } from './services/session'
import { utcToday, addUtcDays } from './services/dates'
import type { Assinatura, AssinaturaInput, FiltroStatus, StatusAssinatura } from './types/assinatura'

type Tela = 'painel' | 'assinaturas' | 'pagamentos' | 'admin'
const statusLabel: Record<StatusAssinatura, string> = { ATIVA: 'Ativa', VENCIDA: 'Vencida', PENDENTE: 'Pendente', CANCELADA: 'Cancelada', CANCELAMENTO_AGENDADO: 'Cancelamento agendado', SUSPENSA: 'Suspensa' }
const dinheiro = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
const dataBR = (data: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return data || '—'
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}
const nomeCurto = (nome: string) => nome.split(' ').filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase() || '??'

function Badge({ status }: { status: StatusAssinatura }) {
  return <span className={`status status-${status.toLowerCase()}`}><i />{statusLabel[status]}</span>
}

function Linha({ assinatura, onEditar, onExcluir, onRetomar }: {
  assinatura: Assinatura
  onEditar: (assinatura: Assinatura) => void
  onExcluir: (assinatura: Assinatura) => void
  onRetomar: (assinatura: Assinatura) => void
}) {
  return (
    <tr>
      <td>
        <div className="person">
          <div className="avatar">{nomeCurto(assinatura.cliente)}</div>
          <div className="person-info"><strong>{assinatura.cliente || 'Cliente sem nome'}</strong><span>{assinatura.email || 'E-mail não informado'}</span></div>
        </div>
      </td>
      <td><span className="plan-chip">#{assinatura.id} · {assinatura.plano || '—'}</span></td>
      <td className="amount">{dinheiro(assinatura.valor)}</td>
      <td><Badge status={assinatura.status} /></td>
      <td className="date-cell">{dataBR(assinatura.proximoVencimento)}</td>
      <td>
        <div className="actions">
          {assinatura.status === 'CANCELAMENTO_AGENDADO' && <button className="btn btn-light" onClick={() => onRetomar(assinatura)}>Retomar</button>}
          <button disabled={assinatura.status !== 'PENDENTE'} className="icon-btn" title="Alterar plano pendente" aria-label={`Editar ${assinatura.cliente}`} onClick={() => onEditar(assinatura)}><Pencil size={16} /></button>
          <button disabled={assinatura.status === 'CANCELADA'} className="icon-btn danger-hover" title="Cancelar assinatura" aria-label={`Cancelar ${assinatura.cliente}`} onClick={() => onExcluir(assinatura)}><Trash2 size={16} /></button>
        </div>
      </td>
    </tr>
  )
}

export default function App() {
  const [signedIn, setSignedIn] = useState(auth.isSignedIn)
  const [isAdmin, setIsAdmin] = useState(false)
  const [tela, setTela] = useState<Tela>('painel')
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<FiltroStatus>('TODAS')
  const [modal, setModal] = useState<{ assinatura?: Assinatura } | null>(null)
  const [excluindo, setExcluindo] = useState<Assinatura | null>(null)
  const [processandoExclusao, setProcessandoExclusao] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [menuMobile, setMenuMobile] = useState(false)
  const [erroCancelamento, setErroCancelamento] = useState('')
  const [today, setToday] = useState(utcToday)
  const refreshSequence = useRef(0)
  const mounted = useRef(false)

  useEffect(() => {
    let active = true
    const session = currentSession()
    if (signedIn) auth.me().then(user => { if (active && isCurrentSession(session)) setIsAdmin(user.role === 'ADMIN') }).catch(() => {})
    return () => { active = false }
  }, [signedIn])

  const carregar = useCallback(async () => {
    if (!signedIn) return
    const sequence = ++refreshSequence.current
    const session = currentSession()
    const isCurrent = () => mounted.current && sequence === refreshSequence.current && isCurrentSession(session)
    setLoading(true)
    setErro('')
    try {
      const result = await assinaturasApi.listar()
      if (isCurrent()) setAssinaturas(result)
    } catch (error) {
      if (isCurrent()) setErro(error instanceof Error ? error.message : 'Falha ao buscar assinaturas.')
    } finally {
      if (isCurrent()) setLoading(false)
    }
  }, [signedIn])

  useEffect(() => {
    mounted.current = true
    void carregar()
    return () => { mounted.current = false; refreshSequence.current++ }
  }, [carregar, today])

  useEffect(() => {
    const expired = () => {
      refreshSequence.current++
      setSignedIn(false)
      setIsAdmin(false)
      setAssinaturas([])
      setModal(null)
      setExcluindo(null)
      setMensagem('')
      setErro('')
      setErroCancelamento('')
      setProcessandoExclusao(false)
      setTela('painel')
      setBusca('')
      setFiltro('TODAS')
      setMenuMobile(false)
    }
    window.addEventListener('session-expired', expired)
    return () => window.removeEventListener('session-expired', expired)
  }, [])

  useEffect(() => {
    const tick = () => setToday(utcToday())
    const timer = setTimeout(tick, Date.parse(`${addUtcDays(today, 1)}T00:00:00Z`) - Date.now() + 50)
    window.addEventListener('focus', tick)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('focus', tick)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [today])

  const atuais = useMemo(() => assinaturas.map(a =>
    a.status === 'ATIVA' && a.proximoVencimento && a.proximoVencimento <= today
      ? { ...a, status: 'VENCIDA' as const } : a.status === 'CANCELAMENTO_AGENDADO' && a.proximoVencimento && a.proximoVencimento <= today ? { ...a, status: 'CANCELADA' as const } : a
  ), [assinaturas, today])

  const dados = useMemo(() => {
    const ativas = atuais.filter((a) => a.status === 'ATIVA' || a.status === 'CANCELAMENTO_AGENDADO')
    const vencidas = atuais.filter((a) => a.status === 'VENCIDA')
    const pendentes = atuais.filter((a) => a.status === 'PENDENTE' || a.status === 'SUSPENSA')
    const canceladas = atuais.filter((a) => a.status === 'CANCELADA')
    const receita = ativas.reduce((soma, a) => soma + a.valor, 0)
    const limite = addUtcDays(today, 7)
    const vencendo = ativas.filter((a) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(a.proximoVencimento)) return false
      return a.proximoVencimento > today && a.proximoVencimento <= limite
    }).length
    return { ativas, vencidas, pendentes, canceladas, receita, vencendo }
  }, [atuais, today])

  const filtradas = useMemo(() => atuais.filter((a) => {
    const correspondeStatus = filtro === 'TODAS' || a.status === filtro
    const texto = `${a.cliente} ${a.email} ${a.plano} ${a.id}`.toLocaleLowerCase('pt-BR')
    return correspondeStatus && texto.includes(busca.trim().toLocaleLowerCase('pt-BR'))
  }), [atuais, filtro, busca])

  const recentes = useMemo(() => [...atuais]
    .sort((a, b) => b.dataInicio.localeCompare(a.dataInicio))
    .slice(0, 5), [atuais])

  async function salvar(input: AssinaturaInput) {
    const session = currentSession()
    if (modal?.assinatura) await assinaturasApi.atualizar(modal.assinatura.id, input)
    else await assinaturasApi.criar(input)
    if (!mounted.current || !isCurrentSession(session)) return
    setModal(null)
    setMensagem(modal?.assinatura ? 'Assinatura atualizada com sucesso.' : 'Assinatura criada com sucesso.')
    await carregar()
  }

  async function retomar(assinatura: Assinatura) {
    const session = currentSession()
    try {
      await assinaturasApi.retomar(assinatura.id)
      if (!mounted.current || !isCurrentSession(session)) return
      setMensagem('Renovação retomada.')
      await carregar()
    } catch (error) {
      if (mounted.current && isCurrentSession(session)) setErro(error instanceof Error ? error.message : 'Não foi possível retomar.')
    }
  }

  async function excluir() {
    if (!excluindo) return
    const session = currentSession()
    const isCurrent = () => mounted.current && isCurrentSession(session)
    setProcessandoExclusao(true)
    setErroCancelamento('')
    setMensagem('')
    try {
      await assinaturasApi.excluir(excluindo.id)
      if (!isCurrent()) return
      setExcluindo(null)
      setMensagem('Cancelamento solicitado. O acesso permanece até o fim do período pago.')
      await carregar()
    } catch (error) {
      if (isCurrent()) setErroCancelamento(error instanceof Error ? error.message : 'Não foi possível cancelar.')
    } finally {
      if (isCurrent()) setProcessandoExclusao(false)
    }
  }

  function navegar(proxima: Tela) {
    setTela(proxima)
    setMenuMobile(false)
  }

  const periodo = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${today}T00:00:00Z`))

  if (!signedIn) return <Login onEntrar={() => setSignedIn(true)}/>

  return (
    <div className="app-shell">
      {menuMobile && <div className="mobile-scrim" onClick={() => setMenuMobile(false)} />}
      <aside className={`sidebar ${menuMobile ? 'sidebar-open' : ''}`}>
        <div className="brand"><div className="brand-symbol"><ShieldCheck size={24} strokeWidth={2.2} /></div><div><strong>Gestão de<br/><span>Assinaturas</span></strong><small>MINHA CONTA</small></div></div>
        <div className="workspace-label">ESPAÇO DE TRABALHO</div>
        <nav className="side-nav" aria-label="Navegação principal">
          <button className={tela === 'painel' ? 'nav-item active' : 'nav-item'} onClick={() => navegar('painel')}><LayoutDashboard size={19} /> Visão geral <ChevronRight size={15} className="nav-chevron" /></button>
          <button className={tela === 'assinaturas' ? 'nav-item active' : 'nav-item'} onClick={() => navegar('assinaturas')}><CreditCard size={19} /> Assinaturas <ChevronRight size={15} className="nav-chevron" /></button>
          <button className={tela === 'pagamentos' ? 'nav-item active' : 'nav-item'} onClick={() => navegar('pagamentos')}><Wallet size={19} /> Pagamentos <ChevronRight size={15} className="nav-chevron" /></button>
          {isAdmin && <button className={tela === 'admin' ? 'nav-item active' : 'nav-item'} onClick={() => navegar('admin')}><ShieldCheck size={19} /> Administração</button>}
        </nav>
        <div className="side-bottom">
          <div className="side-note"><div className="side-note-icon"><Activity size={18} /></div><strong>Tudo em um só lugar.</strong><p>Acompanhe as assinaturas e mantenha tudo sob controle.</p></div>
          <div className="side-footer"><div className="team-avatar">GA</div><div><strong>Minha conta</strong><span>Minhas assinaturas</span></div><MoreHorizontal size={18} /></div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left"><button className="icon-btn menu-toggle" aria-label="Abrir menu" onClick={() => setMenuMobile(true)}><Menu size={21} /></button><span>Minha conta</span><ChevronRight size={15} /><strong>{tela === 'painel' ? 'Visão geral' : tela === 'admin' ? 'Administração' : tela === 'pagamentos' ? 'Pagamentos' : 'Assinaturas'}</strong></div>
          <div className="topbar-right"><span className="environment"><span className="env-dot" />Minha conta</span><span className="topbar-divider" /><span className="topbar-avatar">GA</span><button className="icon-btn logout-btn" onClick={() => auth.logout()} title="Sair" aria-label="Sair da conta"><LogOut size={19}/></button></div>
        </header>

        <main className="content">
          {tela !== 'pagamentos' && tela !== 'admin' && <div className="page-heading">
            <div><div className="breadcrumb"><span>GERENCIAMENTO</span><ChevronRight size={12} /><span>{tela === 'painel' ? 'DASHBOARD' : 'ASSINATURAS'}</span></div><h1>{tela === 'painel' ? 'Visão geral' : 'Assinaturas'}</h1><p>{tela === 'painel' ? 'Acompanhe seus números e o desempenho das assinaturas.' : 'Gerencie seus planos e acompanhe a situação de cada assinatura.'}</p></div>
            <div className="heading-actions"><button className="btn btn-light" onClick={() => void carregar()} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''} /> Atualizar</button><button className="btn btn-primary" onClick={() => setModal({})}><Plus size={17} /> Nova assinatura</button></div>
          </div>}

          {tela !== 'pagamentos' && tela !== 'admin' && erro && <div className="alert-banner" role="alert"><AlertCircle size={19} /><div><strong>Não foi possível carregar os dados.</strong><p>{erro}</p></div><button className="btn btn-light" onClick={() => void carregar()}>Tentar novamente</button></div>}
          {mensagem && <div className="toast" role="status"><CheckCircle2 size={18} /><span>{mensagem}</span><button className="icon-btn" onClick={() => setMensagem('')} aria-label="Fechar mensagem"><X size={16} /></button></div>}

          {tela !== 'pagamentos' && tela !== 'admin' && <div className="stats-grid">
            <div className="stat-card"><div className="stat-top"><span>Assinaturas totais</span><span className="stat-icon violet"><Users size={19} /></span></div><strong>{loading ? '—' : assinaturas.length}</strong><div className="stat-bottom"><span className="mini-pill neutral"><Activity size={12} /> Base atual</span><span>Todos os registros</span></div></div>
            <div className="stat-card"><div className="stat-top"><span>Assinaturas ativas</span><span className="stat-icon green"><CheckCircle2 size={19} /></span></div><strong>{loading ? '—' : dados.ativas.length}</strong><div className="stat-bottom"><span className="mini-pill positive"><ArrowUpRight size={13} /> Ativas</span><span>Planos em vigor</span></div></div>
            <div className="stat-card"><div className="stat-top"><span>Valor mensal dos planos</span><span className="stat-icon blue"><Wallet size={19} /></span></div><strong className="money-stat">{loading ? '—' : dinheiro(dados.receita)}</strong><div className="stat-bottom"><span className="mini-pill neutral"><TrendingUp size={13} /> Mensal</span><span>Soma dos seus planos</span></div></div>
            <div className="stat-card"><div className="stat-top"><span>Vencendo em 7 dias</span><span className="stat-icon amber"><CalendarDays size={19} /></span></div><strong>{loading ? '—' : dados.vencendo}</strong><div className="stat-bottom"><span className="mini-pill warning"><ArrowDownRight size={13} /> Atenção</span><span>Assinaturas ativas</span></div></div>
          </div>}

          {tela === 'admin' ? <AdminPanel /> : tela === 'pagamentos' ? <Payments onChanged={carregar} today={today}/> : tela === 'painel' ? (
            <>
              <div className="overview-grid">
                <section className="panel status-panel">
                  <div className="panel-title"><div><h2>Distribuição das assinaturas</h2><p>Panorama por situação atual</p></div><span className="panel-icon"><Settings2 size={18} /></span></div>
                  <div className="distribution">
                    <div className="distribution-total"><strong>{assinaturas.length}</strong><span>assinaturas cadastradas</span></div>
                    <div className="distribution-track"><span style={{ width: `${assinaturas.length ? dados.ativas.length / assinaturas.length * 100 : 0}%` }} className="dist-active" /><span style={{ width: `${assinaturas.length ? dados.vencidas.length / assinaturas.length * 100 : 0}%` }} className="dist-pending" /><span style={{ width: `${assinaturas.length ? dados.pendentes.length / assinaturas.length * 100 : 0}%` }} className="dist-pending" /><span style={{ width: `${assinaturas.length ? dados.canceladas.length / assinaturas.length * 100 : 0}%` }} className="dist-cancelled" /></div>
                    <div className="legend"><span><i className="dot active-dot" />Ativas <strong>{dados.ativas.length}</strong></span><span><i className="dot pending-dot" />Vencidas <strong>{dados.vencidas.length}</strong></span><span><i className="dot pending-dot" />Pendentes <strong>{dados.pendentes.length}</strong></span><span><i className="dot canceled-dot" />Canceladas <strong>{dados.canceladas.length}</strong></span></div>
                  </div>
                </section>
                <section className="panel insights-panel"><div className="panel-title"><div><h2>Resumo do período</h2><p>{periodo[0].toUpperCase() + periodo.slice(1)}</p></div><span className="panel-icon"><Bell size={18} /></span></div><div className="insight-main"><div className="insight-icon"><CreditCard size={22} /></div><div><span>Total mensal em planos ativos</span><strong>{dinheiro(dados.receita)}</strong></div></div><p className="insight-caption">Total dos seus planos ativos. Consulte os pagamentos para ver cada tentativa de cobrança.</p><button className="link-btn" onClick={() => navegar('assinaturas')}>Gerenciar assinaturas <ArrowRight size={16} /></button></section>
              </div>
              <section className="panel table-panel"><div className="panel-title list-title"><div><h2>Assinaturas recentes</h2><p>Últimos registros por data de início</p></div><button className="link-btn" onClick={() => navegar('assinaturas')}>Ver todas <ArrowRight size={16} /></button></div>{renderTabela(recentes, loading, setModal, (item) => { setErroCancelamento(''); setExcluindo(item) }, retomar)}</section>
            </>
          ) : (
            <section className="panel table-panel big-table">
              <div className="table-toolbar"><div><h2>Todas as assinaturas</h2><p>{filtradas.length} registro(s) encontrado(s)</p></div><div className="toolbar-controls"><label className="search-box"><Search size={18} /><input aria-label="Buscar assinaturas" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar cliente, plano..." /></label><label className="filter-select"><Settings2 size={17} /><select aria-label="Filtrar por status" value={filtro} onChange={(e) => setFiltro(e.target.value as FiltroStatus)}><option value="TODAS">Todos os status</option><option value="ATIVA">Ativas</option><option value="VENCIDA">Vencidas</option><option value="PENDENTE">Pendentes</option><option value="CANCELADA">Canceladas</option><option value="CANCELAMENTO_AGENDADO">Cancelamento agendado</option><option value="SUSPENSA">Suspensas</option></select></label></div></div>
              {renderTabela(filtradas, loading, setModal, (item) => { setErroCancelamento(''); setExcluindo(item) }, retomar)}
            </section>
          )}
          <footer className="footer"><span>Gestão de Assinaturas · Central de assinaturas</span><span>Pagamentos simulados</span></footer>
        </main>
      </div>


      {modal && <AssinaturaModal inicial={modal.assinatura} onFechar={() => setModal(null)} onSalvar={salvar} />}
      {excluindo && <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !processandoExclusao) setExcluindo(null) }}><div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title"><div className="delete-bubble"><Trash2 size={23} /></div><h2 id="confirm-title">Cancelar assinatura?</h2><p>Você está prestes a cancelar a assinatura de <strong>{excluindo.cliente}</strong>. O acesso permanece até o fim do período pago e a renovação é desativada.</p>{erroCancelamento && <p className="form-error" role="alert">{erroCancelamento}</p>}<div className="confirm-actions"><button className="btn btn-light" onClick={() => setExcluindo(null)} disabled={processandoExclusao}>Cancelar</button><button className="btn btn-danger" onClick={() => void excluir()} disabled={processandoExclusao}>{processandoExclusao ? 'Cancelando…' : 'Sim, cancelar'}</button></div></div></div>}
    </div>
  )
}

function renderTabela(
  lista: Assinatura[],
  carregando: boolean,
  setModal: (modal: { assinatura?: Assinatura } | null) => void,
  setExcluindo: (item: Assinatura | null) => void,
  retomar: (item: Assinatura) => void,
) {
  if (carregando) return <div className="table-message"><LoaderCircle size={25} className="spin" /> Carregando assinaturas…</div>
  if (!lista.length) return <div className="empty-state"><div><CreditCard size={27} /></div><strong>Nenhuma assinatura encontrada</strong><p>Quando houver registros, eles aparecerão aqui. Você também pode criar sua primeira assinatura.</p></div>
  return <div className="table-scroll"><table className="data-table"><thead><tr><th>TITULAR</th><th>PLANO</th><th>VALOR / MÊS</th><th>STATUS</th><th>PRÓX. VENCIMENTO</th><th>AÇÕES</th></tr></thead><tbody>{lista.map((assinatura) => <Linha key={assinatura.id} assinatura={assinatura} onEditar={(item) => setModal({ assinatura: item })} onExcluir={setExcluindo} onRetomar={retomar} />)}</tbody></table></div>
}
