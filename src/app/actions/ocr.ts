"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function extraerDatosComprobante(base64Image: string, mimeType: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, error: "La clave de API de Gemini no está configurada." };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Eres un asistente experto en contabilidad de Bolivia. Tu tarea es extraer la información del depositante (el titular de la cuenta de origen) de esta captura de pantalla de una transferencia bancaria o recibo de pago por QR.
      Solo me interesa el nombre completo del depositante.
      Devuélvelo ESTRICTAMENTE en formato JSON plano, con esta estructura exacta y sin formato markdown:
      {
        "nombres": "Nombres del depositante (si los hay)",
        "apellidoPaterno": "El primer apellido del depositante",
        "apellidoMaterno": "El segundo apellido del depositante (si lo tiene, si no, déjalo vacío)",
        "ci": "El Carnet de Identidad o documento del depositante (solo el número). Si no aparece en el comprobante, déjalo vacío"
      }
      Si no encuentras el nombre del depositante, devuelve los campos vacíos (""). No inventes datos.
    `;

    // Limpiar el base64 si incluye el prefijo (ej: "data:image/jpeg;base64,...")
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType
        }
      }
    ]);

    const text = result.response.text();
    let parsedData = { nombres: "", apellidoPaterno: "", apellidoMaterno: "", ci: "" };

    try {
      // Limpiar backticks de markdown si la IA los devuelve por error
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Error al parsear el JSON de Gemini:", text);
      return { success: false, error: "La IA no devolvió un formato válido." };
    }

    return { success: true, data: parsedData };
  } catch (error: any) {
    console.error("Error en OCR con Gemini:", error);
    return { success: false, error: error.message };
  }
}
