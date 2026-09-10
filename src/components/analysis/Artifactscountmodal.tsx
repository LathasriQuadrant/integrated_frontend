import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { WorkbookBundle } from "@/types/analysis";
import {
  Database,
  Table2,
  Link2,
  Gauge,
  LayoutGrid,
  Calculator,
  ListFilter,
  BarChart3,
} from "lucide-react";

interface ArtifactsCountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workbook: WorkbookBundle | null;
  workbookName?: string;
}

const ArtifactsCountModal = ({
  open,
  onOpenChange,
  workbook,
  workbookName,
}: ArtifactsCountModalProps) => {
  if (!workbook) return null;

  // Extract counts from workbook data
  const dashboardCount = workbook.reports.dashboards?.length ?? 0;
  const worksheetCount = workbook.reports.worksheets?.length ?? 0;
  const orphanedCount = workbook.reports.worksheets?.filter(
    (ws) => !workbook.components.dashboards?.some((d) =>
      d.worksheets?.includes(ws.name)
    )
  ).length ?? 0;
  const inDashboardCount = worksheetCount - orphanedCount;

  const datasourceCount = workbook.data_model.datasources?.length ?? 0;
  const tableCount = workbook.data_model.tables?.length ?? 0;
  const relationshipCount = workbook.data_model.relationships?.length ?? 0;

  const dimensionCount = workbook.fields.dimensions?.length ?? 0;
  const measureCount = workbook.fields.measures?.length ?? 0;
  const calculatedFieldCount = workbook.fields.calculated_fields?.length ?? 0;
  const kpiCount = workbook.kpis?.length ?? 0;

  // Count unique visual types
  const visualTypes = new Set<string>();
  workbook.components.dashboards?.forEach((dashboard: any) => {
    dashboard.worksheets?.forEach((ws: string) => {
      const visuals = workbook.components.worksheets?.find(
        (w: any) => w.name === ws
      );
      if (visuals?.mark_type) {
        visualTypes.add(visuals.mark_type);
      }
    });
  });
  const uniqueVisualTypes = visualTypes.size;
  const totalVisuals = workbook.components.dashboards?.reduce(
    (sum: number, d: any) => sum + (d.worksheets?.length ?? 0),
    0
  ) ?? 0;
  const filterCount = workbook.components.filters?.length ?? 0;

  // Metric card component
  const MetricRow = ({
    label,
    value,
    icon: Icon,
  }: {
    label: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <div className="flex items-center justify-between py-2.5 px-3 hover:bg-muted/50 rounded-md transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
      </div>
      <span className="text-lg font-semibold text-foreground tabular-nums">
        {value}
      </span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Workbook Artifacts Summary</DialogTitle>
          <DialogDescription className="pt-2">
            {workbookName || "Manufacturing Analysis"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Reports Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <LayoutGrid className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Reports</h3>
            </div>
            <div className="space-y-1 pl-6">
              <MetricRow label="Dashboards" value={dashboardCount} icon={LayoutGrid} />
              <MetricRow label="Worksheets Total" value={worksheetCount} icon={Table2} />
              <MetricRow label="  In Dashboard" value={inDashboardCount} icon={Table2} />
              <MetricRow label="  Orphaned" value={orphanedCount} icon={Table2} />
            </div>
          </div>

          {/* Data Model Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Data Model</h3>
            </div>
            <div className="space-y-1 pl-6">
              <MetricRow label="Datasources" value={datasourceCount} icon={Database} />
              <MetricRow label="Tables" value={tableCount} icon={Table2} />
              <MetricRow label="Relationships" value={relationshipCount} icon={Link2} />
            </div>
          </div>

          {/* Fields & Measures Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Fields & Measures</h3>
            </div>
            <div className="space-y-1 pl-6">
              <MetricRow label="Dimensions" value={dimensionCount} icon={Gauge} />
              <MetricRow label="Measures" value={measureCount} icon={Calculator} />
              <MetricRow label="Calculated Fields" value={calculatedFieldCount} icon={Calculator} />
              <MetricRow label="KPIs" value={kpiCount} icon={Gauge} />
            </div>
          </div>

          {/* Visuals Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Visuals</h3>
            </div>
            <div className="space-y-1 pl-6">
              <MetricRow label="Visual Types Used" value={uniqueVisualTypes} icon={BarChart3} />
              <MetricRow label="Total Visuals" value={totalVisuals} icon={BarChart3} />
              <MetricRow label="Filters Applied" value={filterCount} icon={ListFilter} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ArtifactsCountModal;
