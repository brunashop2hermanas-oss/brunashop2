import React, { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';

export default function ImageCropperModal({ 
  imageSrc, 
  onCropComplete, 
  onCancel,
}: { 
  imageSrc: string; 
  onCropComplete: (croppedBlob: Blob) => void; 
  onCancel: () => void;
}) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const proxiedUrl = imageSrc.startsWith('http') 
    ? `/api/proxy-image?url=${encodeURIComponent(imageSrc)}` 
    : imageSrc;

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
    // Crea un recorte inicial centrado
    const crop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 4 / 5, width, height),
      width,
      height
    );
    setCrop(crop);
  }

  const getCroppedImg = async (
    image: HTMLImageElement,
    crop: PixelCrop
  ): Promise<Blob | null> => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    // Multiplicar por la escala para obtener la resolución real, no la resolución reducida de la pantalla
    const targetWidth = Math.floor(crop.width * scaleX);
    const targetHeight = Math.floor(crop.height * scaleY);
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      targetWidth,
      targetHeight
    );

    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.95);
      } catch (err) {
        console.error('Error in toBlob:', err);
        reject(err);
      }
    });
  };

  const handleConfirm = async () => {
    if (completedCrop && imgRef.current) {
      try {
        setIsProcessing(true);
        const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
        if (croppedBlob) {
          onCropComplete(croppedBlob);
        }
      } catch (err) {
        console.error("Error al aplicar el recorte:", err);
        alert("Ocurrió un error al procesar la imagen. Revisa los permisos o intenta nuevamente.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-2xl bg-background rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-4 border-b border-surface-border flex justify-between items-center bg-surface shrink-0">
          <h2 className="font-bold text-foreground">Recorte Libre</h2>
          <button onClick={onCancel} className="text-foreground/50 hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="relative flex-1 overflow-auto bg-black p-4 flex items-center justify-center min-h-[400px]">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <img
              ref={imgRef}
              src={proxiedUrl}
              crossOrigin="anonymous"
              alt="Crop me"
              style={{ 
                maxHeight: '65vh',
                maxWidth: '100%',
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto'
              }}
              onLoad={onImageLoad}
            />
          </ReactCrop>
        </div>
        <div className="p-4 bg-surface shrink-0">
          <p className="text-xs text-foreground/50 mb-3 text-center">Puedes arrastrar las esquinas libremente para ajustar el tamaño del recorte.</p>
          <div className="flex justify-end gap-3">
            <button 
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-sm font-bold text-foreground/70 hover:bg-surface-border transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirm}
              disabled={!completedCrop || completedCrop.width === 0 || isProcessing}
              className="px-6 py-2 rounded-xl text-sm font-bold bg-brand-primary text-white hover:bg-brand-accent transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {isProcessing ? (
                <span>Procesando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Aplicar Recorte
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
