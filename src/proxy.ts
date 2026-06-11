import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('admin_session')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    // Legacy password session — validate against env var
    if (token.startsWith('legacy:')) {
      const password = token.slice(7)
      const adminPassword = process.env.ADMIN_PASSWORD
      if (!adminPassword || password !== adminPassword) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
    }
    // DB sessions are validated server-side in the layout
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
