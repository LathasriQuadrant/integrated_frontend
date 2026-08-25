// import { ReactNode } from "react";
// import { cn } from "@/lib/utils";

// interface MetricCardProps {
//   label: string;
//   value: string | number;
//   icon?: ReactNode;
//   tone?: "default" | "success" | "warning" | "danger";
//   hint?: string;
//   /** 0-100: renders a thin fill bar under the value so counts read as
//    * relative magnitude, not just isolated numbers. Omit to hide the bar. */
//   fillPercent?: number;
// }

// const toneIconClasses: Record<NonNullable<MetricCardProps["tone"]>, string> = {
//   default: "bg-primary/10 text-primary",
//   success: "bg-success/10 text-success",
//   warning: "bg-warning/10 text-warning",
//   danger: "bg-destructive/10 text-destructive",
// };

// const toneBarClasses: Record<NonNullable<MetricCardProps["tone"]>, string> = {
//   default: "bg-primary",
//   success: "bg-success",
//   warning: "bg-warning",
//   danger: "bg-destructive",
// };

// const toneTopAccent: Record<NonNullable<MetricCardProps["tone"]>, string> = {
//   default: "before:bg-primary/70",
//   success: "before:bg-success/70",
//   warning: "before:bg-warning/70",
//   danger: "before:bg-destructive/70",
// };

// const MetricCard = ({ label, value, icon, tone = "default", hint, fillPercent }: MetricCardProps) => (
//   <div
//     className={cn(
//       "relative overflow-hidden p-4 rounded-xl bg-card border border-border enterprise-shadow transition-enterprise hover:enterprise-shadow-md",
//       "before:absolute before:inset-x-0 before:top-0 before:h-0.5",
//       toneTopAccent[tone],
//     )}
//   >
//     <div className="flex items-start justify-between">
//       <div className="flex-1 min-w-0">
//         <p className="text-xs font-medium text-muted-foreground mb-1 truncate">{label}</p>
//         <p className="text-2xl font-semibold text-foreground tracking-tight tabular-nums leading-none">{value}</p>
//         {hint && <p className="text-xs text-muted-foreground mt-1.5 truncate">{hint}</p>}
//       </div>
//       {icon && (
//         <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", toneIconClasses[tone])}>
//           <div className="w-4 h-4">{icon}</div>
//         </div>
//       )}
//     </div>
//     {typeof fillPercent === "number" && (
//       <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
//         <div
//           className={cn("h-full rounded-full transition-enterprise", toneBarClasses[tone])}
//           style={{ width: `${Math.max(0, Math.min(100, fillPercent))}%` }}
//         />
//       </div>
//     )}
//   </div>
// );

// export default MetricCard;
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import IconTile from "./IconTile";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
  hint?: string;
  /** 0-100: renders a thin fill bar under the value so counts read as
   * relative magnitude, not just isolated numbers. Omit to hide the bar. */
  fillPercent?: number;
}

const toneBarClasses: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
};

const toneTopAccent: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  default: "before:bg-primary/70",
  success: "before:bg-success/70",
  warning: "before:bg-warning/70",
  danger: "before:bg-destructive/70",
};

const MetricCard = ({ label, value, icon, tone = "default", hint, fillPercent }: MetricCardProps) => (
  <div
    className={cn(
      "relative overflow-hidden p-4 rounded-xl bg-card border border-border enterprise-shadow transition-enterprise hover:enterprise-shadow-md",
      "before:absolute before:inset-x-0 before:top-0 before:h-0.5",
      toneTopAccent[tone],
    )}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground mb-1 truncate">{label}</p>
        <p className="text-2xl font-semibold text-foreground tracking-tight tabular-nums leading-none">{value}</p>
        {hint && <p className="text-xs text-muted-foreground mt-1.5 truncate">{hint}</p>}
      </div>
      {icon && <IconTile icon={icon} tone={tone} />}
    </div>
    {typeof fillPercent === "number" && (
      <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-enterprise", toneBarClasses[tone])}
          style={{ width: `${Math.max(0, Math.min(100, fillPercent))}%` }}
        />
      </div>
    )}
  </div>
);

export default MetricCard;