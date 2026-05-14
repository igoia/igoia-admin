import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  clientId: string
  clientName: string
  onBack: () => void
}

interface Automation {
  id: string; name: string; status: string; runs_count: number; last_run_at: string | null
}

interface ActivityRow {
  id: string; type: string; description: string; created_at: string
}

interface Lead {
  id: string
  contact_phone: string
  contact_name: string
  step: string
  flow: string
  mode: string
  reservation_code: string | null
  checkin_date: string | null
  checkout_date: string | null
  persons: number | null
  has_pet: boolean | null
  reserved_dates: string | null
  last_message_at: string
}

interface DemoInteraction {
  id: string
  created_at: string
  ip: string
  session_id: string | null
  message_count: number
  user_message: string
  luna_response: string
  reached_limit: boolean
  left_phone: boolean
  phone_number: string | null
  user_agent: string | null
}

const STEP_LABEL: Record<string, string> = {
  NEW: 'Nuevo', ASKING_PERSONS: 'Consultando', ASKING_DATES: 'Consultando',
  ASKING_MASCOT: 'Consultando', AVAILABILITY_CHECK: 'Consultando',
  CONFIRMED_DATES: 'Cotizando', ASKING_DETAILS: 'Cotizando',
  PAYMENT_INFO: 'Datos pago', PAYMENT_SENT: 'Comprobante enviado',
  CONFIRMED: 'Reserva confirmada', SUPPORT: 'Soporte', INQUIRY: 'Consulta',
}

const STEP_COLOR: Record<string, string> = {
  NEW: '#6B7A8D', ASKING_PERSONS: '#00C8F0', ASKING_DATES: '#00C8F0',
  ASKING_MASCOT: '#00C8F0', AVAILABILITY_CHECK: '#00C8F0',
  CONFIRMED_DATES: '#F59E0B', ASKING_DETAILS: '#F59E0B',
  PAYMENT_INFO: '#F59E0B', PAYMENT_SENT: '#A78BFA',
  CONFIRMED: '#00E87A', SUPPORT: '#00C8F0', INQUIRY: '#6B7A8D',
}

function calcTotal(lead: Lead): number | null {
  if (!lead.checkin_date || !lead.checkout_date) return null
  const checkin = new Date(lead.checkin_date + 'T12:00:00')
  const checkout = new Date(lead.checkout_date + 'T12:00:00')
  const nights = Math.round((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24))
  if (nights <= 0) return null
  const dow = checkin.getDay()
  let base = 0
  if (dow === 5 && nights === 3) base = 469000
  else if (dow === 5 && nights === 2) base = 329000
  else base = nights * 140000
  if (lead.has_pet) base += 20000
  return base
}

function calcPendiente(lead: Lead): number | null {
  const total = calcTotal(lead)
  if (total === null) return null
  if (lead.step === 'CONFIRMED') return Math.round(total * 0.75)
  if (lead.step === 'PAYMENT_SENT') return total
  return null
}

const fmtCLP = (n: number) =>
  '$' + (n / 1000).toLocaleString('es-CL', { maximumFractionDigits: 0 }) + 'K'

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function isDateReserved(dateStr: string, leads: Lead[]): Lead | null {
  for (const l of leads) {
    if (!l.checkin_date || !l.checkout_date) continue
    if (dateStr >= l.checkin_date && dateStr < l.checkout_date) return l
  }
  return null
}

