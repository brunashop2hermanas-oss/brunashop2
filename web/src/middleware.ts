import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Solo proteger rutas que empiecen con /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const authCookie = request.cookies.get('bruna_auth');
    
    // Si no hay cookie de sesión, redirigir al login
    if (!authCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
