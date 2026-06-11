'use client'

import { useActionState, useState, useTransition, useRef } from 'react'
import { createAdminUser, deleteAdminUser, toggleAdminUser, changeAdminPassword } from '@/lib/actions'
import type { AdminUser } from '@/lib/actions'
import { UserPlus, Trash2, KeyRound, ShieldCheck, ShieldOff, Users, RefreshCw, Eye, EyeOff, Copy, Check } from 'lucide-react'

function generatePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const symbols = '!@#$%&*'
  const all = upper + lower + digits + symbols
  const rand = (s: string) => s[Math.floor(Math.random() * s.length)]
  // Guarantee at least one of each category
  const required = [rand(upper), rand(lower), rand(digits), rand(symbols)]
  const rest = Array.from({ length: 8 }, () => rand(all))
  return [...required, ...rest].sort(() => Math.random() - 0.5).join('')
}

export default function UserManagement({ users }: { users: AdminUser[] }) {
  const [showAdd, setShowAdd] = useState(false)
  const [changingPasswordFor, setChangingPasswordFor] = useState<string | null>(null)

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-brand-400" />
          <h2 className="font-semibold text-brand-900">Users</h2>
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors"
        >
          <UserPlus size={13} />
          Add User
        </button>
      </div>

      {showAdd && (
        <AddUserForm onDone={() => setShowAdd(false)} />
      )}

      {users.length === 0 && !showAdd ? (
        <p className="text-sm text-gray-400 py-4 text-center">No users yet. Add one above.</p>
      ) : (
        <div className="divide-y divide-gray-100 mt-2">
          {users.map(u => (
            <UserRow
              key={u.id}
              user={u}
              isChangingPassword={changingPasswordFor === u.id}
              onChangePassword={() => setChangingPasswordFor(changingPasswordFor === u.id ? null : u.id)}
              onDonePassword={() => setChangingPasswordFor(null)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function AddUserForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, pending] = useActionState(
    async (prev: { error?: string; success?: boolean } | null, fd: FormData) => {
      const result = await createAdminUser(prev, fd)
      if (result.success) onDone()
      return result
    },
    null
  )
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const passwordRef = useRef<HTMLInputElement>(null)

  function handleGenerate() {
    const p = generatePassword()
    setPassword(p)
    setShowPassword(true)
  }

  function handleCopy() {
    if (!password) return
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <form action={formAction} className="bg-brand-50 rounded-lg p-4 mb-4 space-y-3">
      <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide">New User</p>
      {state?.error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">{state.error}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input name="name" required placeholder="Full name" className={input} />
        <input name="email" type="email" required placeholder="email@company.com" className={input} />
        <div className="relative flex items-center sm:col-span-2">
          <input
            ref={passwordRef}
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            placeholder="Password (min 8 chars)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={`${input} pr-28 font-mono`}
          />
          <div className="absolute right-1 flex items-center gap-0.5">
            <button
              type="button"
              onClick={handleGenerate}
              title="Generate password"
              className="p-1.5 text-brand-400 hover:text-brand-600 transition-colors"
            >
              <RefreshCw size={13} />
            </button>
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              title={showPassword ? 'Hide' : 'Show'}
              className="p-1.5 text-brand-400 hover:text-brand-600 transition-colors"
            >
              {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              title="Copy password"
              disabled={!password}
              className="p-1.5 text-brand-400 hover:text-brand-600 transition-colors disabled:opacity-30"
            >
              {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
            </button>
          </div>
        </div>
        <select name="role" className={input}>
          <option value="admin">Admin</option>
          <option value="viewer">Viewer (read-only)</option>
        </select>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onDone} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5">
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-60"
        >
          {pending ? 'Creating…' : 'Create User'}
        </button>
      </div>
    </form>
  )
}

function UserRow({
  user,
  isChangingPassword,
  onChangePassword,
  onDonePassword,
}: {
  user: AdminUser
  isChangingPassword: boolean
  onChangePassword: () => void
  onDonePassword: () => void
}) {
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      await toggleAdminUser(user.id, !user.is_active)
    })
  }

  function handleDelete() {
    if (!window.confirm(`Delete user ${user.name}? This cannot be undone.`)) return
    startTransition(async () => {
      await deleteAdminUser(user.id)
    })
  }

  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-brand-600">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
          <p className="text-xs text-gray-400 truncate">{user.email}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          user.role === 'admin' ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-500'
        }`}>
          {user.role}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggle}
            disabled={isPending}
            title={user.is_active ? 'Deactivate' : 'Activate'}
            className="p-1.5 text-gray-400 hover:text-brand-600 transition-colors disabled:opacity-50"
          >
            {user.is_active ? <ShieldCheck size={15} className="text-green-500" /> : <ShieldOff size={15} className="text-gray-300" />}
          </button>
          <button
            onClick={onChangePassword}
            title="Change password"
            className="p-1.5 text-gray-400 hover:text-brand-600 transition-colors"
          >
            <KeyRound size={15} />
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            title="Delete user"
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {isChangingPassword && (
        <ChangePasswordForm userId={user.id} onDone={onDonePassword} />
      )}
    </div>
  )
}

function ChangePasswordForm({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(
    async (prev: { error?: string; success?: boolean } | null, fd: FormData) => {
      const result = await changeAdminPassword(prev, fd)
      if (result.success) onDone()
      return result
    },
    null
  )

  return (
    <form action={formAction} className="mt-2 ml-11 flex items-center gap-2">
      <input type="hidden" name="user_id" value={userId} />
      <input
        name="new_password"
        type="password"
        required
        placeholder="New password (min 8 chars)"
        className={`${input} text-xs py-1.5 flex-1`}
      />
      {state?.error && <span className="text-xs text-red-500">{state.error}</span>}
      <button type="button" onClick={onDone} className="text-xs text-gray-400 hover:text-gray-600 px-2">
        Cancel
      </button>
      <button
        type="submit"
        disabled={pending}
        className="px-3 py-1.5 bg-brand-500 text-white text-xs rounded-lg hover:bg-brand-600 disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}

const input =
  'w-full px-3 py-2 rounded-lg border border-brand-200 text-brand-900 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-white ' +
  'placeholder:text-brand-300'
