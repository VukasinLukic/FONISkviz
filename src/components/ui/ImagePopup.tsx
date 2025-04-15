import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImagePopupProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  alt?: string;
}

const ImagePopup: React.FC<ImagePopupProps> = ({ 
  imageUrl, 
  isOpen, 
  onClose,
  alt = 'Image'
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative max-w-4xl max-h-[90vh] overflow-hidden bg-primary border-4 border-accent/30 rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button in top-right corner */}
            <button 
              onClick={onClose}
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white shadow-lg hover:bg-secondary/90 transition-colors z-10"
              aria-label="Close"
            >
              <p className="text-accent text-2xl">X</p>
            </button>

            {/* The image */}
            <img 
              src={imageUrl} 
              alt={alt}
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg" 
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImagePopup; 