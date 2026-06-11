'use client'

import { useActionState } from 'react'
import { saveSettings } from '@/lib/actions'
import type { AppSettings } from '@/lib/actions'
import { ChevronRight, User, Clock, Link as LinkIcon } from 'lucide-react'

export default function SettingsForm({ settings }: { settings: AppSettings }) {
  const [state, formAction, pending] = useActionState(saveSettings, null)

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
          Settings saved.
        </div>
      )}

      {/* Point of Contact */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <User size={16} className="text-brand-400" />
          <h2 className="font-semibold text-brand-900">Default Point of Contact</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Pre-filled on every new quote. The rep can override it per quote.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name">
            <input name="rep_name" defaultValue={settings.rep_name} required className={input} placeholder="Colin Knox" />
          </Field>
          <Field label="Email">
            <input name="rep_email" type="email" defaultValue={settings.rep_email} required className={input} placeholder="colin.knox@meetgradient.com" />
          </Field>
          <Field label="Photo URL or path" hint="e.g. /avatars/colin-knox.png">
            <input name="rep_photo" defaultValue={settings.rep_photo ?? ''} className={input} placeholder="/avatars/colin-knox.png" />
          </Field>
        </div>
      </section>

      {/* Quote defaults */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-brand-400" />
          <h2 className="font-semibold text-brand-900">Quote Defaults</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Default Expiry (days)" hint="How long new quotes stay active">
            <input
              name="default_expiry_days"
              type="number"
              min="1"
              max="365"
              defaultValue={settings.default_expiry_days}
              required
              className={input}
            />
          </Field>
        </div>
      </section>

      {/* Signup URL */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <LinkIcon size={16} className="text-brand-400" />
          <h2 className="font-semibold text-brand-900">Default Sign-Up URL</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Used as a fallback when no sign-up URL is set on the quote.
        </p>
        <Field label="Sign-Up URL">
          <input
            name="signup_url_template"
            type="url"
            defaultValue={settings.signup_url_template ?? ''}
            className={input}
            placeholder="https://app.helcim.com/signup?ref=gradient"
          />
        </Field>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save Settings'}
          {!pending && <ChevronRight size={15} />}
        </button>
      </div>
    </form>
  )
}

const input =
  'w-full px-3.5 py-2.5 rounded-lg border border-brand-200 text-brand-900 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-white ' +
  'placeholder:text-brand-300'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-brand-800 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-brand-400 mt-1">{hint}</p>}
    </div>
  )
}
