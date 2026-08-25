import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: ReactNode;
}

const StatsCard = ({ title, value, change, changeType = 'neutral', icon }: StatsCardProps) => {
  return (
    <div className="p-4 rounded-lg bg-card border border-border enterprise-shadow transition-all hover:enterprise-shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground mb-0.5">{title}</p>
          <p className="text-xl font-semibold text-foreground tracking-tight">{value}</p>
          
          {change && (
            <div className={cn(
              "flex items-center gap-1 mt-1.5 text-xs font-medium",
              changeType === 'positive' && "text-success",
              changeType === 'negative' && "text-destructive",
              changeType === 'neutral' && "text-muted-foreground"
            )}>
              {changeType === 'positive' && <TrendingUp className="w-3 h-3" />}
              {changeType === 'negative' && <TrendingDown className="w-3 h-3" />}
              <span>{change}</span>
            </div>
          )}
        </div>
        
        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <div className="w-4 h-4">{icon}</div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
