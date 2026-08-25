import { cloneElement, isValidElement, ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface IconTileProps {
  icon: ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "muted";
  size?: "sm" | "md";
  className?: string;
}

const toneClasses: Record<NonNullable<IconTileProps["tone"]>, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

const sizeClasses: Record<NonNullable<IconTileProps["size"]>, { tile: string; icon: string }> = {
  sm: { tile: "w-7 h-7 rounded-md", icon: "w-3.5 h-3.5" },
  md: { tile: "w-9 h-9 rounded-lg", icon: "w-4 h-4" },
};

/**
 * Fixed-size icon swatch. Lucide icons carry their own intrinsic 24px
 * size and don't shrink to fit a wrapping div just because the div has a
 * size class — that's what was causing icons to overflow their
 * background tile and look "unaligned". This clones the icon and forces
 * the size directly onto it so the glyph always matches its tile.
 */
const IconTile = ({ icon, tone = "default", size = "md", className }: IconTileProps) => {
  const { tile, icon: iconSize } = sizeClasses[size];
  const sizedIcon = isValidElement(icon)
    ? cloneElement(icon as ReactElement<{ className?: string }>, {
        className: cn(iconSize, (icon as ReactElement<{ className?: string }>).props?.className),
      })
    : icon;

  return (
    <div className={cn("flex items-center justify-center shrink-0", tile, toneClasses[tone], className)}>
      {sizedIcon}
    </div>
  );
};

export default IconTile;