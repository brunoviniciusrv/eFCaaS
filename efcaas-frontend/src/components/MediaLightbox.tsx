import React from 'react';
import { X, FileText, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeConfig } from '../types';

export type MediaItem = {
  id?: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  title?: string;
};

interface MediaLightboxProps {
  item: MediaItem | null;
  onClose: () => void;
  themeConfig: ThemeConfig;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({ item, onClose, themeConfig }) => (
  <AnimatePresence>
    {item && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ backgroundColor: themeConfig.general.modalOverlay }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative max-h-[90vh] max-w-[90vw] overflow-auto rounded-xl shadow-2xl"
          style={{ backgroundColor: themeConfig.general.modalBackground, color: themeConfig.general.modalText }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 rounded-full p-2 opacity-70 hover:opacity-100"
            style={{ backgroundColor: themeConfig.general.mutedBackground }}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
          <div className="p-6 pt-12 min-w-[280px]">
            {item.type === 'image' && (
              <img
                src={item.url}
                alt={item.title ?? 'Imagem'}
                className="max-h-[75vh] max-w-full rounded-lg object-contain mx-auto"
              />
            )}
            {item.type === 'video' && (
              <video src={item.url} controls autoPlay className="max-h-[75vh] max-w-full rounded-lg mx-auto" />
            )}
            {item.type === 'audio' && (
              <div className="flex flex-col items-center gap-4 py-8 px-4">
                <p className="text-sm font-medium">{item.title ?? 'Áudio'}</p>
                <audio src={item.url} controls autoPlay className="w-full max-w-md" />
              </div>
            )}
            {item.type === 'document' && (
              <div className="flex flex-col items-center gap-4 py-8 px-6 text-center">
                <FileText size={48} style={{ color: themeConfig.icons?.muted ?? themeConfig.general.accent }} />
                <p className="font-medium">{item.title ?? 'Documento'}</p>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm underline"
                  style={{ color: themeConfig.general.accent }}
                >
                  Abrir documento <ExternalLink size={14} />
                </a>
              </div>
            )}
            {item.title && item.type !== 'document' && (
              <p className="mt-3 text-center text-sm opacity-70">{item.title}</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
