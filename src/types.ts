export type PlanType    = 'trial' | 'starter' | 'business' | 'scale'
export type ClientStatus = 'trial' | 'active' | 'suspended' | 'cancelled'

export interface Client {
  id: string
  user_id: string
  business_name: string
  rut: string | null
  email: string
  phone: string | null
  address: string | null
  comuna: string | null
  ciudad: string | null
  plan: PlanType
  status: ClientStatus
  trial_ends_at: string | null
  onboarding_completed_at: string | null
  notes: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export const PLAN_PRICE: Record<PlanType, number> = {
  trial:    0,
  starter:  89_000,
  business: 249_000,
  scale:    580_000,
}

export const PLAN_LABEL: Record<PlanType, string> = {
  trial:    'Trial',
  starter:  'Starter',
  business: 'Business',
  scale:    'Scale',
}

export const STATUS_LABEL: Record<ClientStatus, string> = {
  trial:     'Trial',
  active:    'Activo',
  suspended: 'Suspendido',
  cancelled: 'Cancelado',
}
