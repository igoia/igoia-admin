import { useEffect, useState } from 'react'

const SUPABASE_URL = 'https://ciealybuwbnpicxquwew.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpZWFseWJ1d2JucGljeHF1d2V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjY3MTgsImV4cCI6MjA5MDcwMjcxOH0.RUZFMEXgOu67Bgzx5AFgnjqb1VZO-xVPOcJXF6bcOjU'

interface Metrics {
  total_conversaciones: number
  reservas_confirmadas: number
  pendientes_pago: number
  flujo_reserva: number
  flujo_consultas: number
  flujo_soporte: number
  runs_count: number
  last_run_at: string | null
  automation_status: string
}

interface Monthly {
  mes: string
  conversaciones: number
  reservas_confirmadas: number
  flujo_reserva: number
  flujo_consultas: number
}

interface Reserva {
  reservation_code: string
  checkin_date: string | null
  checkout_date: string | null
  persons: number | null
  has_pet: boolean | null
  estado: string
  fecha_reserva: string | null
}

interface Props {
  clientId: string
  clientName: string
  onBack: () => void
}

const api = async (path: string) => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  })
  return r.json()
}

const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('es-CL') : '-'
const fmtMonth = (m: string) => {
  const [y, mo] = m.split('-')
  return ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][+mo] + ' ' + y
}

export default function ClientBotMetrics({ clientId, clientName, onBack }: Props) {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [monthly, setMonthly] = useState<Monthly[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'mensual' | 'reservas'>('overview')

  useEffect(() => {
    const load = async () => {
      try {
        const [m, mo, r] = await Promise.all([
          api(`igoia_bot_metrics?client_id=eq.${clientId}`),
          api('igoia_bot_monthly?order=mes.desc&limit=6'),
          api('igoia_reservas?order=fecha_reserva.desc'),
        ])
        if (m?.[0]) setMetrics(m[0])
        setMonthly(mo || [])
        setReservas(r || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [clientId])

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} className="btn btn-secondary" style={{ fontSize: 13 }}>
            Back
          </button>
          <div>
            <h1 className="page-title">Bot WhatsApp - {clientName}</h1>
            <p className="page-subtitle">Metricas de uso y reservas del bot Luna</p>
          </div>
        </div>
        {metrics?.automation_status === 'active' && (
          <span className="status-badge status-active">Bot Activo</span>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>Cargando...</div>
      ) : (
        <>
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: 24 }}>
            {[['overview','Resumen'],['mensual','Mensual'],['reservas','Reservas']].map(([k,l]) => (
              <button key={k} onClick={() => setTab(k as typeof tab)} style={{
                padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: tab === k ? 600 : 400,
                color: tab === k ? '#059669' : '#6b7280',
                borderBottom: tab === k ? '2px solid #059669' : '2px solid transparent',
              }}>{l}</button>
            ))}
          </div>

          {tab === 'overview' && (
            <>
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 24 }}>
                {[
                  { icon: '💬', val: metrics?.total_conversaciones ?? 0, label: 'Conversaciones' },
                  { icon: '✅', val: metrics?.reservas_confirmadas ?? 0, label: 'Reservas Confirmadas', color: '#059669' },
                  { icon: '⏳', val: metrics?.pendientes_pago ?? 0, label: 'Pendientes Pago', color: '#d97706' },
                  { icon: '🔄', val: metrics?.runs_count ?? 0, label: 'Ejecuciones' },
                ].map((s, i) => (
                  <div key={i} className="stat-card" style={{ borderTop: s.color ? `3px solid ${s.color}` : undefined }}>
                    <div className="stat-icon">{s.icon}</div>
                    <div className="stat-value" style={{ color: s.color }}>{s.val}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
                {[
                  { icon: '🏕', val: metrics?.flujo_reserva ?? 0, label: 'Reservar', color: '#059669' },
                  { icon: '❓', val: metrics?.flujo_consultas ?? 0, label: 'Consultas', color: '#3b82f6' },
                  { icon: '🛎', val: metrics?.flujo_soporte ?? 0, label: 'Soporte', color: '#f59e0b' },
                ].map((s, i) => (
                  <div key={i} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
                    <div className="stat-icon">{s.icon}</div>
                    <div className="stat-value" style={{ color: s.color }}>{s.val}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'mensual' && (
            <div className="table-container">
              {monthly.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9ca3af', padding: 48 }}>Sin datos mensuales</p>
              ) : (
                <table className="data-table">
                  <thead><tr><th>Mes</th><th>Conversaciones</th><th>Confirmadas</th><th>Reserva</th><th>Consultas</th></tr></thead>
                  <tbody>
                    {monthly.map((m, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{fmtMonth(m.mes)}</td>
                        <td>{m.conversaciones}</td>
                        <td style={{ color: '#059669', fontWeight: 700 }}>{m.reservas_confirmadas}</td>
                        <td>{m.flujo_reserva}</td>
                        <td>{m.flujo_consultas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'reservas' && (
            <div className="table-container">
              {reservas.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9ca3af', padding: 48 }}>Sin reservas aun</p>
              ) : (
                <table className="data-table">
                  <thead><tr><th>Codigo</th><th>Check-in</th><th>Checkout</th><th>Personas</th><th>Mascota</th><th>Estado</th><th>Fecha</th></tr></thead>
                  <tbody>
                    {reservas.map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#059669' }}>{r.reservation_code}</td>
                        <td>{fmt(r.checkin_date)}</td>
                        <td>{fmt(r.checkout_date)}</td>
                        <td style={{ textAlign: 'center' }}>{r.persons ?? '-'}</td>
                        <td style={{ textAlign: 'center' }}>{r.has_pet ? '🐾' : '-'}</td>
                        <td><span className={`status-badge ${r.estado === 'CONFIRMED' ? 'status-active' : 'status-trial'}`}>{r.estado}</span></td>
                        <td>{fmt(r.fecha_reserva)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}