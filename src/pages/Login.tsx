import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.')
      setLoading(false)
      return
    }

    // Verificar que el usuario tiene rol admin
    const role = data.user?.user_metadata?.role
    if (role !== 'admin') {
      await supabase.auth.signOut()
      setError('No tienes permisos de administrador.')
      setLoading(false)
      return
    }
    // Si todo ok, App.tsx detecta la sesión y muestra Dashboard
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">IGoIA<span>.</span></div>
        <div className="login-subtitle">Admin Portal</div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="admin@igoia.cl"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Ingresar →'}
          </button>
        </form>
      </div>
    </div>
  )
}
