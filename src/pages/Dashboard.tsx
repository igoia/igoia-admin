import { useEffect, useState, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import MetricCards from '../components/MetricCards'
import ClientsTable from '../components/ClientsTable'
import Clients from './Clients'
import type { Client } from '../types'

interface Props {
  session: Session
}

export default function Dashboard({ session }: Props) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState('dashboard')

  const fetchClients = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: dbError } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    if (dbError) {
      setError(dbError.message)
    } else {
      setClients((data as Client[]) ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])

  function renderPage() {
    switch (page) {
      case 'clients':
        return <Clients />
      case 'billing':
        return <div style={{ padding: '32px', color: '#6B7A8D' }}>Billing — próximamente</div>
      case 'automations':
        return <div style={{ padding: '32px', color: '#6B7A8D' }}>Automatizaciones — próximamente</div>
      case 'invoices':
        return <div style={{ padding: '32px', color: '#6B7A8D' }}>Facturas SII — próximamente</div>
      default:
        return (
          <>
            <div className="page-header">
              <h2>Dashboard</h2>
              <p>Vista general de clientes y métricas IGoIA</p>
            </div>
            <MetricCards clients={clients} loading={loading} />
            {error && <div className="login-error">{error}</div>}
            <ClientsTable clients={clients} loading={loading} onRefresh={fetchClients} />
          </>
        )
    }
  }

  return (
    <Layout session={session} currentPage={page} onNavigate={setPage}>
      {renderPage()}
    </Layout>
  )
}