export default function BotMetrics({ clientId, clientName, onBack }: Props) {
  const [automations, setAutomations] = useState<Automation[]>([])
  // const [activities, setActivities] = useState<ActivityRow[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [dailyStats, setDailyStats] = useState<{date:string,count:number}[]>([])
  const [demoInteractions, setDemoInteractions] = useState<DemoInteraction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'checkins' | 'ocupacion' | 'demoweb'>('overview')

  useEffect(() => { fetchData() }, [clientId])

  async function fetchData() {
    setLoading(true)
    const { data: autoData } = await supabase.from('automations').select('*').eq('client_id', clientId)
    setAutomations(autoData || [])
    const { data: actData } = await supabase.from('activity').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(30)
    // setActivities(actData || [])
    const { data: leadsData } = await supabase.from('wsp_conversations').select('*').order('last_message_at', { ascending: false })
    setLeads(leadsData || [])
    const { data: demoData } = await supabase.from('demo_interactions').select('*').order('created_at', { ascending: false }).limit(200)
    setDemoInteractions(demoData || [])
    const days: Record<string, number> = {}
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      days[d.toISOString().slice(0, 10)] = 0
    }
    ;(actData || []).forEach((a: ActivityRow) => {
      const day = a.created_at?.slice(0, 10)
      if (day && days[day] !== undefined) days[day]++
    })
    setDailyStats(Object.entries(days).map(([date, count]) => ({ date, count })))
    setLoading(false)
  }

  const totalRuns = automations.reduce((s, a) => s + (a.runs_count || 0), 0)
  const confirmed = leads.filter(l => l.step === 'CONFIRMED').length
  const pending = leads.filter(l => l.step === 'PAYMENT_SENT').length
  const totalLeads = leads.length
  const convRate = totalLeads > 0 ? Math.round((confirmed / totalLeads) * 100) : 0
  const maxCount = Math.max(...dailyStats.map(d => d.count), 1)
  const today = new Date().toISOString().slice(0, 10)
  const upcomingCheckins = leads.filter(l => l.step === 'CONFIRMED' && l.checkin_date && l.checkin_date >= today).sort((a, b) => (a.checkin_date || '').localeCompare(b.checkin_date || ''))
  const porCobrar = leads.reduce((sum, l) => sum + (calcPendiente(l) || 0), 0)
  const reservedLeads = leads.filter(l => (l.step === 'CONFIRMED' || l.step === 'PAYMENT_SENT') && l.checkin_date && l.checkout_date)

  // Demo Web metrics
  const demoSessions = [...new Set(demoInteractions.map(d => d.ip))].length
  const demoMessages = demoInteractions.filter(d => !['RATE_LIMIT','SESSION_LIMIT','INJECTION_BLOCKED'].includes(d.luna_response)).length
  const demoLeads = demoInteractions.filter(d => d.left_phone).length
  const demoLimitReached = demoInteractions.filter(d => d.reached_limit).length
  const demoInjections = demoInteractions.filter(d => d.luna_response === 'INJECTION_BLOCKED').length
  const uniquePhones = [...new Set(demoInteractions.filter(d => d.phone_number).map(d => d.phone_number))]

  const demoDays: Record<string, number> = {}
  const nowD = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(nowD); d.setDate(d.getDate() - i)
    demoDays[d.toISOString().slice(0, 10)] = 0
  }
  demoInteractions.forEach(d => {
    const day = d.created_at?.slice(0, 10)
    if (day && demoDays[day] !== undefined) demoDays[day]++
  })
  const demoDailyStats = Object.entries(demoDays).map(([date, count]) => ({ date, count }))
  const demoMaxCount = Math.max(...demoDailyStats.map(d => d.count), 1)

  const nowDate = new Date()
  const [calYear, setCalYear] = useState(nowDate.getFullYear())
  const [calMonth, setCalMonth] = useState(nowDate.getMonth())
  const daysInMonth = getDaysInMonth(calYear, calMonth)
  const firstDow = new Date(calYear, calMonth, 1).getDay()
  const startOffset = (firstDow + 6) % 7
  const calDays: Array<{ dateStr: string; day: number } | null> = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      return { dateStr, day }
    }),
  ]
  const monthStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`
  const monthReservations = reservedLeads.filter(l => (l.checkin_date || '').startsWith(monthStr) || (l.checkout_date || '').startsWith(monthStr))

  const card = { background: '#0C1117', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', padding: '20px' }
  const tabStyle = (t: string) => ({
    padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontSize: '13px', fontWeight: 600,
    background: activeTab === t ? '#00E87A' : 'rgba(255,255,255,0.06)',
    color: activeTab === t ? '#070B0F' : '#9BA8B9',
  })

  const fmtDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }
  const fmtPhone = (p: string) => {
    const clean = p.replace(/^\+/, '')
    return '+' + clean.slice(0, 2) + ' ' + clean.slice(2, 4) + ' ' + clean.slice(4)
  }
  const fmtDateTime = (d: string) =>
    new Date(d).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  if (loading) return <div style={{ padding: '32px', color: '#6B7A8D', textAlign: 'center' }}>Cargando métricas...</div>

  return (
    <div style={{ padding: '32px', color: '#E8EDF2', minHeight: '100vh', background: '#070B0F' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', padding: '8px 14px', color: '#E8EDF2', cursor: 'pointer', fontSize: '14px' }}>← Volver</button>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>📊 Métricas Bot — {clientName}</h1>
          <p style={{ color: '#6B7A8D', fontSize: '14px', marginTop: '4px' }}>Bot WhatsApp · Luna</p>
        </div>
        <button onClick={fetchData} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', padding: '8px 14px', color: '#E8EDF2', cursor: 'pointer', fontSize: '13px' }}>↻ Actualizar</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { v: totalRuns, l: 'Ejecuciones', c: '#00E87A' },
          { v: totalLeads, l: 'Leads Totales', c: '#00C8F0' },
          { v: confirmed, l: 'Reservas Confirmadas', c: '#A78BFA' },
          { v: pending, l: 'Pendientes Pago', c: '#F59E0B' },
          { v: convRate + '%', l: 'Tasa Conversión', c: '#00E87A' },
          { v: upcomingCheckins.length, l: 'Próximos Check-ins', c: '#00C8F0' },
          { v: porCobrar > 0 ? fmtCLP(porCobrar) : '$0', l: 'Por Cobrar', c: '#F59E0B' },
        ].map(m => (
          <div key={m.l} style={{ ...card, flex: 1, minWidth: '110px', textAlign: 'center' as const }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: m.c }}>{m.v}</div>
            <div style={{ fontSize: '11px', color: '#6B7A8D', marginTop: '4px' }}>{m.l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button style={tabStyle('overview')} onClick={() => setActiveTab('overview')}>📈 Resumen</button>
        <button style={tabStyle('leads')} onClick={() => setActiveTab('leads')}>👥 Leads ({totalLeads})</button>
        <button style={tabStyle('checkins')} onClick={() => setActiveTab('checkins')}>📅 Check-ins ({upcomingCheckins.length})</button>
        <button style={tabStyle('ocupacion')} onClick={() => setActiveTab('ocupacion')}>🗓️ Ocupación</button>
        <button
          onClick={() => setActiveTab('demoweb')}
          style={{ padding: '8px 20px', borderRadius: '8px', border: activeTab === 'demoweb' ? 'none' : '1px solid rgba(0,200,240,0.2)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: activeTab === 'demoweb' ? '#00C8F0' : 'rgba(0,200,240,0.08)', color: activeTab === 'demoweb' ? '#070B0F' : '#00C8F0' }}
        >🌐 Demo Web {demoLeads > 0 ? `(${demoLeads} leads)` : ''}</button>
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ ...card, flex: 2, minWidth: '300px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>Actividad Últimos 14 Días</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100px' }}>
                {dailyStats.map(d => (
                  <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '100%', maxWidth: '28px', height: Math.max((d.count / maxCount) * 100, 4) + 'px', background: d.count > 0 ? '#00E87A' : 'rgba(255,255,255,0.06)', borderRadius: '3px 3px 0 0' }} title={d.date + ': ' + d.count} />
                    <div style={{ fontSize: '8px', color: '#6B7A8D', marginTop: '3px', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
                      {new Date(d.date + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...card, flex: 1, minWidth: '200px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>Embudo de Conversión</h3>
              {[
                { label: 'Leads totales', value: totalLeads, color: '#6B7A8D' },
                { label: 'Cotizaron', value: leads.filter(l => ['CONFIRMED_DATES','PAYMENT_INFO','PAYMENT_SENT','CONFIRMED'].includes(l.step)).length, color: '#F59E0B' },
                { label: 'Comprobante enviado', value: pending + confirmed, color: '#A78BFA' },
                { label: 'Confirmados', value: confirmed, color: '#00E87A' },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#9BA8B9' }}>{f.label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: f.color }}>{f.value}</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                    <div style={{ height: '100%', width: totalLeads > 0 ? (f.value / totalLeads * 100) + '%' : '0%', background: f.color, borderRadius: '2px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>Automatizaciones</h3>
            {automations.map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{a.name}</div>
                  <div style={{ fontSize: '11px', color: '#6B7A8D', marginTop: '2px' }}>Último run: {a.last_run_at ? new Date(a.last_run_at).toLocaleString('es-CL') : 'Nunca'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#00E87A', fontWeight: 700 }}>{a.runs_count || 0} runs</span>
                  <span style={{ background: a.status === 'active' ? '#00E87A20' : '#6B7A8D20', color: a.status === 'active' ? '#00E87A' : '#6B7A8D', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>{a.status === 'active' ? 'Activo' : 'Inactivo'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LEADS */}
      {activeTab === 'leads' && (
        <div style={card}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>Leads y Clientes</h3>
          {leads.length === 0 ? <div style={{ color: '#6B7A8D', textAlign: 'center', padding: '32px' }}>Sin leads registrados</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Nombre', 'Teléfono', 'Estado', 'Reserva', 'Fechas', 'Pers.', 'Total', 'Pendiente', 'Último contacto'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7A8D', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map(l => {
                  const total = calcTotal(l); const pend = calcPendiente(l)
                  return (
                    <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 600 }}>{l.contact_name || '—'}{l.has_pet && <span style={{ marginLeft: '6px' }}>🐾</span>}</td>
                      <td style={{ padding: '10px 12px', fontSize: '12px', color: '#9BA8B9', fontFamily: 'monospace' }}>{fmtPhone(l.contact_phone)}</td>
                      <td style={{ padding: '10px 12px' }}><span style={{ background: `${STEP_COLOR[l.step] || '#6B7A8D'}20`, color: STEP_COLOR[l.step] || '#6B7A8D', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>{STEP_LABEL[l.step] || l.step}</span></td>
                      <td style={{ padding: '10px 12px', fontSize: '12px', color: '#00E87A', fontFamily: 'monospace' }}>{l.reservation_code || '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: '12px', color: '#9BA8B9' }}>{l.reserved_dates || '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: '12px', color: '#9BA8B9', textAlign: 'center' }}>{l.persons || '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: '12px', color: '#E8EDF2', fontWeight: 600 }}>{total !== null ? fmtCLP(total) : '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 700, color: pend !== null ? '#F59E0B' : '#6B7A8D' }}>{pend !== null ? fmtCLP(pend) : '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: '11px', color: '#6B7A8D' }}>{l.last_message_at ? new Date(l.last_message_at).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* CHECK-INS */}
      {activeTab === 'checkins' && (
        <div style={card}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>Próximos Check-ins</h3>
          {upcomingCheckins.length === 0 ? <div style={{ color: '#6B7A8D', textAlign: 'center', padding: '32px' }}>Sin check-ins próximos</div> : (
            upcomingCheckins.map(l => (
              <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{l.contact_name || 'Sin nombre'}</div>
                  <div style={{ fontSize: '12px', color: '#6B7A8D', marginTop: '2px' }}>{fmtPhone(l.contact_phone)} · {l.reservation_code}</div>
                  <div style={{ fontSize: '11px', color: '#9BA8B9', marginTop: '2px' }}>{l.persons || '?'} personas{l.has_pet ? ' + mascota 🐾' : ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#00E87A' }}>Check-in: {fmtDate(l.checkin_date)}</div>
                  <div style={{ fontSize: '12px', color: '#6B7A8D', marginTop: '2px' }}>Checkout: {fmtDate(l.checkout_date)}</div>
                  <div style={{ fontSize: '11px', color: '#9BA8B9', marginTop: '2px' }}>{l.reserved_dates}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* OCUPACIÓN */}
      {activeTab === 'ocupacion' && (
        <div>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <button onClick={() => { const d = new Date(calYear, calMonth - 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()) }} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', padding: '6px 14px', color: '#E8EDF2', cursor: 'pointer', fontSize: '14px' }}>←</button>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, textTransform: 'capitalize' }}>{new Date(calYear, calMonth, 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}</h3>
              <button onClick={() => { const d = new Date(calYear, calMonth + 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()) }} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', padding: '6px 14px', color: '#E8EDF2', cursor: 'pointer', fontSize: '14px' }}>→</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
              {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d => (<div key={d} style={{ textAlign: 'center', fontSize: '11px', color: '#6B7A8D', fontWeight: 600, padding: '4px 0' }}>{d}</div>))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {calDays.map((cell, idx) => {
                if (!cell) return <div key={idx} />
                const { dateStr, day } = cell
                const reservedLead = isDateReserved(dateStr, reservedLeads)
                const isToday = dateStr === today
                return (
                  <div key={dateStr} title={reservedLead ? (reservedLead.contact_name || reservedLead.contact_phone) : ''} style={{ borderRadius: '8px', padding: '6px 4px', textAlign: 'center', fontSize: '12px', background: reservedLead ? '#00E87A18' : isToday ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', border: isToday ? '1px solid rgba(255,255,255,0.2)' : reservedLead ? '1px solid #00E87A40' : '1px solid transparent', minHeight: '52px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontWeight: isToday ? 700 : 400, color: isToday ? '#E8EDF2' : '#9BA8B9' }}>{day}</span>
                    {reservedLead && <span style={{ fontSize: '9px', color: '#00E87A', fontWeight: 600, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', padding: '0 2px' }}>{(reservedLead.contact_name || '').split(' ')[0] || '●'}</span>}
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '11px', color: '#6B7A8D' }}>
              <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#00E87A18', border: '1px solid #00E87A40', borderRadius: '2px', marginRight: '4px' }} />Reservado</span>
              <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '2px', marginRight: '4px' }} />Hoy</span>
            </div>
          </div>
          <div style={{ ...card, marginTop: '16px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>Reservas del mes — {new Date(calYear, calMonth, 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}</h3>
            {monthReservations.length === 0 ? <div style={{ color: '#6B7A8D', textAlign: 'center', padding: '24px' }}>Sin reservas este mes</div> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{['Huésped','Código','Check-in','Checkout','Pers.','Total','Saldo'].map(h => (<th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7A8D', fontWeight: 600 }}>{h}</th>))}</tr></thead>
                <tbody>
                  {monthReservations.map(l => {
                    const total = calcTotal(l); const pend = calcPendiente(l)
                    return (
                      <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 600 }}>{l.contact_name || fmtPhone(l.contact_phone)}{l.has_pet && <span style={{ marginLeft: '6px' }}>🐾</span>}</td>
                        <td style={{ padding: '10px 12px', fontSize: '12px', color: '#00E87A', fontFamily: 'monospace' }}>{l.reservation_code || '—'}</td>
                        <td style={{ padding: '10px 12px', fontSize: '12px', color: '#9BA8B9' }}>{fmtDate(l.checkin_date)}</td>
                        <td style={{ padding: '10px 12px', fontSize: '12px', color: '#9BA8B9' }}>{fmtDate(l.checkout_date)}</td>
                        <td style={{ padding: '10px 12px', fontSize: '12px', color: '#9BA8B9', textAlign: 'center' }}>{l.persons || '—'}</td>
                        <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 600, color: '#E8EDF2' }}>{total !== null ? fmtCLP(total) : '—'}</td>
                        <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: pend !== null ? '#F59E0B' : '#6B7A8D' }}>{pend !== null ? fmtCLP(pend) : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <td colSpan={5} style={{ padding: '10px 12px', fontSize: '12px', color: '#6B7A8D', fontWeight: 600 }}>Total mes</td>
                    <td style={{ padding: '10px 12px', fontSize: '14px', fontWeight: 700, color: '#E8EDF2' }}>{fmtCLP(monthReservations.reduce((s, l) => s + (calcTotal(l) || 0), 0))}</td>
                    <td style={{ padding: '10px 12px', fontSize: '14px', fontWeight: 700, color: '#F59E0B' }}>{fmtCLP(monthReservations.reduce((s, l) => s + (calcPendiente(l) || 0), 0))}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ══ DEMO WEB ══ */}
      {activeTab === 'demoweb' && (
        <div>
          {/* KPIs Demo */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {[
              { v: demoSessions, l: 'Sesiones únicas', c: '#00C8F0' },
              { v: demoMessages, l: 'Mensajes totales', c: '#00E87A' },
              { v: demoLeads, l: 'Dejaron WhatsApp', c: '#A78BFA' },
              { v: demoLimitReached, l: 'Alcanzaron límite', c: '#F59E0B' },
              { v: demoSessions > 0 ? Math.round((demoLeads / demoSessions) * 100) + '%' : '0%', l: 'Tasa conversión', c: '#00E87A' },
              { v: demoInjections, l: 'Intentos hackeo', c: '#FF4455' },
            ].map(m => (
              <div key={m.l} style={{ ...card, flex: 1, minWidth: '110px', textAlign: 'center' as const }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: m.c }}>{m.v}</div>
                <div style={{ fontSize: '11px', color: '#6B7A8D', marginTop: '4px' }}>{m.l}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {/* Chart */}
            <div style={{ ...card, flex: 2, minWidth: '300px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>Actividad Demo Últimos 14 Días</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100px' }}>
                {demoDailyStats.map(d => (
                  <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '100%', maxWidth: '28px', height: Math.max((d.count / demoMaxCount) * 100, 4) + 'px', background: d.count > 0 ? '#00C8F0' : 'rgba(255,255,255,0.06)', borderRadius: '3px 3px 0 0' }} title={d.date + ': ' + d.count} />
                    <div style={{ fontSize: '8px', color: '#6B7A8D', marginTop: '3px', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
                      {new Date(d.date + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Phones captured */}
            <div style={{ ...card, flex: 1, minWidth: '200px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>📲 WhatsApp Captados</h3>
              {uniquePhones.length === 0 ? (
                <div style={{ color: '#6B7A8D', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Sin leads aún</div>
              ) : (
                uniquePhones.map((phone, i) => {
                  const interaction = demoInteractions.find(d => d.phone_number === phone)
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#A78BFA', fontFamily: 'monospace' }}>{phone}</div>
                        <div style={{ fontSize: '10px', color: '#6B7A8D', marginTop: '2px' }}>{interaction ? fmtDateTime(interaction.created_at) : '—'}</div>
                      </div>
                      <span style={{ background: '#A78BFA20', color: '#A78BFA', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600 }}>LEAD</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Interaction log */}
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>Conversaciones Recientes</h3>
            {demoInteractions.length === 0 ? (
              <div style={{ color: '#6B7A8D', textAlign: 'center', padding: '32px' }}>Sin interacciones registradas aún</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Fecha', 'IP', 'Msg #', 'Pregunta', 'Respuesta Luna', 'Lead', 'Límite'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7A8D', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {demoInteractions.slice(0, 50).map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: d.left_phone ? 'rgba(167,139,250,0.04)' : d.reached_limit ? 'rgba(245,158,11,0.02)' : 'transparent' }}>
                      <td style={{ padding: '8px 12px', fontSize: '11px', color: '#6B7A8D', whiteSpace: 'nowrap' }}>{fmtDateTime(d.created_at)}</td>
                      <td style={{ padding: '8px 12px', fontSize: '11px', color: '#4A5A6A', fontFamily: 'monospace' }}>{d.ip?.slice(-8) || '—'}</td>
                      <td style={{ padding: '8px 12px', fontSize: '12px', color: '#9BA8B9', textAlign: 'center' }}>{d.message_count}</td>
                      <td style={{ padding: '8px 12px', fontSize: '12px', color: '#E8EDF2', maxWidth: '180px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.user_message || '—'}</div>
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: '12px', color: '#9BA8B9', maxWidth: '180px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.luna_response || '—'}</div>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        {d.left_phone
                          ? <span style={{ background: '#A78BFA20', color: '#A78BFA', padding: '2px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: 700 }} title={d.phone_number || ''}>📲 {d.phone_number}</span>
                          : '—'}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        {d.reached_limit ? <span style={{ background: '#F59E0B20', color: '#F59E0B', padding: '2px 6px', borderRadius: '8px', fontSize: '10px' }}>✓</span> : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
