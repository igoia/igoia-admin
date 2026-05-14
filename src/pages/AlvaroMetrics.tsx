import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  clientId: string
  clientName: string
  onBack: () => void
}

interface Vehicle {
  id: string; marca: string; modelo: string; anio: number
  precio: number; status: string; kilometraje: number | null
  created_at: string
}

interface Lead {
  id: string; contact_name: string; wa_phone_number: string
  estado: string; consultas_count: number; agendo_visita: boolean
  fecha_visita: string | null; created_at: string
}

const fmtCLP = (n: number) => '$' + n.toLocaleString('es-CL')

export default function AlvaroMetrics({ clientId, clientName, onBack }: Props) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'autos' | 'leads'>('overview')

  useEffect(() => { fetchData() }, [clientId])

  async function fetchData() {
    setLoading(true)
    const { data: v } = await supabase.from('alvaro_vehicles').select('*').eq('client_id', clientId).order('created_at', { ascending: false })
    const { data: l } = await supabase.from('alvaro_conversations').select('*').eq('client_id', clientId).order('created_at', { ascending: false })
    setVehicles(v || [])
    setLeads(l || [])
    setLoading(false)
  }

  const disponibles = vehicles.filter(v => v.status === 'disponible').length
  const vendidos = vehicles.filter(v => v.status === 'vendido').length
  const totalLeads = leads.length
  const visitas = leads.filter(l => l.agendo_visita).length
  const convRate = totalLeads > 0 ? Math.round((visitas / totalLeads) * 100) : 0

  const card = { background: '#0C1117', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', padding: '20px' }
  const tabStyle = (t: string) => ({
    padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontSize: '13px', fontWeight: 600,
    background: activeTab === t ? '#00E87A' : 'rgba(255,255,255,0.06)',
    color: activeTab === t ? '#070B0F' : '#9BA8B9',
  })

  if (loading) return <div style={{ padding: '32px', color: '#6B7A8D', textAlign: 'center' }}>Cargando métricas...</div>

  return (
    <div style={{ padding: '32px', color: '#E8EDF2', minHeight: '100vh', background: '#070B0F' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', padding: '8px 14px', color: '#E8EDF2', cursor: 'pointer', fontSize: '14px' }}>← Volver</button>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>🚗 Métricas Bot — {clientName}</h1>
          <p style={{ color: '#6B7A8D', fontSize: '14px', marginTop: '4px' }}>Bot WhatsApp · Álvaro</p>
        </div>
        <button onClick={fetchData} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', padding: '8px 14px', color: '#E8EDF2', cursor: 'pointer', fontSize: '13px' }}>↻ Actualizar</button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { v: disponibles, l: 'Autos disponibles', c: '#00E87A' },
          { v: vendidos, l: 'Autos vendidos', c: '#A78BFA' },
          { v: totalLeads, l: 'Leads totales', c: '#00C8F0' },
          { v: visitas, l: 'Visitas agendadas', c: '#F59E0B' },
          { v: convRate + '%', l: 'Tasa conversión', c: '#00E87A' },
        ].map(m => (
          <div key={m.l} style={{ ...card, flex: 1, minWidth: '110px', textAlign: 'center' as const }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: m.c }}>{m.v}</div>
            <div style={{ fontSize: '11px', color: '#6B7A8D', marginTop: '4px' }}>{m.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button style={tabStyle('overview')} onClick={() => setActiveTab('overview')}>📈 Resumen</button>
        <button style={tabStyle('autos')} onClick={() => setActiveTab('autos')}>🚗 Autos ({vehicles.length})</button>
        <button style={tabStyle('leads')} onClick={() => setActiveTab('leads')}>👥 Leads ({totalLeads})</button>
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ ...card, flex: 1, minWidth: '250px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>Catálogo</h3>
            {[
              { label: 'Disponibles', value: disponibles, color: '#00E87A' },
              { label: 'Reservados', value: vehicles.filter(v => v.status === 'reservado').length, color: '#F59E0B' },
              { label: 'Vendidos', value: vendidos, color: '#A78BFA' },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', color: '#9BA8B9' }}>{f.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: f.color }}>{f.value}</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                  <div style={{ height: '100%', width: vehicles.length > 0 ? (f.value / vehicles.length * 100) + '%' : '0%', background: f.color, borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ ...card, flex: 1, minWidth: '250px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>Embudo de ventas</h3>
            {[
              { label: 'Leads totales', value: totalLeads, color: '#6B7A8D' },
              { label: 'Interesados', value: leads.filter(l => l.estado === 'interesado').length, color: '#00C8F0' },
              { label: 'Visitas agendadas', value: visitas, color: '#F59E0B' },
              { label: 'Vendidos', value: leads.filter(l => l.estado === 'vendido').length, color: '#00E87A' },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', color: '#9BA8B9' }}>{f.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: f.color }}>{f.value}</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                  <div style={{ height: '100%', width: totalLeads > 0 ? (f.value / totalLeads * 100) + '%' : '0%', background: f.color, borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'autos' && (
        <div style={card}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>Catálogo de autos</h3>
          {vehicles.length === 0 ? <div style={{ color: '#6B7A8D', textAlign: 'center', padding: '32px' }}>Sin autos registrados</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Auto', 'Km', 'Precio', 'Estado', 'Publicado'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '10px', textTransform: 'uppercase', color: '#6B7A8D', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 12px', fontSize: '14px', fontWeight: 600 }}>{v.marca} {v.modelo} {v.anio}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: '#9BA8B9' }}>{v.kilometraje ? v.kilometraje.toLocaleString() + ' km' : '—'}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 600 }}>{fmtCLP(v.precio)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: v.status === 'disponible' ? '#00E87A20' : v.status === 'vendido' ? '#A78BFA20' : '#F59E0B20', color: v.status === 'disponible' ? '#00E87A' : v.status === 'vendido' ? '#A78BFA' : '#F59E0B', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                        {v.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '11px', color: '#6B7A8D' }}>{new Date(v.created_at).toLocaleDateString('es-CL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'leads' && (
        <div style={card}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>Leads</h3>
          {leads.length === 0 ? <div style={{ color: '#6B7A8D', textAlign: 'center', padding: '32px' }}>Sin leads registrados</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Nombre', 'Teléfono', 'Estado', 'Consultas', 'Visita', 'Fecha'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '10px', textTransform: 'uppercase', color: '#6B7A8D', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 12px', fontSize: '14px', fontWeight: 600 }}>{l.contact_name || '—'}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: '#9BA8B9', fontFamily: 'monospace' }}>{l.wa_phone_number}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: 'rgba(0,200,240,0.1)', color: '#00C8F0', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>{l.estado}</span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: '#9BA8B9', textAlign: 'center' }}>{l.consultas_count}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: l.agendo_visita ? '#00E87A' : '#6B7A8D' }}>{l.agendo_visita ? '✅ ' + (l.fecha_visita ? new Date(l.fecha_visita).toLocaleDateString('es-CL') : 'Agendada') : '—'}</td>
                    <td style={{ padding: '10px 12px', fontSize: '11px', color: '#6B7A8D' }}>{new Date(l.created_at).toLocaleDateString('es-CL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
