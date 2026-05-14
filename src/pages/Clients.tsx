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
  starter: '#00E87A', pro: '#00C8F0', enterprise: '#A78BFA', trial: '#F59E0B',
}
const STATUS_COLORS: Record<string, string> = {
  active: '#00E87A', trial: '#F59E0B', suspended: '#EF4444', inactive: '#6B7A8D',
}

export default function Clients({ onViewBot }: { onViewBot?: (id: string, name: string, type: string) => void }) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<Client | null>(null)
  const [editing, setEditing] = useState(false)
  const [clientAutomationTypes, setClientAutomationTypes] = useState<Record<string, string>>({})
  const [editForm, setEditForm] = useState<Partial<Client>>({})
  const [saving, setSaving] = useState(false)
  const [confirmBaja, setConfirmBaja] = useState(false)

  useEffect(() => { fetchClients() }, [])

  async function fetchClients() {
    setLoading(true)
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    setClients(data || [])

    const { data: autos } = await supabase
      .from('automations')
      .select('client_id, type')
      .eq('status', 'active')

    const types: Record<string, string> = {}
    ;(autos || []).forEach(a => { types[a.client_id] = a.type })
    setClientAutomationTypes(types)

    setLoading(false)
  }

  function startEdit(client: Client) {
    setEditForm({ business_name: client.business_name, email: client.email, phone: client.phone || '', ciudad: client.ciudad || '', plan: client.plan, status: client.status, rut: client.rut || '' })
    setEditing(true)
  }

  async function saveEdit() {
    if (!selected) return
    setSaving(true)
    await supabase.from('clients').update(editForm).eq('id', selected.id)
    await fetchClients()
    setSelected({ ...selected, ...editForm } as Client)
    setEditing(false)
    setSaving(false)
  }

  async function darDeBaja() {
    if (!selected) return
    setSaving(true)
    await supabase.from('clients').update({ status: 'suspended' }).eq('id', selected.id)
    await fetchClients()
    setSelected({ ...selected, status: 'suspended' })
    setConfirmBaja(false)
    setSaving(false)
  }

  async function reactivar() {
    if (!selected) return
    setSaving(true)
    await supabase.from('clients').update({ status: 'active' }).eq('id', selected.id)
    await fetchClients()
    setSelected({ ...selected, status: 'active' })
    setSaving(false)
  }

  const filtered = clients.filter(c => {
    const ms = c.business_name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())
    const mp = planFilter === 'all' || c.plan === planFilter
    const mst = statusFilter === 'all' || c.status === statusFilter
    return ms && mp && mst
  })

  const inp = { width:'100%', background:'#111820', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', padding:'10px 14px', color:'#E8EDF2', fontSize:'14px', outline:'none', boxSizing:'border-box' as const }
  const lbl = { fontSize:'11px', color:'#6B7A8D', textTransform:'uppercase' as const, letterSpacing:'0.08em', marginBottom:'4px', display:'block' }

  return (
    <div style={{ padding: '32px', color: '#E8EDF2', minHeight: '100vh', background: '#070B0F' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Clientes</h1>
        <p style={{ color: '#6B7A8D', fontSize: '14px', marginTop: '4px' }}>{filtered.length} de {clients.length}</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input placeholder="Buscar empresa, email..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: '200px', ...inp }} />
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} style={{ ...inp, width: 'auto' }}>
          <option value="all">Todos los planes</option>
          <option value="trial">Trial</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inp, width: 'auto' }}>
          <option value="all">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspendido</option>
        </select>
      </div>

      <div style={{ background: '#0C1117', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        {loading ? <div style={{ padding: '48px', textAlign: 'center', color: '#6B7A8D' }}>Cargando...</div> :
        filtered.length === 0 ? <div style={{ padding: '48px', textAlign: 'center', color: '#6B7A8D' }}>No hay clientes</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Empresa', 'Plan', 'Estado', 'Email', 'Ciudad', 'Registrado', 'Bot'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7A8D', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} onClick={() => { setSelected(c); setEditing(false); setConfirmBaja(false) }}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{c.business_name}</div>
                    {c.rut && <div style={{ fontSize: '12px', color: '#6B7A8D' }}>{c.rut}</div>}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: `${PLAN_COLORS[c.plan]||'#6B7A8D'}20`, color: PLAN_COLORS[c.plan]||'#6B7A8D', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }}>{c.plan}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: `${STATUS_COLORS[c.status]||'#6B7A8D'}20`, color: STATUS_COLORS[c.status]||'#6B7A8D', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                      {c.status === 'active' ? 'Activo' : c.status === 'trial' ? 'Trial' : c.status === 'suspended' ? 'Suspendido' : c.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#9BA8B9' }}>{c.email}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#9BA8B9' }}>{c.ciudad || '—'}</td>
                  <td style={{ padding: "14px 16px", fontSize: "14px", color: "#9BA8B9" }}>{new Date(c.created_at).toLocaleDateString("es-CL")}</td><td style={{ padding: "14px 16px" }}><button onClick={(e) => { e.stopPropagation(); onViewBot && onViewBot(c.id, c.business_name, clientAutomationTypes[c.id] || 'whatsapp_bot') }} style={{ background: "#059669", color: "white", border: "none", borderRadius: "6px", padding: "4px 12px", cursor: "pointer", fontSize: "12px" }}>📊 Bot</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '420px', height: '100vh', background: '#0C1117', borderLeft: '1px solid rgba(255,255,255,0.08)', padding: '28px', overflowY: 'auto', zIndex: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>{editing ? 'Editar' : 'Detalle'}</h2>
            <button onClick={() => { setSelected(null); setEditing(false); setConfirmBaja(false) }} style={{ background: 'none', border: 'none', color: '#6B7A8D', fontSize: '20px', cursor: 'pointer' }}>✕</button>
          </div>

          {!editing ? (
            <>
              <div style={{ fontWeight: 700, fontSize: '20px', marginBottom: '4px' }}>{selected.business_name}</div>
              <div style={{ color: '#6B7A8D', fontSize: '13px', marginBottom: '24px' }}>{selected.rut || 'Sin RUT'}</div>
              {[['Email', selected.email], ['Teléfono', selected.phone||'—'], ['Ciudad', selected.ciudad||'—'], ['Plan', selected.plan], ['Estado', selected.status]].map(([l, v]) => (
                <div key={l} style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7A8D', marginBottom: '4px' }}>{l}</div>
                  <div style={{ fontSize: '14px', color: '#E8EDF2', textTransform: 'capitalize' }}>{v}</div>
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '32px' }}>
                <button onClick={() => startEdit(selected)} style={{ background: '#00E87A', color: '#070B0F', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>✏️ Editar datos</button>
                {selected.status === 'suspended' ? (
                  <button onClick={reactivar} disabled={saving} style={{ background: '#00C8F010', color: '#00C8F0', border: '1px solid #00C8F030', borderRadius: '8px', padding: '12px', fontSize: '14px', cursor: 'pointer' }}>✓ Reactivar</button>
                ) : (
                  <button onClick={() => setConfirmBaja(true)} style={{ background: '#EF444410', color: '#EF4444', border: '1px solid #EF444430', borderRadius: '8px', padding: '12px', fontSize: '14px', cursor: 'pointer' }}>⚠️ Dar de baja</button>
                )}
              </div>
              {confirmBaja && (
                <div style={{ marginTop: '16px', background: '#EF444415', border: '1px solid #EF444440', borderRadius: '8px', padding: '16px' }}>
                  <p style={{ color: '#EF4444', fontSize: '13px', margin: '0 0 12px' }}>¿Suspender a <strong>{selected.business_name}</strong>?</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={darDeBaja} disabled={saving} style={{ flex: 1, background: '#EF4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px', fontSize: '13px', cursor: 'pointer' }}>{saving ? 'Suspendiendo...' : 'Sí, suspender'}</button>
                    <button onClick={() => setConfirmBaja(false)} style={{ flex: 1, background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '10px', color: '#E8EDF2', fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[['Nombre', 'business_name'], ['Email', 'email'], ['Teléfono', 'phone'], ['Ciudad', 'ciudad'], ['RUT', 'rut']].map(([l, k]) => (
                  <div key={k}>
                    <label style={lbl}>{l}</label>
                    <input style={inp} value={(editForm as any)[k] || ''} onChange={e => setEditForm(f => ({ ...f, [k]: e.target.value }))} />
                  </div>
                ))}
                <div>
                  <label style={lbl}>Plan</label>
                  <select style={inp} value={editForm.plan||''} onChange={e => setEditForm(f => ({ ...f, plan: e.target.value }))}>
                    {['trial','starter','pro','enterprise'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Estado</label>
                  <select style={inp} value={editForm.status||''} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                    {['active','trial','suspended'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button onClick={saveEdit} disabled={saving} style={{ flex: 1, background: '#00E87A', color: '#070B0F', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Guardando...' : '✓ Guardar'}</button>
                <button onClick={() => setEditing(false)} style={{ flex: 1, background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px', color: '#E8EDF2', fontSize: '14px', cursor: 'pointer' }}>Cancelar</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
