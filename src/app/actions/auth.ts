"use server";

import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function loginUser(usuario: string, pin: string) {
  try {
    // 1. Check if ANY user exists. If none, create the default "bruna" / "bruna123"
    const totalUsuarios = await prisma.user.count();
    
    if (totalUsuarios === 0) {
      await prisma.user.create({
        data: {
          nombres: "Dueña",
          apellidos: "Bruna",
          ci: "000000",
          telefono: "00000000",
          username: "bruna",
          pin: "bruna123",
          role: "ADMIN"
        }
      });
    }

    // 2. Validate against Database
    const user = await prisma.user.findUnique({
      where: { username: usuario }
    });

    if (!user || user.pin !== pin) {
      return { success: false, error: "Usuario o contraseña incorrectos." };
    }

    // 3. Set Cookie with User Info (Simple version: we just store the role and id)
    // In a real production app, we should use JWT
    const cookieStore = await cookies();
    cookieStore.set("bruna_auth", "true", { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/"
    });

    // Optionally we can store who is logged in to use it later
    cookieStore.set("bruna_user_role", user.role, { path: "/" });
    cookieStore.set("bruna_user_name", `${user.nombres} ${user.apellidos}`, { path: "/" });
    cookieStore.set("bruna_user_id", user.id, { path: "/" });

    return { success: true, user: { name: user.nombres, role: user.role } };
  } catch (error: any) {
    return { success: false, error: "Error interno del servidor. " + error.message };
  }
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("bruna_auth");
  cookieStore.delete("bruna_user_role");
  cookieStore.delete("bruna_user_name");
  cookieStore.delete("bruna_user_id");
  return { success: true };
}
