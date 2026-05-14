import { useState, FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState<string | null>(null)
  const [mode, setMode]         = useState<'login' | 'forgot' | 'reset'>('login')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Detectar si viene de link de reset
  const hash = window.location.hash
  const isReset = hash.includes('type=recovery')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (mode === 'forgot') {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/#type=recovery'
      })
      if (resetError) {
        setError('Error al enviar el email. Verifica que el correo sea correcto.')
      } else {
        setSuccess('Te enviamos un email con el link para restablecer tu contraseña. Revisa tu bandeja.')
      }
      setLoading(false)
      return
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.')
      setLoading(false)
      return
    }
    const role = data.user?.user_metadata?.role
    if (role !== 'admin') {
      await supabase.auth.signOut()
      setError('No tienes permisos de administrador.')
      setLoading(false)
      return
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) {
      setError('Error al actualizar la contraseña. El link puede haber expirado.')
    } else {
      setSuccess('Contraseña actualizada correctamente. Ya puedes iniciar sesión.')
      window.location.hash = ''
      setTimeout(() => window.location.reload(), 2000)
    }
    setLoading(false)
  }

  const inp: React.CSSProperties = {
    width: '100%',
    background: '#111820',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    padding: '12px 14px',
    color: '#E8EDF2',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    marginTop: '6px',
  }

  const lbl: React.CSSProperties = {
    fontSize: '12px',
    color: '#6B7A8D',
    display: 'block',
  }

  const btn: React.CSSProperties = {
    width: '100%',
    background: '#00E87A',
    color: '#070B0F',
    border: 'none',
    borderRadius: '8px',
    padding: '13px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '8px',
  }

  const link: React.CSSProperties = {
    color: '#00E87A',
    cursor: 'pointer',
    fontSize: '13px',
    background: 'none',
    border: 'none',
    padding: 0,
    textDecoration: 'underline',
  }

  // Modo reset de contraseña (viene del email link)
  if (isReset) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">IGoIA<span>.</span></div>
          <div className="login-subtitle">Nueva Contraseña</div>
          <form className="login-form" onSubmit={handleResetPassword}>
            {error && <div className="login-error">{error}</div>}
            {success && <div style={{ background: '#00E87A15', border: '1px solid #00E87A40', borderRadius: '8px', padding: '12px', color: '#00E87A', fontSize: '13px', marginBottom: '12px' }}>{success}</div>}
            <div className="form-group">
              <label style={lbl}>Nueva contraseña</label>
              <input style={inp} type="password" placeholder="Mínimo 8 caracteres" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} />
            </div>
            <div className="form-group">
              <label style={lbl}>Confirmar contraseña</label>
              <input style={inp} type="password" placeholder="Repite la contraseña" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
            <button style={btn} type="submit" disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar contraseña →'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Modo olvidé contraseña
  if (mode === 'forgot') {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">IGoIA<span>.</span></div>
          <div className="login-subtitle">Recuperar Contraseña</div>
          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="login-error">{error}</div>}
            {success && <div style={{ background: '#00E87A15', border: '1px solid #00E87A40', borderRadius: '8px', padding: '12px', color: '#00E87A', fontSize: '13px', marginBottom: '12px' }}>{success}</div>}
            {!success && (
              <>
                <p style={{ color: '#6B7A8D', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5' }}>
                  Ingresa tu email y te enviaremos un link para restablecer tu contraseña.
                </p>
                <div className="form-group">
                  <label style={lbl}>Email</label>
                  <input style={inp} type="email" placeholder="admin@igoia.cl" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <button style={btn} type="submit" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar link →'}
                </button>
              </>
            )}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button style={link} type="button" onClick={() => { setMode('login'); setError(null); setSuccess(null) }}>
                ← Volver al login
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // Login normal
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">IGoIA<span>.</span></div>
        <div className="login-subtitle">Admin Portal</div>
        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="admin@igoia.cl" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <div style={{ textAlign: 'right', marginBottom: '8px' }}>
            <button style={link} type="button" onClick={() => { setMode('forgot'); setError(null) }}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Ingresar →'}
          </button>
        </form>
      </div>
    </div>
  )
}
