import { TrendingUp, TrendingDown } from "lucide-react";
import { ViewCountEntry } from "@/types/analysis";

interface ViewActivityListProps {
  viewCounts: ViewCountEntry[];
}

/** The Tableau usage discovery call (get_workbook_views with
 * includeUsageStatistics=true) only returns a cumulative totalViewCount
 * per view — there's no last-accessed timestamp available, so we rank by
 * frequency (most/least viewed) and deliberately don't claim a "most
 * recently used" ranking, which would have to be invented. */
const ViewActivityList = ({ viewCounts }: ViewActivityListProps) => {
  const named = viewCounts.filter((v) => v.view_name);
  if (named.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No view-level usage data available</p>;
  }

  const sorted = [...named].sort((a, b) => (b.total_views ?? 0) - (a.total_views ?? 0));
  const max = Math.max(1, sorted[0]?.total_views ?? 1);
  const topViewed = sorted.slice(0, 3);
  const leastViewed = sorted.filter((v) => v.total_views === 0).length >= 1
    ? sorted.filter((v) => v.total_views === 0).slice(0, 3)
    : sorted.slice(-3).reverse();

  const Row = ({ v }: { v: ViewCountEntry }) => (
    <div key={v.view_id} className="flex items-center gap-3">
      <span className="text-sm truncate flex-1 min-w-0">{v.view_name}</span>
      <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.max(2, ((v.total_views ?? 0) / max) * 100)}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums w-10 text-right shrink-0">
        {v.total_views ?? 0}
      </span>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-success" /> Most Viewed
        </p>
        <div className="space-y-2">
          {topViewed.map((v) => <Row key={v.view_id} v={v} />)}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
          <TrendingDown className="w-3.5 h-3.5 text-muted-foreground" /> Least Viewed
        </p>
        <div className="space-y-2">
          {leastViewed.map((v) => <Row key={v.view_id} v={v} />)}
        </div>
      </div>
    </div>
  );
};

export default ViewActivityList;
