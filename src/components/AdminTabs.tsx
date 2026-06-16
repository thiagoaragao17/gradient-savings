'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, BarChart3, Activity, Settings, Layers, Calculator, ExternalLink } from 'lucide-react'

const TABS = [
  { href: '/admin',                label: 'Quotes',         icon: FileText     },
  { href: '/admin/analytics',      label: 'Analytics',      icon: BarChart3    },
  { href: '/admin/activity',       label: 'Activity',       icon: Activity     },
  { href: '/admin/tiers',          label: 'Tiers & Rates',  icon: Layers       },
  { href: '/admin/pricing-tool',   label: 'Pricing Tool',   icon: Calculator   },
  { href: '/admin/helcim-pricing', label: 'Helcim Pricing', icon: ExternalLink },
  { href: '/admin/settings',       label: 'Settings',       icon: Settings     },
]

export default function AdminTabs() {
  const pathname = usePathname()

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-1" aria-label="Admin tabs">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${active
                    ? 'border-brand-500 text-brand-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                  }
                `}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
