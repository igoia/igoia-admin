import { useState } from 'react'
import type { Client, PlanType, ClientStatus } from '../types'
import { PLAN_LABEL, STATUS_LABEL, PLAN_PRICE } from '../types'

interface Props {
  clients: Client[]
  loading: boolean
  onRefresh: () => void
}

const PAGE_SIZE = 20

function fmt(n: number) { return n.toLocaleString('es-CL') }

function PlanBadge({ plan }: { plan: PlanType }) {
  return <span className={`badge badge-${plan}`}>{PLAN_LABEL[plan]}</span>
}

function StatusBadge({ status }: { status: ClientStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ClientsTable({ clients, loading, onRefresh }: Props) {
  const [search,     setSearch]     = useState('')
  const [planFilter, setPlanFilter] = useState<PlanType | ''>('')
  const [statFilter, setStatFilter] = useState<ClientStatus | ''>('')
  const [page,       setPage]       = useState(1)

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      c.business_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.rut ?? '').toLowerCase().includes(q)
    const matchPlan   = !planFilter || c.plan   === planFilter
    const matchStatus = !statFilter || c.status === statFilter
    return matchSearch && matchPlan && matchStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function handleSearch(v: string) { setSearch(v); setPage(1) }
  function handlePlan(v: string)   { setPlanFilter(v as PlanType | ''); setPage(1) }
  function handleStat(v: string)   { setStatFilter(v as ClientStatus | ''); setPage(1) }

  return (
    <div className="section-card">
      <div className="section-header">
        <div>
          <span className="section-title">Clientes</span>
          {'  '}
          <span className="section-count">
            {loading ? '…' : `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        <div className="table-controls">
          <input
            className="search-input"
            placeholder="Buscar empresa, email, RUT…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />

          <select className="filter-select" value={planFilter} onChange={e => handlePlan(e.target.value)}>
            <option value="">Todos los planes</option>
            <option value="trial">Trial</option>
            <option value="starter">Starter</option>
            <option value="business">Business</option>
            <option value="scale">Scale</option>
          </select>

          <select className="filter-select" value={statFilter} onChange={e => handleStat(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="trial">Trial</option>
            <option value="active">Activo</option>
            <option value="suspended">Suspendido</option>
            <option value="cancelled">Cancelado</option>
          </select>

          <button className="refresh-btn" onClick={onRefresh} title="Recargar">
            ↻
          </button>
        </div>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="table-empty">
            <div className="icon">⏳</div>
            Cargando clientes…
          </div>
        ) : pageItems.length === 0 ? (
          <div className="table-empty">
            <div className="icon">🔍</div>
            {search || planFilter || statFilter ? 'Sin resultados para esa búsqueda.' : 'No hay clientes aún.'}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>RUT</th>
                <th>Plan</th>
                <th>Estado</th>
                <th>MRR</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Registrado</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.business_name}</div>
                    {c.ciudad && <div className="td-muted">{c.ciudad}</div>}
                  </td>
                  <td className="td-mono">{c.rut ?? <span className="td-muted">—</span>}</td>
                  <td><PlanBadge plan={c.plan} /></td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="td-mono">
                    {PLAN_PRICE[c.plan] > 0
                      ? <span style={{ color: 'var(--green)' }}>${fmt(PLAN_PRICE[c.plan])}</span>
                      : <span className="td-muted">—</span>}
                  </td>
                  <td className="td-muted">{c.email}</td>
                  <td className="td-muted">{c.phone ?? '—'}</td>
                  <td className="td-muted">{fmtDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && filtered.length > PAGE_SIZE && (
        <div className="pagination">
          <span>Página {currentPage} de {totalPages}</span>
          <div className="pagination-btns">
            <button
              className="page-btn"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ← Anterior
            </button>
            <button
              className="page-btn"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
