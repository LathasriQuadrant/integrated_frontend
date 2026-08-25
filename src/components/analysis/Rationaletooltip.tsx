import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface RationaleTooltipProps {
  text: string;
}

/**
 * Small info-icon affordance that reveals a full scoring rationale in a
 * tooltip on hover/focus. Used so a summary card can show a compact
 * one-line teaser instead of the full paragraph competing for space with
 * the score and badge.
 */
const RationaleTooltip = ({ text }: RationaleTooltipProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        className="text-muted-foreground hover:text-primary transition-enterprise shrink-0"
        aria-label="Why this score"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
    </TooltipTrigger>
    <TooltipContent side="top" align="start" className="max-w-xs text-xs leading-relaxed">
      {text}
    </TooltipContent>
  </Tooltip>
);

export default RationaleTooltip;