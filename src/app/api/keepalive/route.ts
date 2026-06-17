import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // O la forma en que estés importando Prisma

export async function GET() {
  try {
    // Hacemos una consulta súper ligera a la base de datos para mantenerla "despierta"
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json(
      { status: 'ok', message: 'Sistema y base de datos activos' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Error al contactar la base de datos' },
      { status: 500 }
    );
  }
}
