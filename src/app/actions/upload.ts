"use server";
import { revalidatePath } from "next/cache";

export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No se proporcionó ningún archivo" };
    }

    const imgbbKey = process.env.IMGBB_API_KEY;
    if (!imgbbKey) {
      console.warn("IMGBB_API_KEY no encontrada. Simulando subida.");
      return { 
        success: true, 
        url: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=500&q=80" 
      };
    }

    const imgbbFormData = new FormData();
    imgbbFormData.append("image", file);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
      method: "POST",
      body: imgbbFormData
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Error al subir la imagen a ImgBB");
    }

    revalidatePath('/', 'layout');
    return { 
      success: true, 
      url: data.data.url
    };
  } catch (error: any) {
    console.error("Upload error:", error);
    return { success: false, error: error.message };
  }
}
