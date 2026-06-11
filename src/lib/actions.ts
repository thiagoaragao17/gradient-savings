'use server'

import { db } from './supabase'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import type { Prospect } from './types'

function generateToken(): string {
  return randomBytes(3).toString('hex')
}

function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export async function login(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Try DB users first
  const { data: user } = await db
    .from('admin_users')
    .select('id, password_hash, is_active')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (user && user.is_active) {
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return { error: 'Incorrect email or password.' }
    const token = generateSessionToken()
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    await db.from('admin_sessions').insert({ token, user_id: user.id, expires_at: expires })
    await setSessionCookie(token)
    redirect('/admin')
  }

  // Fallback: legacy ADMIN_PASSWORD (email field ignored, treated as password-only)
  const adminPassword = process.env.ADMIN_PASSWORD
  if (adminPassword && password === adminPassword) {
    const token = `legacy:${password}`
    await setSessionCookie(token)
    redirect('/admin')
  }

  return { error: 'Incorrect email or password.' }
}

export async function logout() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  if (token && !token.startsWith('legacy:')) {
    await db.from('admin_sessions').delete().eq('token', token)
  }
  cookieStore.delete('admin_session')
  redirect('/admin/login')
}

export async function validateSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  if (!token) return false

  // Legacy password-based session
  if (token.startsWith('legacy:')) {
    const password = token.slice(7)
    return password === process.env.ADMIN_PASSWORD
  }

  // DB session
  const { data } = await db
    .from('admin_sessions')
    .select('expires_at, admin_users(is_active)')
    .eq('token', token)
    .single()

  if (!data) return false
  if (new Date(data.expires_at) < new Date()) return false
  const users = data.admin_users as unknown as { is_active: boolean } | null
  return users?.is_active !== false
}

// ── Audit log ─────────────────────────────────────────────────────────────────

type AuditAction =
  | 'quote_created'
  | 'quote_deleted'
  | 'quote_duplicated'
  | 'prospect_viewed'
  | 'user_created'
  | 'user_deleted'
  | 'user_deactivated'
  | 'user_activated'

async function getActorName(): Promise<string> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_session')?.value
    if (!token) return 'System'
    if (token.startsWith('legacy:')) return 'Admin'
    const { data } = await db
      .from('admin_sessions')
      .select('admin_users(name)')
      .eq('token', token)
      .single()
    const user = data?.admin_users as unknown as { name: string } | null
    return user?.name ?? 'Admin'
  } catch {
    return 'System'
  }
}

async function auditLog(
  action: AuditAction,
  target_label: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const actor_name = await getActorName()
  await db.from('audit_log').insert({ actor_name, action, target_label, metadata: metadata ?? {} })
}

export interface AuditEntry {
  id: string
  actor_name: string
  action: AuditAction
  target_label: string
  metadata: Record<string, unknown>
  created_at: string
}

export async function getAuditLog(limit = 100): Promise<AuditEntry[]> {
  const { data } = await db
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as AuditEntry[]
}

// ── User management ───────────────────────────────────────────────────────────

export interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const { data } = await db
    .from('admin_users')
    .select('id, name, email, role, is_active, created_at')
    .order('created_at', { ascending: true })
  return (data ?? []) as AdminUser[]
}

export async function createAdminUser(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const name = (formData.get('name') as string).trim()
  const email = (formData.get('email') as string).trim().toLowerCase()
  const password = (formData.get('password') as string)
  const role = (formData.get('role') as string) || 'admin'

  if (!name || !email || !password) return { error: 'All fields are required.' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }

  const password_hash = await bcrypt.hash(password, 12)
  const { error } = await db.from('admin_users').insert({ name, email, password_hash, role, is_active: true })

  if (error) {
    if (error.code === '23505') return { error: 'An account with that email already exists.' }
    return { error: error.message }
  }

  await auditLog('user_created', name, { email, role })
  revalidatePath('/admin/settings')
  return { success: true }
}

export async function deleteAdminUser(id: string): Promise<void> {
  const { data } = await db.from('admin_users').select('name, email').eq('id', id).single()
  await db.from('admin_sessions').delete().eq('user_id', id)
  await db.from('admin_users').delete().eq('id', id)
  if (data) await auditLog('user_deleted', data.name, { email: data.email })
  revalidatePath('/admin/settings')
}

