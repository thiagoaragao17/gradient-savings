'use server'

import { db } from './supabase'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import type { Prospect } from './types'

function generateToken(): string {
  return randomBytes(3).toString('hex') // 6 lowercase hex chars e.g. "a3k9m2"
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const password = formData.get('password') as string
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword) return { error: 'ADMIN_PASSWORD env var not set.' }
  if (password !== adminPassword) return { error: 'Incorrect password.' }

  const cookieStore = await cookies()
  cookieStore.set('admin_session', password, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  redirect('/admin')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_session')
  redirect('/admin/login')
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
  await db.from('prospects').delete().eq('id', id)
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
  revalidatePath('/admin')
  redirect(`/admin/${newProspect.id}/edit`)
}

// ── View tracking ─────────────────────────────────────────────────────────────

export async function logProspectView(prospectId: string) {
  const now = new Date().toISOString()
  await db.from('prospect_views').insert({ prospect_id: prospectId })

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
  default_expiry_days: number
  signup_url_template: string | null
}

export async function getSettings(): Promise<AppSettings> {
  const { data } = await db.from('app_settings').select('*').eq('id', 1).single()
  return (data as AppSettings) ?? {
    rep_name: 'Colin Knox',
    rep_email: 'colin.knox@meetgradient.com',
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
