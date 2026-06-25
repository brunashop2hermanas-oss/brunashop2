"use server";
import { revalidatePath } from "next/cache";

import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No se proporcionó ningún archivo" };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generar un nombre único
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${uuidv4()}.${ext}`;

    // Subir a Supabase Storage (Bucket: brunashop2)
    const { data, error } = await supabase.storage
      .from('brunashop2')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      throw new Error(`Error subiendo a Supabase: ${error.message}`);
    }

    // Obtener la URL pública de la imagen
    const { data: publicUrlData } = supabase.storage
      .from('brunashop2')
      .getPublicUrl(filename);

    revalidatePath('/', 'layout');
    return { 
      success: true, 
      url: publicUrlData.publicUrl
    };
  } catch (error: any) {
    console.error("Upload error:", error);
    return { success: false, error: error.message };
  }
}
