import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface Props {
  session: Session
  children: React.ReactNode
  currentPage: string
  onNavigate: (page: string) => void
}

export default function Layout({ session, children, currentPage, onNavigate }: Props) {
  const email = session.user.email ?? ''
  const initials = email.slice(0, 2).toUpperCase()

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'clients', icon: '👥', label: 'Clientes' },
    { id: 'billing', icon: '💳', label: 'Billing' },
    { id: 'automations', icon: '⚡', label: 'Automatizaciones' },
    { id: 'invoices', icon: '🧾', label: 'Facturas SII' },
  ]

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>IGoIA<span>.</span></h1>
          <p>Admin Portal</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <div
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              style={{ cursor: 'pointer' }}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initials}</div>
            <div className="user-email">{email}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
