// import { ReactNode, useState } from "react";
// import { ArrowUpRight } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
// } from "@/components/ui/dialog";
// import { cn } from "@/lib/utils";

// interface InsightCardProps {
//   /** Card headline, e.g. a KPI group name or a shared datasource name. */
//   title: string;
//   /** Short badge/meta text next to the title, e.g. "3 workbooks". */
//   meta?: string;
//   /** Chip list shown on the card (truncated) and in full in the dialog —
//    * e.g. the KPI names in a duplicate group, or the workbooks a shared
//    * datasource is used by. */
//   chips?: string[];
//   /** Longer free-text explanation (reason/rationale) shown in the dialog. */
//   detail?: string;
//   icon?: ReactNode;
//   tone?: "default" | "warning" | "success";
//   /** Of `chips`, which ones match a workbook name in the current result
//    * set — rendered as a jump-to-workbook button inside the dialog. */
//   onJumpToWorkbook?: (name: string) => void;
//   workbookNames?: Set<string>;
// }

// const toneClasses: Record<NonNullable<InsightCardProps["tone"]>, string> = {
//   default: "border-l-primary",
//   warning: "border-l-warning",
//   success: "border-l-success",
// };

// const InsightCard = ({
//   title,
//   meta,
//   chips = [],
//   detail,
//   icon,
//   tone = "default",
//   onJumpToWorkbook,
//   workbookNames,
// }: InsightCardProps) => {
//   const [open, setOpen] = useState(false);
//   const visibleChips = chips.slice(0, 3);
//   const remaining = chips.length - visibleChips.length;
//   const jumpableChips = chips.filter((c) => workbookNames?.has(c));

//   return (
//     <>
//       <button
//         type="button"
//         onClick={() => setOpen(true)}
//         className={cn(
//           "w-full text-left p-3 rounded-lg border border-border border-l-[3px] bg-card enterprise-shadow text-sm",
//           "hover:enterprise-shadow-md hover:border-primary/40 transition-enterprise cursor-pointer",
//           toneClasses[tone],
//         )}
//       >
//         <div className="flex items-start justify-between gap-2">
//           <p className="font-medium truncate flex-1 min-w-0">{title}</p>
//           <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
//         </div>
//         {meta && <p className="text-xs text-muted-foreground mt-0.5">{meta}</p>}
//         {visibleChips.length > 0 && (
//           <div className="flex flex-wrap gap-1 mt-2">
//             {visibleChips.map((c) => (
//               <span key={c} className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground truncate max-w-[9rem]">
//                 {c}
//               </span>
//             ))}
//             {remaining > 0 && (
//               <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">+{remaining} more</span>
//             )}
//           </div>
//         )}
//       </button>

//       <Dialog open={open} onOpenChange={setOpen}>
//         <DialogContent className="max-w-lg">
//           <DialogHeader>
//             <DialogTitle className="flex items-center gap-2">
//               {icon && <div className="w-4 h-4 text-muted-foreground">{icon}</div>}
//               {title}
//             </DialogTitle>
//             {meta && <DialogDescription>{meta}</DialogDescription>}
//           </DialogHeader>

//           {detail && <p className="text-sm text-muted-foreground leading-relaxed">{detail}</p>}

//           {chips.length > 0 && (
//             <div>
//               <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
//                 All items ({chips.length})
//               </p>
//               <div className="flex flex-wrap gap-1.5">
//                 {chips.map((c) => (
//                   <span key={c} className="text-xs px-2 py-1 rounded-md bg-muted">
//                     {c}
//                   </span>
//                 ))}
//               </div>
//             </div>
//           )}

//           {onJumpToWorkbook && jumpableChips.length > 0 && (
//             <div className="pt-2 border-t border-border flex flex-wrap gap-2">
//               {jumpableChips.map((name) => (
//                 <Button
//                   key={name}
//                   size="sm"
//                   variant="outline"
//                   onClick={() => {
//                     setOpen(false);
//                     onJumpToWorkbook(name);
//                   }}
//                 >
//                   View {name} <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
//                 </Button>
//               ))}
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// };

// export default InsightCard;

import { ReactNode, useState } from "react";
import { ArrowUpRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  /** Card headline, e.g. a KPI group name or a shared datasource name. */
  title: string;
  /** Short badge/meta text next to the title, e.g. "3 workbooks". */
  meta?: string;
  /** Chip list shown on the card (truncated) and in full in the dialog —
   * e.g. the KPI names in a duplicate group, or the workbooks a shared
   * datasource is used by. */
  chips?: string[];
  /** Longer free-text explanation (reason/rationale) shown in the dialog. */
  detail?: string;
  icon?: ReactNode;
  tone?: "default" | "warning" | "success";
  /** Of `chips`, which ones match a workbook name in the current result
   * set — rendered as a jump-to-workbook button inside the dialog. */
  onJumpToWorkbook?: (name: string) => void;
  workbookNames?: Set<string>;
  /** Which of `chips` the AI recommends keeping — rendered with a green
   * "Keep" badge instead of the default neutral chip styling. Only
   * meaningful for KPI duplicate/similar groups; omit for other card
   * types (shared datasources, unused assets, etc). */
  recommendedKeep?: string;
  /** Which of `chips` the AI recommends removing/consolidating — rendered
   * with a muted/struck "Remove" badge. Can be empty (e.g. a "similar"
   * group where nothing is recommended for removal) even when
   * `recommendedKeep` is set. */
  recommendedRemove?: string[];
  /** Why recommendedKeep/recommendedRemove were chosen — shown in the
   * dialog under its own heading, separate from `detail` (which explains
   * *why the group was formed*, not *what to do about it*). */
  recommendationRationale?: string;
}

