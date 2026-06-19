import imageCompression from 'browser-image-compression';

/**
 * Comprime una imagen en el cliente para reducir su tamaño y optimizar
 * su carga, sin perder demasiada calidad.
 * @param file Archivo File a comprimir
 * @returns Promesa que resuelve al File comprimido
 */
export async function compressImage(file: File, qualityMode: 'baja' | 'alta' = 'baja'): Promise<File> {
  const options = qualityMode === 'alta' 
  ? {
      maxSizeMB: 4, // Alta calidad (catálogo, guías)
      maxWidthOrHeight: 2500,
      useWebWorker: true,
      fileType: file.type,
    }
  : {
      maxSizeMB: 1, // Baja calidad/alto nivel de compresión (comprobantes de pago)
      maxWidthOrHeight: 1280,
      useWebWorker: true,
      fileType: file.type,
    };

  try {
    const compressedBlob = await imageCompression(file, options);
    return new File([compressedBlob], file.name, {
      type: compressedBlob.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Error al comprimir la imagen:', error);
    return file;
  }
}
