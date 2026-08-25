import { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SourceCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  color: string;
  onClick: () => void;
  sourceId?: string;
}

const SourceCard = ({ title, description, icon, color, onClick, sourceId }: SourceCardProps) => {
  // Map source IDs to accent classes
  const getAccentClass = () => {
    switch (sourceId) {
      case 'tableau': return 'border-l-tableau';
      case 'microstrategy': return 'border-l-microstrategy';
      case 'sapbo': return 'border-l-sapbo';
      case 'cognos': return 'border-l-cognos';
      default: return '';
    }
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-full p-5 rounded-xl bg-card border border-border enterprise-shadow",
        "hover:enterprise-shadow-hover transition-all duration-150",
        "text-left overflow-hidden border-l-4",
        getAccentClass()
      )}
    >
      {/* Header: Icon + Title in single line */}
      <div className="flex items-center gap-3 mb-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
        <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
      </div>
      
      {/* Description */}
      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed pl-[52px]">{description}</p>
      
      {/* Hover arrow indicator */}
      <div className="absolute right-4 top-5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0 -translate-x-1">
        <ArrowRight className="w-5 h-5 text-primary" />
      </div>
    </button>
  );
};

export default SourceCard;
