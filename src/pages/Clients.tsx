import { useState } from 'react'
import type { Client } from '../types'

const PLAN_LABEL: Record<string, string> = { trial: 'Trial', starter: 'Starter', business: 'Business', scale: 'Scale' }
const STATUS_LABEL: Record<string, string> = { trial: 'Trial', active: 'Activo', suspended: 'Suspendido', cancelled: 'Cancelado' }
const PLAN_PRICE: Record<string, number> = { trial: 0, starter: 89000, business: 249000, scale: 580000 }
const fmtCLP = (n: number) => '$' + n.toLocaleString('es-CL')
const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })

interface Props {
  clients: Client[]
  onRefresh: () => void
  onViewBot?: (clientId: string, clientName: string) => void
  showHeader?: boolean
}

export default function Clients({ clients, onRefresh, onViewBot, showHeader }: Props) {
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    return (!q || c.business_name.toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q)) &&
      (filterPlan === 'all' || c.plan === filterPlan) &&
      (filterStatus === 'all' || c.status === filterStatus)
  })

  return (
    <div>
      {showHeader && <div className="page-header"><div><h1 className="page-title">Clientes</h1></div></div>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Clientes {filtered.length} resultados</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="search-input" />
          <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)} className="filter-select">
            <option value="all">Todos los planes</option>
            <option value="trial">Trial</option>
            <option value="starter">Starter</option>
            <option value="business">Business</option>
            <option value="scale">Scale</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
            <option value="all">Todos los estados</option>
            <option value="trial">Trial</option>
            <option value="active">Activo</option>
            <option value="suspended">Suspendido</option>
            <option value="cancelled">Cancelado</option>
          </select>
          <button onClick={onRefresh} className="btn btn-secondary">Actualizar</button>
        </div>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>EMPRESA</th><th>RUT</th><th>PLAN</th><th>ESTADO</th><th>MRR</th><th>EMAIL</th><th>TEL</th><th>REGISTRO</th><th>BOT</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((client) => (
              <tr key={client.id}>
                <td><div style={{ fontWeight: 600 }}>{client.business_name}</div><div style={{ fontSize: 12, color: '#9ca3af' }}>{client.ciudad||''}</div></td>
                <td>{client.rut||'--'}</td>
                <td><span className={`plan-badge plan-${client.plan}`}>{PLAN_LABEL[client.plan]||client.plan}</span></td>
                <td><span className={`status-badge status-${client.status}`}>{STATUS_LABEL[client.status]||client.status}</span></td>
                <td style={{ fontWeight: 600 }}>{fmtCLP(PLAN_PRICE[client.plan]||0)}</td>
                <td style={{ fontSize: 13 }}>{client.email}</td>
                <td style={{ fontSize: 13 }}>{client.phone||'--'}</td>
                <td style={{ fontSize: 13 }}>{fmtDate(client.created_at)}</td>
                <td><button onClick={() => onViewBot && onViewBot(client.id, client.business_name)} style={{ background:'#059669', color:'white', border:'none', borderRadius:6, padding:'4px 12px', cursor:'pointer', fontSize:12 }}>Ver Bot</button></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={9} style={{ textAlign:'center', padding:48, color:'#9ca3af' }}>Sin resultados</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}