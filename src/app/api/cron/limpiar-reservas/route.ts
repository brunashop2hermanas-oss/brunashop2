import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { cancelarVentaExpirada } from '@/app/actions/ventas';

// Esta ruta debe ser invocada por un servicio cron externo (ej. Vercel Cron, cron-job.org)
// cada 1 minuto para liberar el stock de las reservas expiradas.

export async function GET(request: Request) {
  try {
    const ahora = new Date();
    
    // Buscar todas las ventas expiradas que sigan esperando pago
    const ventasExpiradas = await prisma.venta.findMany({
      where: {
        estado: 'ESPERANDO_PAGO',
        expiresAt: {
          lte: ahora
        }
      },
      select: { id: true }
    });

    let canceladas = 0;
    
    for (const venta of ventasExpiradas) {
      const res = await cancelarVentaExpirada(venta.id);
      if (res.success) {
        canceladas++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cron ejecutado. Se cancelaron ${canceladas} reservas expiradas.`,
      timestamp: ahora.toISOString()
    });
  } catch (error: any) {
    console.error("Error en cron limpiar-reservas:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
