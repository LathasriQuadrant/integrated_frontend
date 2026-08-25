import { cn } from '@/lib/utils';

interface IconProps {
  className?: string;
}

export const TableauIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
    <path d="M11.5 1v3.5H8V6h3.5v3.5h1V6H16V4.5h-3.5V1zM5 7v3H2v1.5h3V15h1.5v-3.5H10V10H6.5V7zM18 7v3h-3.5v1.5H18V15h1.5v-3.5H23V10h-3.5V7zM11.5 13v3.5H8V18h3.5v3.5h1V18H16v-1.5h-3.5V13zM5 19v2h1.5v-2zM17.5 19v2H19v-2zM11.5 19v2h1v-2z"/>
  </svg>
);

export const MicroStrategyIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    <path d="M12 22V12M2 7v10M22 7v10" fill="none" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

export const SAPBOIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
    <path d="M10 6.5h4M6.5 10v4M17.5 10v4M10 17.5h4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
  </svg>
);

export const CognosIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 2v4M12 18v4M22 12h-4M6 12H2M19.07 4.93l-2.83 2.83M7.76 16.24l-2.83 2.83M19.07 19.07l-2.83-2.83M7.76 7.76L4.93 4.93" stroke="currentColor" strokeWidth="1.5" fill="none"/>
  </svg>
 );
 
 export const PowerBIIcon = ({ className }: IconProps) => (
   <svg viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
     <rect x="4" y="10" width="4" height="10" rx="1" fill="#F2C811"/>
     <rect x="10" y="6" width="4" height="14" rx="1" fill="#F2C811"/>
     <rect x="16" y="2" width="4" height="18" rx="1" fill="#F2C811"/>
   </svg>
 );
