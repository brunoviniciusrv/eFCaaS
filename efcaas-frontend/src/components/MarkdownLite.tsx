import Markdown from 'react-markdown';
import { cn } from '../lib/utils';
import styles from './MarkdownLite.module.css';

interface MarkdownLiteProps {
  children: string;
  className?: string;
}

export function MarkdownLite({ children, className }: MarkdownLiteProps) {
  const text = children?.trim();
  if (!text) return null;

  return (
    <div className={cn(styles.prose, className)}>
      <Markdown>{text}</Markdown>
    </div>
  );
}