export async function toggleAdminUser(id: string, is_active: boolean): Promise<void> {
  const { data } = await db.from('admin_users').select('name').eq('id', id).single()
  await db.from('admin_users').update({ is_active }).eq('id', id)
  if (!is_active) await db.from('admin_sessions').delete().eq('user_id', id)
  if (data) await auditLog(is_active ? 'user_activated' : 'user_deactivated', data.name)
  revalidatePath('/admin/settings')
}

export async function changeAdminPassword(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const id = formData.get('user_id') as string
  const password = formData.get('new_password') as string
  if (!password || password.length < 8) return { error: 'Password must be at least 8 characters.' }
  const password_hash = await bcrypt.hash(password, 12)
  await db.from('admin_users').update({ password_hash }).eq('id', id)
  await db.from('admin_sessions').delete().eq('user_id', id)
  revalidatePath('/admin/settings')
  return { success: true }
}

// ── Form parsing ──────────────────────────────────────────────────────────────

function parseProspectForm(formData: FormData) {
  const inPersonPct = Number(formData.get('processing_in_person_pct') ?? 0)
  const currentCost = Number(formData.get('current_monthly_cost'))
  const newCost = Number(formData.get('new_monthly_cost'))
  const monthly = currentCost - newCost

  let interchangeData = {}
  const raw = (formData.get('interchange_json') as string)?.trim()
  if (raw) {
    try {
      interchangeData = JSON.parse(raw)
    } catch {
      // silently ignore malformed JSON — interchange is optional
    }
  }

  return {
    slug: (formData.get('slug') as string).trim().toLowerCase(),
    company_name: (formData.get('company_name') as string).trim(),
    company_address: (formData.get('company_address') as string)?.trim() || null,
    statement_date: (formData.get('statement_date') as string).trim(),
    current_provider: (formData.get('current_provider') as string).trim(),
    total_volume: Number(formData.get('total_volume')),
    total_transactions: Number(formData.get('total_transactions')),
    processing_in_person_pct: inPersonPct,
    processing_keyed_pct: 100 - inPersonPct,
    card_consumer_pct: Number(formData.get('card_consumer_pct') ?? 0),
    card_premium_pct: Number(formData.get('card_premium_pct') ?? 0),
    card_corporate_pct: Number(formData.get('card_corporate_pct') ?? 0),
    current_monthly_cost: currentCost,
    new_monthly_cost: newCost,
    current_effective_rate: Number(formData.get('current_effective_rate')),
    new_effective_rate: Number(formData.get('new_effective_rate')),
    monthly_savings: monthly,
    annual_savings: monthly * 12,
    helcim_tier: Number(formData.get('helcim_tier') ?? 2),
    helcim_comparison_number: Number(formData.get('helcim_comparison_number')) || null,
    helcim_link: (formData.get('helcim_link') as string)?.trim() || null,
    signup_url: (formData.get('signup_url') as string)?.trim() || null,
    rep_name: (formData.get('rep_name') as string)?.trim() || null,
    rep_email: (formData.get('rep_email') as string)?.trim() || null,
    rep_phone: (formData.get('rep_phone') as string)?.trim() || null,
    rep_photo: (formData.get('rep_photo') as string)?.trim() || null,
    expiry_date: formData.get('expiry_date') as string,
    status: (formData.get('status') as Prospect['status']) ?? 'active',
    interchange_data: interchangeData,
  }
}

// ── Prospects ─────────────────────────────────────────────────────────────────

export async function getProspects(): Promise<Prospect[]> {
  const { data, error } = await db
    .from('prospects')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Prospect[]
}

export async function getProspectBySlug(slug: string): Promise<Prospect | null> {
  const { data, error } = await db
    .from('prospects')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) return null
  return data as Prospect
}

export async function getProspectById(id: string): Promise<Prospect | null> {
  const { data, error } = await db
    .from('prospects')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data as Prospect
}

export async function createProspect(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const payload = parseProspectForm(formData)

  // Generate opaque slug: [6-char token]-[helcim_comparison_number or random fallback]
  const suffix = payload.helcim_comparison_number ?? parseInt(randomBytes(2).toString('hex'), 16)
  let slug = `${generateToken()}-${suffix}`
  // Guarantee uniqueness (collision is astronomically unlikely but handle it)
  while (true) {
    const { data } = await db.from('prospects').select('id').eq('slug', slug).maybeSingle()
    if (!data) break
    slug = `${generateToken()}-${suffix}`
  }
  payload.slug = slug

  const { error } = await db.from('prospects').insert(payload)
  if (error) return { error: error.message }
  await auditLog('quote_created', payload.company_name, { slug: payload.slug })
  revalidatePath('/admin')
  redirect('/admin')
}

