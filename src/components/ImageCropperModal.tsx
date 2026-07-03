import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';

export default function ImageCropperModal({ 
  imageSrc, 
  onCropComplete, 
  onCancel,
  aspectRatio = 4 / 5
}: { 
  imageSrc: string; 
  onCropComplete: (croppedBlob: Blob) => void; 
  onCancel: () => void;
  aspectRatio?: number;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any,
  ): Promise<Blob | null> => {
    const image = await createImage(imageSrc) as HTMLImageElement;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg');
    });
  };

  const handleConfirm = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-lg bg-background rounded-3xl overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b border-surface-border flex justify-between items-center bg-surface">
          <h2 className="font-bold text-foreground">Recortar Imagen</h2>
          <button onClick={onCancel} className="text-foreground/50 hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="relative h-96 w-full bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={setZoom}
          />
        </div>
        <div className="p-4 bg-surface space-y-4">
          <div>
            <label className="text-xs font-bold text-foreground/70 mb-1 block">Zoom</label>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => {
                setZoom(Number(e.target.value))
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button 
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-sm font-bold text-foreground/70 hover:bg-surface-border transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirm}
              className="px-6 py-2 rounded-xl text-sm font-bold bg-brand-primary text-white hover:bg-brand-accent transition-colors flex items-center gap-2 shadow-lg"
            >
              <Check className="w-4 h-4" />
              Aplicar Recorte
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