const toneClasses: Record<NonNullable<InsightCardProps["tone"]>, string> = {
  default: "border-l-primary",
  warning: "border-l-warning",
  success: "border-l-success",
};

/** Small pill for a single chip, styled by its recommendation status. */
const RecommendationChip = ({
  label,
  status,
  size = "sm",
}: {
  label: string;
  status: "keep" | "remove" | "neutral";
  size?: "sm" | "md";
}) => {
  const sizeClasses = size === "sm" ? "text-[11px] px-1.5 py-0.5 max-w-[9rem]" : "text-xs px-2 py-1";
  if (status === "keep") {
    return (
      <span
        className={cn(
          "rounded truncate inline-flex items-center gap-1 bg-success/10 text-success font-medium ring-1 ring-inset ring-success/30",
          sizeClasses,
        )}
      >
        <Check className="w-3 h-3 shrink-0" />
        {label}
      </span>
    );
  }
  if (status === "remove") {
    return (
      <span
        className={cn(
          "rounded truncate inline-flex items-center gap-1 bg-muted text-muted-foreground line-through decoration-muted-foreground/50",
          sizeClasses,
        )}
      >
        <X className="w-3 h-3 shrink-0 no-underline" />
        {label}
      </span>
    );
  }
  return (
    <span className={cn("rounded truncate inline-block bg-muted text-muted-foreground", sizeClasses)}>{label}</span>
  );
};

const InsightCard = ({
  title,
  meta,
  chips = [],
  detail,
  icon,
  tone = "default",
  onJumpToWorkbook,
  workbookNames,
  recommendedKeep,
  recommendedRemove = [],
  recommendationRationale,
}: InsightCardProps) => {
  const [open, setOpen] = useState(false);
  const visibleChips = chips.slice(0, 3);
  const remaining = chips.length - visibleChips.length;
  const jumpableChips = chips.filter((c) => workbookNames?.has(c));
  const removeSet = new Set(recommendedRemove);

  const chipStatus = (c: string): "keep" | "remove" | "neutral" => {
    if (recommendedKeep && c === recommendedKeep) return "keep";
    if (removeSet.has(c)) return "remove";
    return "neutral";
  };

  const hasRecommendation = Boolean(recommendedKeep) || recommendedRemove.length > 0 || recommendationRationale;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full text-left p-3 rounded-lg border border-border border-l-[3px] bg-card enterprise-shadow text-sm",
          "hover:enterprise-shadow-md hover:border-primary/40 transition-enterprise cursor-pointer",
          toneClasses[tone],
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium truncate flex-1 min-w-0">{title}</p>
          <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        </div>
        {meta && <p className="text-xs text-muted-foreground mt-0.5">{meta}</p>}
        {visibleChips.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {visibleChips.map((c) =>
              hasRecommendation ? (
                <RecommendationChip key={c} label={c} status={chipStatus(c)} size="sm" />
              ) : (
                <span key={c} className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground truncate max-w-[9rem]">
                  {c}
                </span>
              ),
            )}
            {remaining > 0 && (
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">+{remaining} more</span>
            )}
          </div>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {icon && <div className="w-4 h-4 text-muted-foreground">{icon}</div>}
              {title}
            </DialogTitle>
            {meta && <DialogDescription>{meta}</DialogDescription>}
          </DialogHeader>

          {detail && <p className="text-sm text-muted-foreground leading-relaxed">{detail}</p>}

          {chips.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                All items ({chips.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {chips.map((c) =>
                  hasRecommendation ? (
                    <RecommendationChip key={c} label={c} status={chipStatus(c)} size="md" />
                  ) : (
                    <span key={c} className="text-xs px-2 py-1 rounded-md bg-muted">
                      {c}
                    </span>
                  ),
                )}
              </div>
            </div>
          )}

          {hasRecommendation && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Recommendation
              </p>
              {recommendedKeep ? (
                <p className="text-sm mb-1">
                  <span className="inline-flex items-center gap-1 text-success font-medium">
                    <Check className="w-3.5 h-3.5" /> Keep "{recommendedKeep}"
                  </span>
                  {recommendedRemove.length > 0 && (
                    <span className="text-muted-foreground">
                      {" "}
                      · remove {recommendedRemove.map((r) => `"${r}"`).join(", ")}
                    </span>
                  )}
                </p>
              ) : (
                recommendedRemove.length === 0 && (
                  <p className="text-sm text-muted-foreground mb-1">
                    Related, but distinct enough to keep both — no removal recommended.
                  </p>
                )
              )}
              {recommendationRationale && (
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">{recommendationRationale}</p>
              )}
            </div>
          )}

          {onJumpToWorkbook && jumpableChips.length > 0 && (
            <div className="pt-2 border-t border-border flex flex-wrap gap-2">
              {jumpableChips.map((name) => (
                <Button
                  key={name}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    onJumpToWorkbook(name);
                  }}
                >
                  View {name} <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InsightCard;
