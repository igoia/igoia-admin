import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Client {
  id: string
  business_name: string
}

interface Activity {
  id: string
  client_id: string
  type: string
  description: string
  created_at: string
}

const WORKFLOW_ICONS: Record<string, string> = {
  message_received: '💬', message_sent: '📤', quotation_sent: '📄',
  lead_captured: '🎯', appointment_booked: '📅', review_requested: '⭐',
  report_generated: '📊', invoice_issued: '🧾',
}

const WORKFLOWS = [
  { id: 'wf-01', name: '01 · Bot WhatsApp IA', types: ['message_received', 'message_sent'], active: true },
  { id: 'wf-02', name: '02 · Cotización PDF', types: ['quotation_sent'], active: true },
  { id: 'wf-03', name: '03 · Reporte Semanal IA', types: ['report_generated'], active: false },
  { id: 'wf-04', name: '04 · Google Reviews', types: ['review_requested'], active: true },
  { id: 'wf-05', name: '05 · Instagram → CRM', types: ['lead_captured'], active: false },
]

export default function Automations() {
  const [clients, setClients] = useState<Client[]>([])
  const [activity, setActivity] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState<string>('all')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: c }, { data: a }] = await Promise.all([
      supabase.from('clients').select('id,business_name').eq('status', 'active'),
      supabase.from('activity').select('*').order('created_at', { ascending: false }).limit(100)
    ])
    setClients(c || [])
    setActivity(a || [])
    setLoading(false)
  }

  const filteredActivity = selectedClient === 'all'
    ? activity
    : activity.filter(a => a.client_id === selectedClient)

  const clientName = (id: string) => clients.find(c => c.id === id)?.business_name || 'Sin cliente'

  function formatDate(d: string) {
    return new Date(d).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const totalMessages = filteredActivity.filter(a => a.type === 'message_received').length
  const totalLeads = filteredActivity.filter(a => a.type === 'lead_captured').length
  const totalQuotes = filteredActivity.filter(a => a.type === 'quotation_sent').length

  return (
    <div style={{ padding: '32px', color: '#E8EDF2', minHeight: '100vh', background: '#070B0F' }}>
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Automatizaciones</h1>
          <p style={{ color: '#6B7A8D', fontSize: '14px', marginTop: '4px' }}>
            {WORKFLOWS.filter(w => w.active).length} workflows activos
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
            style={{ background: '#111820', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px', color: '#E8EDF2', fontSize: '14px', cursor: 'pointer' }}>
            <option value="all">Todos los clientes</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
          </select>
          <button onClick={fetchData} style={{ background: '#111820', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 16px', color: '#E8EDF2', fontSize: '13px', cursor: 'pointer' }}>
            🔄
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Mensajes Recibidos', value: totalMessages, color: '#00E87A' },
          { label: 'Leads Capturados', value: totalLeads, color: '#00C8F0' },
          { label: 'Cotizaciones Enviadas', value: totalQuotes, color: '#A78BFA' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#0C1117', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', padding: '20px' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#6B7A8D', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Workflows */}
      <div style={{ background: '#0C1117', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: '28px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Workflow', 'Estado', 'Eventos', 'Último evento'].map(h => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7A8D', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WORKFLOWS.map(wf => {
              const wfAct = filteredActivity.filter(a => wf.types.includes(a.type))
              const last = wfAct[0]
              return (
                <tr key={wf.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, fontSize: '14px' }}>{wf.name}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: wf.active ? '#00E87A20' : '#6B7A8D20', color: wf.active ? '#00E87A' : '#6B7A8D', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                      {wf.active ? '● Activo' : '○ Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#9BA8B9' }}>{wfAct.length}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#9BA8B9' }}>{last ? formatDate(last.created_at) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Activity feed */}
      <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
        Actividad {selectedClient !== 'all' ? `· ${clientName(selectedClient)}` : 'Reciente'}
      </h2>
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#6B7A8D' }}>Cargando...</div>
      ) : filteredActivity.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#6B7A8D' }}>Sin actividad registrada</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredActivity.slice(0, 30).map(a => (
            <div key={a.id} style={{ background: '#0C1117', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '20px' }}>{WORKFLOW_ICONS[a.type] || '⚡'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{a.description}</div>
                <div style={{ fontSize: '11px', color: '#6B7A8D', marginTop: '2px' }}>
                  {selectedClient === 'all' && <span style={{ marginRight: '8px', color: '#00E87A' }}>{clientName(a.client_id)}</span>}
                  {a.type}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#6B7A8D', whiteSpace: 'nowrap' }}>{formatDate(a.created_at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
