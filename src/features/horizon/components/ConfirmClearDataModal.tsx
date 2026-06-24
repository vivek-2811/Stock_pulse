import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ConfirmClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmClearDataModal: React.FC<ConfirmClearDataModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl glass-card border border-border-glass bg-[#0e1218]/95 backdrop-blur-2xl shadow-2xl p-6 text-center"
          >
            {/* Header Icon */}
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto mb-4 animate-bounce">
              <AlertTriangle className="w-6 h-6" />
            </div>

            {/* Content */}
            <h3 className="text-base font-bold text-white tracking-tight">Clear Transaction Feed?</h3>
            <p className="text-xs text-text-muted mt-2 leading-relaxed">
              This is a destructive action. Disconnecting linked accounts will clear all transactional log history. Are you sure you want to proceed?
            </p>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-border-glass bg-surface-low hover:bg-white/5 hover:border-white/10 text-white text-xs font-bold transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                Yes, Clear Data
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default ConfirmClearDataModal;
