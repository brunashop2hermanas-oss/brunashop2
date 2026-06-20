import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('bruna_auth');
  const path = request.nextUrl.pathname;

  // Si intenta acceder al login pero ya tiene sesión, lo enviamos de vuelta al panel
  if (path === '/login' || path === '/login/') {
    if (authCookie) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // Solo proteger rutas que empiecen con /admin
  if (path.startsWith('/admin')) {
    // Si no hay cookie de sesión, redirigir al login
    if (!authCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Proteger rutas según permisos
    const userRoleCookie = request.cookies.get('bruna_user_role')?.value;
    if (userRoleCookie !== "ADMINISTRADOR" && userRoleCookie !== "ADMIN") {
      const permsCookie = request.cookies.get('bruna_user_permissions')?.value;
      let perms: string[] = [];
      if (permsCookie) {
        try {
          perms = JSON.parse(decodeURIComponent(permsCookie));
        } catch(e){}
      }

      const checks = [
        { route: '/admin/nueva-venta', perm: 'ACCESO_CAJA' },
        { route: '/admin/pedidos', perm: 'ACCESO_PEDIDOS' },
        { route: '/admin/productos', perm: 'ACCESO_CATALOGO' },
        { route: '/admin/clientas', perm: 'ACCESO_CLIENTAS' },
        { route: '/admin/reportes', perm: 'ACCESO_REPORTES' },
        { route: '/admin/configuracion', perm: 'ACCESO_CONFIGURACION' }
      ];

      for (const check of checks) {
        if (path.startsWith(check.route) && !perms.includes(check.perm)) {
          return NextResponse.redirect(new URL('/admin', request.url));
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
