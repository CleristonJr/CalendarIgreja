import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Rotas que exigem autenticação para acessar
const PROTECTED_PATTERNS = [
  '/gestao',
  /^\/[^/]+\/calendario/,
  /^\/[^/]+\/configuracoes/,
  /^\/[^/]+\/escala/,
]

// Rotas que nunca devem ser interceptadas
const PUBLIC_ROUTES = ['/', '/login', '/solicitar', '/trocar-senha']

function isProtectedRoute(pathname: string): boolean {
  for (const pattern of PROTECTED_PATTERNS) {
    if (typeof pattern === 'string') {
      if (pathname.startsWith(pattern)) return true
    } else {
      if (pattern.test(pathname)) return true
    }
  }
  return false
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignora assets estáticos e API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // arquivos estáticos (favicon, etc.)
  ) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh da sessão (mantém tokens atualizados)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Se a rota é protegida e o usuário não está autenticado, redireciona para login
  if (!user && isProtectedRoute(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
