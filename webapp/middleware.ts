import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // default to bridge page when loading home page
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/bridge', request.url))
  }
  return undefined
}
