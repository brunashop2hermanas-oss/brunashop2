"use server";

import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function loginUser(usuario: string, pin: string) {
  try {
    // 1. Validar usuario en la Base de Datos (La creación inicial ya se realizó)

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
    if (error.message?.includes("DATABASE_URL") || error.message?.includes("Environment variable not found")) {
      return { success: false, error: "Faltan configurar las variables de entorno (Base de Datos) en Render. Por favor revisa la configuración." };
    }
    return { success: false, error: "Error de conexión. Asegúrate de que la base de datos esté configurada correctamente." };
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

export async function resetPassword(username: string, ci: string, newPin: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user || user.ci !== ci) {
      return { success: false, error: "Los datos ingresados no coinciden." };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { pin: newPin }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Error al cambiar la contraseña." };
  }
}
