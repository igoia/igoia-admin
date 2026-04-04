import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Client {
  id: string
  business_name: string
  rut: string | null
  email: string
  phone: string | null
  address: string | null
  comuna: string | null
  ciudad: string | null
  plan: string
  status: string
  created_at: string
}

const PLAN_COLORS: Record<string, string> = {
  starter: '#00E87A',
  pro: '#00C8F0',
  enterprise: '#A78BFA',
  trial: '#F59E0B',
}

const STATUS_COLORS: Record<string, string> = {
  active: '#00E87A',
  trial: '#F59E0B',
  suspended: '#EF4444',
  inactive: '#6B7A8D',
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<Client | null>(null)

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    setLoading(true)
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setClients(data)
    setLoading(false)
  }

  const filtered = clients.filter(c => {
    const matchSearch =
      c.business_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.rut?.toLowerCase().includes(search.toLowerCase())
    const matchPlan = planFilter === 'all' || c.plan === planFilter
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchPlan && matchStatus
  })

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('es-CL')
  }

  return (
    <div style={{ padding: '32px', color: '#E8EDF2', minHeight: '100vh', background: '#070B0F' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Clientes</h1>
        <p style={{ color: '#6B7A8D', fontSize: '14px', marginTop: '4px' }}>
          {filtered.length} de {clients.length} clientes
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          placeholder="Buscar empresa, email, RUT..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: '200px', background: '#111820', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px', padding: '10px 14px', color: '#E8EDF2', fontSize: '14px', outline: 'none'
          }}
        />
        <select
          value={planFilter}
          onChange={e => setPlanFilter(e.target.value)}
          style={{
            background: '#111820', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px', padding: '10px 14px', color: '#E8EDF2', fontSize: '14px', cursor: 'pointer'
          }}
        >
          <option value="all">Todos los planes</option>
          <option value="trial">Trial</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            background: '#111820', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px', padding: '10px 14px', color: '#E8EDF2', fontSize: '14px', cursor: 'pointer'
          }}
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspendido</option>
          <option value="inactive">Inactivo</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#0C1117', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6B7A8D' }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6B7A8D' }}>No hay clientes</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Empresa', 'Plan', 'Estado', 'Email', 'Ciudad', 'Registrado'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7A8D', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c)}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{c.business_name}</div>
                    {c.rut && <div style={{ fontSize: '12px', color: '#6B7A8D' }}>{c.rut}</div>}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: `${PLAN_COLORS[c.plan] || '#6B7A8D'}20`, color: PLAN_COLORS[c.plan] || '#6B7A8D', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }}>
                      {c.plan}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: `${STATUS_COLORS[c.status] || '#6B7A8D'}20`, color: STATUS_COLORS[c.status] || '#6B7A8D', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }}>
                      {c.status === 'active' ? 'Activo' : c.status === 'trial' ? 'Trial' : c.status === 'suspended' ? 'Suspendido' : c.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#9BA8B9' }}>{c.email}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#9BA8B9' }}>{c.ciudad || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#9BA8B9' }}>{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '380px', height: '100vh', background: '#0C1117', borderLeft: '1px solid rgba(255,255,255,0.08)', padding: '28px', overflowY: 'auto', zIndex: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>Detalle</h2>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#6B7A8D', fontSize: '20px', cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ fontWeight: 700, fontSize: '20px', marginBottom: '4px' }}>{selected.business_name}</div>
          <div style={{ color: '#6B7A8D', fontSize: '13px', marginBottom: '24px' }}>{selected.rut || 'Sin RUT'}</div>
          {[
            ['Email', selected.email],
            ['Teléfono', selected.phone || '—'],
            ['Ciudad', selected.ciudad || '—'],
            ['Comuna', selected.comuna || '—'],
            ['Dirección', selected.address || '—'],
            ['Plan', selected.plan],
            ['Estado', selected.status],
            ['Registrado', formatDate(selected.created_at)],
          ].map(([label, value]) => (
            <div key={label} style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7A8D', marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '14px', color: '#E8EDF2' }}>{value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