export async function updateProspect(
  id: string,
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const payload = parseProspectForm(formData)
  const { error } = await db.from('prospects').update(payload).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  redirect('/admin')
}

export async function updateProspectStatus(id: string, status: Prospect['status']) {
  await db.from('prospects').update({ status }).eq('id', id)
  revalidatePath('/admin')
}

export async function updateLeadStage(id: string, lead_stage: Prospect['lead_stage']) {
  await db.from('prospects').update({ lead_stage }).eq('id', id)
  revalidatePath('/admin')
}

export async function deleteProspect(id: string) {
  const { data } = await db.from('prospects').select('company_name').eq('id', id).single()
  await db.from('prospects').delete().eq('id', id)
  if (data) await auditLog('quote_deleted', data.company_name)
  revalidatePath('/admin')
}

export async function duplicateProspect(id: string) {
  const original = await getProspectById(id)
  if (!original) return

  // Find a unique slug by appending -copy, -copy-2, etc.
  let slug = `${original.slug}-copy`
  let attempt = 1
  while (true) {
    const { data } = await db.from('prospects').select('id').eq('slug', slug).maybeSingle()
    if (!data) break
    attempt++
    slug = `${original.slug}-copy-${attempt}`
  }

  const { data: newProspect, error } = await db
    .from('prospects')
    .insert({
      ...original,
      id: undefined,
      slug,
      created_at: undefined,
      view_count: 0,
      first_viewed_at: null,
      last_viewed_at: null,
      status: 'inactive',
    })
    .select('id')
    .single()

  if (error || !newProspect) return
  await auditLog('quote_duplicated', original.company_name, { new_slug: slug })
  revalidatePath('/admin')
  redirect(`/admin/${newProspect.id}/edit`)
}

// ── View tracking ─────────────────────────────────────────────────────────────

export async function logProspectView(prospectId: string) {
  const now = new Date().toISOString()
  await db.from('prospect_views').insert({ prospect_id: prospectId })
  const { data: prospect } = await db.from('prospects').select('company_name').eq('id', prospectId).single()
  if (prospect) await db.from('audit_log').insert({ actor_name: 'Prospect', action: 'prospect_viewed', target_label: prospect.company_name, metadata: {} })

  const { data } = await db
    .from('prospects')
    .select('view_count, first_viewed_at')
    .eq('id', prospectId)
    .single()

  await db
    .from('prospects')
    .update({
      view_count: (data?.view_count ?? 0) + 1,
      first_viewed_at: data?.first_viewed_at ?? now,
      last_viewed_at: now,
    })
    .eq('id', prospectId)
}

// ── Settings ──────────────────────────────────────────────────────────────────

export interface AppSettings {
  rep_name: string
  rep_email: string
  rep_photo: string | null
  default_expiry_days: number
  signup_url_template: string | null
}

export async function getSettings(): Promise<AppSettings> {
  const { data } = await db.from('app_settings').select('*').eq('id', 1).single()
  return (data as AppSettings) ?? {
    rep_name: 'Colin Knox',
    rep_email: 'colin.knox@meetgradient.com',
    rep_photo: null,
    default_expiry_days: 90,
    signup_url_template: null,
  }
}

export async function saveSettings(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const settings = {
    rep_name: (formData.get('rep_name') as string).trim(),
    rep_email: (formData.get('rep_email') as string).trim(),
    rep_photo: (formData.get('rep_photo') as string)?.trim() || null,
    default_expiry_days: Number(formData.get('default_expiry_days')) || 90,
    signup_url_template: (formData.get('signup_url_template') as string)?.trim() || null,
  }

  const { error } = await db
    .from('app_settings')
    .upsert({ id: 1, ...settings }, { onConflict: 'id' })

  if (error) return { error: error.message }
  revalidatePath('/admin/settings')
  return { success: true }
}

export async function bulkDeleteExpired(): Promise<{ deleted: number }> {
  const { data, error } = await db
    .from('prospects')
    .delete()
    .lt('expiry_date', new Date().toISOString().slice(0, 10))
    .select('id')
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/admin/analytics')
  return { deleted: data?.length ?? 0 }
}

export async function bulkDeleteByStatus(status: string): Promise<{ deleted: number }> {
  const { data, error } = await db
    .from('prospects')
    .delete()
    .eq('status', status)
    .select('id')
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/admin/analytics')
  return { deleted: data?.length ?? 0 }
}
