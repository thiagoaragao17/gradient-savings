import Image from 'next/image'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { logout } from '@/lib/actions'

export default function AdminNav() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
        <Link href="/admin" className="flex items-center gap-3">
          <Image
            src="/logo-payments.svg"
            alt="Gradient Payments"
            width={130}
            height={24}
          />
          <span className="text-gray-400 text-xs font-medium tracking-widest uppercase hidden sm:block">
            Admin
          </span>
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-sm transition-colors"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </form>
      </div>
    </nav>
  )
}
