import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface FormData {
  business_name: string
  email: string
  phone: string
  ciudad: string
  plan: string
  business_type: string
  ical_airbnb: string
  ical_booking: string
  google_maps_url: string
  bank_name: string
  bank_account: string
  bank_rut: string
  bank_email: string
  bot_tone: string
  whatsapp_number: string
}

const PLANS = [
  { id: 'starter', label: 'Starter', price: '$89.000/mes', desc: '1 automatización, hasta 500 mensajes' },
  { id: 'pro', label: 'Pro', price: '$189.000/mes', desc: '3 automatizaciones, hasta 2.000 mensajes' },
  { id: 'enterprise', label: 'Enterprise', price: '$389.000/mes', desc: 'Todo ilimitado + soporte prioritario' },
]

const BUSINESS_TYPES = ['Alojamiento / Glamping / Domo', 'Tienda / Comercio', 'Servicios Profesionales', 'Restaurante / Cafetería', 'Otro']
const TONES = ['Amigable y cercano', 'Formal y profesional', 'Neutro e informativo']

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormData>({
    business_name: '', email: '', phone: '', ciudad: '', plan: 'starter',
    business_type: '', ical_airbnb: '', ical_booking: '', google_maps_url: '',
    bank_name: '', bank_account: '', bank_rut: '', bank_email: '',
    bot_tone: 'Amigable y cercano', whatsapp_number: ''
  })

  const set = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const metadata = {
        business_type: form.business_type,
        ical_airbnb: form.ical_airbnb,
        ical_booking: form.ical_booking,
        google_maps_url: form.google_maps_url,
        bank: { name: form.bank_name, account: form.bank_account, rut: form.bank_rut, email: form.bank_email },
        bot_tone: form.bot_tone,
        whatsapp_number: form.whatsapp_number
      }

      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          business_name: form.business_name,
          email: form.email,
          phone: form.phone,
          ciudad: form.ciudad,
          plan: form.plan,
          status: 'trial',
          metadata
        })
        .select()
        .single()

      if (clientError) throw clientError

      await supabase.from('wsp_conversations').insert({
        client_id: client.id,
        contact_phone: form.whatsapp_number,
        contact_name: form.business_name,
        status: 'open',
        wa_phone_number: '+14155238886'
      })

      setDone(true)
    } catch (e: any) {
      setError(e.message || 'Error al crear el cliente')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', background: '#111820', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px', padding: '12px 14px', color: '#E8EDF2', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box' as const
  }
  const labelStyle = { fontSize: '12px', color: '#6B7A8D', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '6px', display: 'block' }

  if (done) return (
    <div style={{ padding: '64px 32px', textAlign: 'center', color: '#E8EDF2' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
      <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#00E87A', marginBottom: '8px' }}>¡Cliente creado!</h1>
      <p style={{ color: '#6B7A8D', fontSize: '16px', marginBottom: '32px' }}>
        {form.business_name} está listo en IGoIA. El bot WhatsApp comenzará a funcionar de inmediato.
      </p>
      <button onClick={() => { setDone(false); setStep(1); setForm({ business_name:'',email:'',phone:'',ciudad:'',plan:'starter',business_type:'',ical_airbnb:'',ical_booking:'',google_maps_url:'',bank_name:'',bank_account:'',bank_rut:'',bank_email:'',bot_tone:'Amigable y cercano',whatsapp_number:'' }) }}
        style={{ background: '#00E87A', color: '#070B0F', border: 'none', borderRadius: '8px', padding: '12px 28px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
        + Agregar otro cliente
      </button>
    </div>
  )

  return (
    <div style={{ padding: '32px', color: '#E8EDF2', minHeight: '100vh', background: '#070B0F' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Nuevo Cliente</h1>
          <p style={{ color: '#6B7A8D', fontSize: '14px', marginTop: '4px' }}>Paso {step} de 4</p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            {[1,2,3,4].map(s => (
              <div key={s} style={{ flex: 1, height: '4px', borderRadius: '2px', background: s <= step ? '#00E87A' : 'rgba(255,255,255,0.08)' }} />
            ))}
          </div>
        </div>

        {error && <div style={{ background: '#EF444420', border: '1px solid #EF4444', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', color: '#EF4444', fontSize: '14px' }}>{error}</div>}

        {/* STEP 1 - Datos del negocio */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Datos del negocio</h2>
            <div>
              <label style={labelStyle}>Nombre del negocio *</label>
              <input style={inputStyle} value={form.business_name} onChange={e => set('business_name', e.target.value)} placeholder="Ej: Tunquendomo" />
            </div>
            <div>
              <label style={labelStyle}>Tipo de negocio *</label>
              <select style={inputStyle} value={form.business_type} onChange={e => set('business_type', e.target.value)}>
                <option value="">Selecciona...</option>
                {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Email *</label>
                <input style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} placeholder="hola@negocio.cl" type="email" />
              </div>
              <div>
                <label style={labelStyle}>Ciudad</label>
                <input style={inputStyle} value={form.ciudad} onChange={e => set('ciudad', e.target.value)} placeholder="Santiago" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Plan *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
                {PLANS.map(p => (
                  <div key={p.id} onClick={() => set('plan', p.id)} style={{ background: form.plan === p.id ? '#00E87A10' : '#111820', border: `1px solid ${form.plan === p.id ? '#00E87A' : 'rgba(255,255,255,0.08)'}`, borderRadius: '8px', padding: '14px', cursor: 'pointer' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: form.plan === p.id ? '#00E87A' : '#E8EDF2' }}>{p.label}</div>
                    <div style={{ fontSize: '13px', color: '#00E87A', marginTop: '2px' }}>{p.price}</div>
                    <div style={{ fontSize: '11px', color: '#6B7A8D', marginTop: '4px' }}>{p.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 - WhatsApp y Bot */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>WhatsApp y Bot</h2>
            <div>
              <label style={labelStyle}>Número WhatsApp Business *</label>
              <input style={inputStyle} value={form.whatsapp_number} onChange={e => set('whatsapp_number', e.target.value)} placeholder="+56912345678" />
              <p style={{ fontSize: '12px', color: '#6B7A8D', marginTop: '4px' }}>Número registrado en WhatsApp Business API</p>
            </div>
            <div>
              <label style={labelStyle}>Teléfono de contacto</label>
              <input style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+56912345678" />
            </div>
            <div>
              <label style={labelStyle}>Tono del bot</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {TONES.map(t => (
                  <div key={t} onClick={() => set('bot_tone', t)} style={{ background: form.bot_tone === t ? '#00E87A10' : '#111820', border: `1px solid ${form.bot_tone === t ? '#00E87A' : 'rgba(255,255,255,0.08)'}`, borderRadius: '8px', padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${form.bot_tone === t ? '#00E87A' : '#6B7A8D'}`, background: form.bot_tone === t ? '#00E87A' : 'transparent' }} />
                    <span style={{ fontSize: '14px', color: form.bot_tone === t ? '#00E87A' : '#E8EDF2' }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 - Integraciones */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Integraciones</h2>
            <div>
              <label style={labelStyle}>URL iCal Airbnb</label>
              <input style={inputStyle} value={form.ical_airbnb} onChange={e => set('ical_airbnb', e.target.value)} placeholder="https://www.airbnb.com/calendar/ical/..." />
              <p style={{ fontSize: '12px', color: '#6B7A8D', marginTop: '4px' }}>Airbnb → Calendario → Exportar iCal</p>
            </div>
            <div>
              <label style={labelStyle}>URL iCal Booking.com</label>
              <input style={inputStyle} value={form.ical_booking} onChange={e => set('ical_booking', e.target.value)} placeholder="https://admin.booking.com/hotel/hoteladmin/ical..." />
              <p style={{ fontSize: '12px', color: '#6B7A8D', marginTop: '4px' }}>Booking → Extranet → Calendario → Sincronización iCal</p>
            </div>
            <div>
              <label style={labelStyle}>URL Google Maps (para reseñas)</label>
              <input style={inputStyle} value={form.google_maps_url} onChange={e => set('google_maps_url', e.target.value)} placeholder="https://g.page/r/..." />
              <p style={{ fontSize: '12px', color: '#6B7A8D', marginTop: '4px' }}>Google Maps → Tu negocio → Compartir → Copiar link</p>
            </div>
          </div>
        )}

        {/* STEP 4 - Datos de pago */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Datos de transferencia</h2>
            <p style={{ color: '#6B7A8D', fontSize: '14px', margin: 0 }}>El bot enviará estos datos cuando un cliente confirme una reserva o cotización.</p>
            <div>
              <label style={labelStyle}>Nombre completo</label>
              <input style={inputStyle} value={form.bank_name} onChange={e => set('bank_name', e.target.value)} placeholder="RODRIGO ALEJANDRO CHACON" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>RUT</label>
                <input style={inputStyle} value={form.bank_rut} onChange={e => set('bank_rut', e.target.value)} placeholder="13.248.446-5" />
              </div>
              <div>
                <label style={labelStyle}>N° Cuenta</label>
                <input style={inputStyle} value={form.bank_account} onChange={e => set('bank_account', e.target.value)} placeholder="190247643" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Email para comprobantes</label>
              <input style={inputStyle} value={form.bank_email} onChange={e => set('bank_email', e.target.value)} placeholder="pagos@negocio.cl" type="email" />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 24px', color: '#E8EDF2', fontSize: '14px', cursor: 'pointer' }}>
              ← Atrás
            </button>
          ) : <div />}
          {step < 4 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={step === 1 && (!form.business_name || !form.email || !form.business_type)}
              style={{ background: '#00E87A', color: '#070B0F', border: 'none', borderRadius: '8px', padding: '12px 28px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: (step === 1 && (!form.business_name || !form.email || !form.business_type)) ? 0.4 : 1 }}>
              Continuar →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              style={{ background: '#00E87A', color: '#070B0F', border: 'none', borderRadius: '8px', padding: '12px 28px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Creando...' : '✓ Crear Cliente'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
