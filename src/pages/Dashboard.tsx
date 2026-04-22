import { useEffect, useState, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import Clients from './Clients'
import ClientBotMetrics from './ClientBotMetrics'

type Page = 'dashboard' | 'clients' | 'new-client' | 'billing' | 'automations' | 'sii' | 'bot-metrics'

interface Client {
  id: string
  business_name: string
  plan: string
  status: string
  email: string
  phone: string | null
  ciudad: string | null
  created_at: string
}

interface Props { session: Session }

const PLAN_PRICE: Record<string, number> = { trial: 0, starter: 89000, business: 249000, scale: 580000 }
const fmtCLP = (n: number) => '$' + n.toLocaleString('es-CL')

export default function Dashboard({ session }: Props) {
  const [page, setPage] = useState<Page>('dashboard')
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState({ mrr: 0, active: 0, total: 0, trial: 0, newMonth: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string } | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    if (data) {
      setClients(data)
      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const active = data.filter(c => c.status === 'active')
      const trial = data.filter(c => c.status === 'trial')
      const newMonth = data.filter(c => new Date(c.created_at) >= thisMonth)
      const mrr = active.reduce((s, c) => s + (PLAN_PRICE[c.plan] || 0), 0)
      setStats({ mrr, active: active.length, total: data.length, trial: trial.length, newMonth: newMonth.length })
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const navItems = [
    { key: 'dashboard', icon: '📊', label: 'Dashboard' },
    { key: 'clients', icon: '👥', label: 'Clientes' },
    { key: 'new-client', icon: '✨', label: 'Nuevo Cliente' },
    { key: 'billing', icon: '💳', label: 'Billing' },
    { key: 'automations', icon: '⚡', label: 'Automatizaciones' },
    { key: 'sii', icon: '🧾', label: 'Facturas SII' },
  ]

  const handleViewBot = (clientId: string, clientName: string) => {
    setSelectedClient({ id: clientId, name: clientName })
    setPage('bot-metrics')
  }

  return (
    <Layout
      navItems={navItems}
      currentPage={page}
      onNavigate={(p) => setPage(p as Page)}
      userEmail={session.user.email || ''}
      onSignOut={async () => { await supabase.auth.signOut() }}
    >
      {page === 'bot-metrics' && selectedClient && (
        <ClientBotMetrics clientId={selectedClient.id} clientName={selectedClient.name} onBack={() => setPage('clients')} />
      )}

      {page === 'dashboard' && (
        <div>
          <div className="page-header">
            <div>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-subtitle">Vista general de clientes y metricas IGoIA</p>
            </div>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>Cargando...</div>
          ) : (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">💰</div>
                  <div className="stat-value">{fmtCLP(stats.mrr)}</div>
                  <div className="stat-label">MRR</div>
                  <div className="stat-sublabel">CLP / mes</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-value">{stats.active}</div>
                  <div className="stat-label">CLIENTES ACTIVOS</div>
                  <div className="stat-sublabel">de {stats.total} totales</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⏳</div>
                  <div className="stat-value">{stats.trial}</div>
                  <div className="stat-label">EN TRIAL</div>
                  <div className="stat-sublabel">pendientes de conversion</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🚀</div>
                  <div className="stat-value">{stats.newMonth}</div>
                  <div className="stat-label">NUEVOS ESTE MES</div>
                  <div className="stat-sublabel">sin suspendidos</div>
                </div>
              </div>
              <Clients clients={clients} onRefresh={loadData} onViewBot={handleViewBot} />
            </>
          )}
        </div>
      )}

      {page === 'clients' && (
        <Clients clients={clients} onRefresh={loadData} onViewBot={handleViewBot} showHeader />
      )}

      {['new-client','billing','automations','sii'].includes(page) && (
        <div style={{ textAlign: 'center', padding: 80, color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
          <div style={{ fontSize: 18 }}>Proximamente</div>
        </div>
      )}
    </Layout>
  )
}