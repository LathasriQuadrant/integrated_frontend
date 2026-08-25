import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import IconTile from "./IconTile";

export interface StatStripItem {
  label: string;
  value: string | number;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "muted";
  /** 0-100: renders a thin fill bar under the value so counts read as
   * relative magnitude, not just isolated numbers. Omit to hide the bar. */
  fillPercent?: number;
}

const toneBarClasses: Record<NonNullable<StatStripItem["tone"]>, string> = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  muted: "bg-muted-foreground",
};

interface StatStripProps {
  items: StatStripItem[];
  /** Grid columns at the sm breakpoint and above; stacks 2-up below it. */
  smCols?: 2 | 3 | 4 | 5;
  className?: string;
}

const smColsClass: Record<NonNullable<StatStripProps["smCols"]>, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  5: "sm:grid-cols-5",
};

/**
 * A single bordered strip of stats separated by hairlines — used instead
 * of one bordered/shadowed card per metric, so a row of related counts
 * reads as one unit rather than multiplying boxes on the page. The 1px
 * "divider" is the card's own border color showing through a 1px grid
 * gap, so it holds together at any column count or wrap point.
 */
const StatStrip = ({ items, smCols = 4, className }: StatStripProps) => (
  <div className={cn("rounded-xl border border-border bg-border overflow-hidden enterprise-shadow", className)}>
    <div className={cn("grid grid-cols-2 gap-px", smColsClass[smCols])}>
      {items.map((item) => (
        <div key={item.label} className="bg-card p-4 flex items-center gap-3 min-w-0">
          {item.icon && <IconTile icon={item.icon} tone={item.tone ?? "default"} />}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground truncate">{item.label}</p>
            <p className="text-xl font-semibold text-foreground tracking-tight tabular-nums leading-tight">
              {item.value}
            </p>
            {typeof item.fillPercent === "number" && (
              <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-enterprise", toneBarClasses[item.tone ?? "default"])}
                  style={{ width: `${Math.max(0, Math.min(100, item.fillPercent))}%` }}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default StatStrip;