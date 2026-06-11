import AdminNav from '@/components/AdminNav'
import AdminTabs from '@/components/AdminTabs'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f6f3' }}>
      <AdminNav />
      <AdminTabs />
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
