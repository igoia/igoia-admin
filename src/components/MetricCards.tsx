import type { Client } from '../types'
import { PLAN_PRICE } from '../types'

interface Props {
  clients: Client[]
  loading: boolean
}

function fmt(n: number) {
  return n.toLocaleString('es-CL')
}

export default function MetricCards({ clients, loading }: Props) {
  const active    = clients.filter(c => c.status === 'active')
  const trial     = clients.filter(c => c.status === 'trial')
  const suspended = clients.filter(c => c.status === 'suspended')

  const mrr = active.reduce((sum, c) => sum + PLAN_PRICE[c.plan], 0)

  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const newThisMonth = clients.filter(c => c.created_at >= monthStart).length

  const cards = [
    {
      label: 'MRR',
      icon:  '💰',
      value: loading ? '—' : `$${fmt(mrr)}`,
      sub:   'CLP / mes',
      cls:   'green',
    },
    {
      label: 'Clientes activos',
      icon:  '✅',
      value: loading ? '—' : String(active.length),
      sub:   `de ${clients.length} totales`,
      cls:   'green',
    },
    {
      label: 'En trial',
      icon:  '⏳',
      value: loading ? '—' : String(trial.length),
      sub:   'pendientes de conversión',
      cls:   '',
    },
    {
      label: 'Nuevos este mes',
      icon:  '🚀',
      value: loading ? '—' : String(newThisMonth),
      sub:   suspended.length > 0 ? `${suspended.length} suspendidos` : 'sin suspendidos',
      cls:   'cyan',
    },
  ]

  return (
    <div className="metrics-grid">
      {cards.map(card => (
        <div className="metric-card" key={card.label}>
          <div className="metric-label">
            <span className="icon">{card.icon}</span>
            {card.label}
          </div>
          <div className={`metric-value ${card.cls}`}>{card.value}</div>
          <div className="metric-sub">{card.sub}</div>
        </div>
      ))}
    </div>
  )
}
