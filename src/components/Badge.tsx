import React from 'react';
import { Award, Flame, Sparkles, Check } from 'lucide-react';

interface BadgeProps {
  type?: 'Bestseller' | 'Popular' | 'New' | 'ISO Certified' | 'Standard' | 'CE Marked';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, className = '' }) => {
  if (!type) return null;

  const normalized = type.toLowerCase().replace(/[^a-z]/g, '');

  const getIcon = () => {
    switch (type) {
      case 'Bestseller':
        return <Flame size={12} strokeWidth={2.5} />;
      case 'New':
        return <Sparkles size={12} strokeWidth={2.5} />;
      case 'Popular':
        return <Award size={12} strokeWidth={2.5} />;
      default:
        return <Check size={12} strokeWidth={2.5} />;
    }
  };

  return (
    <span className={`badge badge-${normalized} ${className}`}>
      {getIcon()}
      {type}
    </span>
  );
};
