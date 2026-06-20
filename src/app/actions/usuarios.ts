"use server";

import prisma from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";

export async function getUsuarios() {
  noStore();
  try {
    const usuarios = await prisma.user.findMany({
      where: { username: { not: "bruna" } },
      orderBy: { createdAt: "asc" }
    });
    return { success: true, data: usuarios };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createUsuario(data: {
  nombres: string;
  apellidos: string;
  ci: string;
  telefono: string;
  username: string;
  pin: string;
  role: string;
  permisos?: string[];
}) {
  try {
    const nuevo = await prisma.user.create({
      data
    });
    return { success: true, data: nuevo };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: "El CI o Username ya están registrados en otro usuario." };
    }
    return { success: false, error: error.message };
  }
}

export async function updateUsuario(id: string, data: {
  nombres?: string;
  apellidos?: string;
  ci?: string;
  telefono?: string;
  role?: string;
  pin?: string;
  permisos?: string[];
}) {
  try {
    const updated = await prisma.user.update({
      where: { id },
      data
    });
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteUsuario(id: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (user?.username === "bruna") {
      return { success: false, error: "No se puede borrar al administrador principal." };
    }
    await prisma.user.delete({
      where: { id }
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
