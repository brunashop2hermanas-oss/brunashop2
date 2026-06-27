import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Mapa en memoria para el Rate Limiting
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

// Configuración del Rate Limiting
const RATE_LIMIT = 300; // Maximo 300 peticiones
const TIME_WINDOW_MS = 60 * 1000; // 1 minuto

export function middleware(request: NextRequest) {
  // --- 1. RATE LIMITING (Límite de Peticiones) ---
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const currentTime = Date.now();

  const ipData = rateLimitMap.get(ip);

  if (!ipData) {
    rateLimitMap.set(ip, { count: 1, lastReset: currentTime });
  } else {
    // Si ya pasó el tiempo (1 minuto), reseteamos el contador
    if (currentTime - ipData.lastReset > TIME_WINDOW_MS) {
      rateLimitMap.set(ip, { count: 1, lastReset: currentTime });
    } else {
      // Si estamos dentro del minuto, incrementamos las peticiones
      ipData.count += 1;
      if (ipData.count > RATE_LIMIT) {
        // Bloquear petición si supera el límite
        return new NextResponse(
          JSON.stringify({ error: "Has realizado demasiadas solicitudes en muy poco tiempo. Por favor, espera un momento." }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  }

  // --- 2. AUTHENTICATION & SECURITY LOGIC ---
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
  // Ejecutar el middleware en TODAS las rutas excepto archivos estáticos (imágenes, fuentes, css)
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
