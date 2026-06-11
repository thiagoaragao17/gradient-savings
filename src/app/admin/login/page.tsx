'use client'

import { useActionState } from 'react'
import Image from 'next/image'
import { login } from '@/lib/actions'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null)

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f7f6f3' }}>
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Image
            src="/logo-payments.svg"
            alt="Gradient Payments"
            width={160}
            height={30}
            priority
          />
        </div>

        <div className="bg-white rounded-2xl border border-brand-100 shadow-sm p-8">
          <h1 className="text-xl font-semibold text-brand-900 mb-1">Admin Access</h1>
          <p className="text-sm text-brand-500 mb-6">Enter your password to continue.</p>

          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-800 mb-1.5">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-lg border border-brand-200 text-brand-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {state?.error && (
              <p className="text-sm text-blush-500">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              {pending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
