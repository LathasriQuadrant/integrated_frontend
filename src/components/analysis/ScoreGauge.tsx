import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  value: number; // 0-100
  classification?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** Hide the centered number — useful at very small sizes (e.g. inline in a table row) */
  showValue?: boolean;
}

const colorForClassification = (value?: string): string => {
  const v = (value || "").toLowerCase();
  if (v === "high") return "hsl(var(--destructive))";
  if (v === "medium") return "hsl(var(--warning))";
  if (v === "low") return "hsl(var(--success))";
  return "hsl(var(--primary))";
};

/** Circular progress ring used to make score-style metrics (complexity,
 * usage/popularity) scannable at a glance instead of a bare number. */
const ScoreGauge = ({
  value,
  classification,
  size = 64,
  strokeWidth = 6,
  className,
  showValue = true,
}: ScoreGaugeProps) => {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const color = colorForClassification(classification);

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      {showValue && size >= 32 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-semibold tabular-nums"
            style={{ color, fontSize: Math.max(9, size * 0.26) }}
          >
            {Math.round(clamped)}
          </span>
        </div>
      )}
    </div>
  );
};

export default ScoreGauge;
