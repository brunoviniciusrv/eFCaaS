/**
 * Avatar de usuário — foto real ou ícone padrão de pessoa (sem avatares gerados).
 */
import React from 'react';
import { User } from 'lucide-react';
import { cn } from '../lib/utils';

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  className?: string;
  iconClassName?: string;
}

function hasRealPhoto(src?: string | null): boolean {
  if (!src || !src.trim()) return false;
  return !src.includes('dicebear.com');
}

export function UserAvatar({ src, name, className, iconClassName }: UserAvatarProps) {
  if (hasRealPhoto(src)) {
    return <img src={src!} alt={name ?? ''} className={className} />;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-slate-200 text-slate-500 overflow-hidden',
        className,
      )}
      aria-hidden={!name}
      title={name}
    >
      <User className={iconClassName ?? 'w-1/2 h-1/2'} />
    </span>
  );
}
