"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";

export type ConfirmVariant = "danger" | "success" | "warning" | "info";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  variant?: ConfirmVariant;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  variant = "warning",
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <AlertCircle className="w-8 h-8 text-red-500" />,
          button: "bg-red-500 hover:bg-red-600 text-white",
          bg: "bg-red-50",
          border: "border-red-100",
        };
      case "success":
        return {
          icon: <CheckCircle2 className="w-8 h-8 text-green-500" />,
          button: "bg-green-500 hover:bg-green-600 text-white",
          bg: "bg-green-50",
          border: "border-green-100",
        };
      case "info":
        return {
          icon: <Info className="w-8 h-8 text-blue-500" />,
          button: "bg-blue-500 hover:bg-blue-600 text-white",
          bg: "bg-blue-50",
          border: "border-blue-100",
        };
      case "warning":
      default:
        return {
          icon: <AlertTriangle className="w-8 h-8 text-orange-500" />,
          button: "bg-orange-500 hover:bg-orange-600 text-white",
          bg: "bg-orange-50",
          border: "border-orange-100",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
          >
            <div className={`p-6 flex flex-col items-center text-center ${styles.bg} ${styles.border} border-b`}>
              <div className="bg-white p-3 rounded-full shadow-sm mb-4">
                {styles.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
            </div>
            
            <div className="p-4 flex gap-3 bg-white">
              <button
                onClick={onCancel}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm shadow-md transition-all hover:scale-105 active:scale-95 ${styles.button}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
