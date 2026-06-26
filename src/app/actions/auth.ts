"use server";
import { revalidatePath } from "next/cache";

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
    const ONE_YEAR = 60 * 60 * 24 * 365; // 1 año

    cookieStore.set("bruna_auth", "true", { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      maxAge: ONE_YEAR,
      path: "/"
    });

    // Añadir maxAge a todas las cookies para que no sean "Cookies de Sesión"
    cookieStore.set("bruna_user_role", user.role, { path: "/", maxAge: ONE_YEAR, httpOnly: false });
    cookieStore.set("bruna_user_name", `${user.nombres} ${user.apellidos}`, { path: "/", maxAge: ONE_YEAR, httpOnly: false });
    cookieStore.set("bruna_user_id", user.id, { path: "/", maxAge: ONE_YEAR, httpOnly: false });
    cookieStore.set("bruna_user_permissions", JSON.stringify(user.permisos || []), { path: "/", maxAge: ONE_YEAR, httpOnly: false });

    revalidatePath('/', 'layout');
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
  cookieStore.delete("bruna_user_permissions");
  revalidatePath('/', 'layout');
    return { success: true };
}

export async function getUserRole() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("bruna_user_id")?.value;
  if (!userId) return "";
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    return user?.role || "";
  } catch (e) {
    return "";
  }
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

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Error al cambiar la contraseña." };
  }
}
