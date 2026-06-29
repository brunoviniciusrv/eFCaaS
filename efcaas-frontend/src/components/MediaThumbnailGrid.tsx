import React, { useState } from 'react';
import { FileText, Play, Volume2, Trash2 } from 'lucide-react';
import { ThemeConfig } from '../types';
import { MediaLightbox, MediaItem } from './MediaLightbox';

interface MediaThumbnailGridProps {
  items: MediaItem[];
  themeConfig: ThemeConfig;
  canEdit?: boolean;
  onRemove?: (anexoId: string) => void;
  className?: string;
}

export const MediaThumbnailGrid: React.FC<MediaThumbnailGridProps> = ({
  items,
  themeConfig,
  canEdit = false,
  onRemove,
  className = '',
}) => {
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);

  if (items.length === 0) return null;

  return (
    <>
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 ${className}`}>
        {items.map((m, i) => (
          <div
            key={m.id ?? i}
            className="relative group aspect-square rounded-lg overflow-hidden border cursor-pointer"
            style={{ borderColor: themeConfig.general.border, backgroundColor: themeConfig.general.mutedBackground }}
          >
            <button
              type="button"
              className="w-full h-full flex items-center justify-center"
              onClick={() => setLightboxItem(m)}
            >
              {m.type === 'image' && (
                <img src={m.url} alt={m.title ?? ''} className="w-full h-full object-cover" loading="lazy" />
              )}
              {m.type === 'video' && (
                <div className="relative w-full h-full">
                  <video src={m.url} className="w-full h-full object-cover" muted />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play size={28} className="text-white" fill="white" />
                  </div>
                </div>
              )}
              {m.type === 'audio' && (
                <Volume2 size={32} style={{ color: themeConfig.icons?.default ?? themeConfig.general.accent }} />
              )}
              {m.type === 'document' && (
                <FileText size={32} style={{ color: themeConfig.icons?.muted ?? themeConfig.general.accent }} />
              )}
            </button>
            {canEdit && m.id && onRemove && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(m.id!); }}
                className="absolute top-1 right-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: themeConfig.status.error, color: '#fff' }}
                aria-label="Remover"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      <MediaLightbox item={lightboxItem} onClose={() => setLightboxItem(null)} themeConfig={themeConfig} />
    </>
  );
};
