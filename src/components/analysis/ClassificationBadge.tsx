import { cn } from "@/lib/utils";

interface ClassificationBadgeProps {
  value?: string;
  className?: string;
}

const toneForClassification = (value: string) => {
  const v = value.toLowerCase();
  if (v === "high") return "bg-destructive/10 text-destructive border-destructive/20";
  if (v === "medium") return "bg-warning/10 text-warning border-warning/20";
  if (v === "low") return "bg-success/10 text-success border-success/20";
  return "bg-muted text-muted-foreground border-border";
};

const ClassificationBadge = ({ value, className }: ClassificationBadgeProps) => {
  if (!value) {
    return <span className="text-xs text-muted-foreground italic">Not available</span>;
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        toneForClassification(value),
        className,
      )}
    >
      {value}
    </span>
  );
};

export default ClassificationBadge;  
