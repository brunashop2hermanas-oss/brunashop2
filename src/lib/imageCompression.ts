import imageCompression from 'browser-image-compression';

/**
 * Comprime una imagen en el cliente para reducir su tamaño y optimizar
 * su carga, sin perder demasiada calidad.
 * @param file Archivo File a comprimir
 * @returns Promesa que resuelve al File comprimido
 */
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1, // Tamaño máximo de 1MB (mantiene buena calidad)
    maxWidthOrHeight: 1280, // Redimensiona para web (evita resoluciones exageradas)
    useWebWorker: true,
    fileType: file.type, // Mantiene el formato original (jpeg, png, webp, etc.)
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    // Convertir de Blob a File (manteniendo nombre original)
    return new File([compressedBlob], file.name, {
      type: compressedBlob.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Error al comprimir la imagen:', error);
    // Si falla por alguna razón (ej. formato no soportado), retorna el archivo original
    return file;
  }
}
