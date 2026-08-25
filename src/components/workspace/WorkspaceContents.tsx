import { FileBarChart, Database, LayoutDashboard } from 'lucide-react';
import { PowerBIReport, PowerBIDataset, PowerBIDashboard } from '@/types/migration';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WorkspaceContentsProps {
  reports: PowerBIReport[];
  datasets: PowerBIDataset[];
  dashboards: PowerBIDashboard[];
}

const WorkspaceContents = ({ reports, datasets, dashboards }: WorkspaceContentsProps) => {
  const hasContent = reports.length > 0 || datasets.length > 0 || dashboards.length > 0;

  if (!hasContent) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
          <FileBarChart className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          This workspace is empty
        </p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="reports" className="w-full">
      <TabsList className="w-full justify-start bg-muted/50 p-1">
        <TabsTrigger value="reports" className="flex items-center gap-1.5">
          <FileBarChart className="w-3.5 h-3.5" />
          Reports ({reports.length})
        </TabsTrigger>
        <TabsTrigger value="datasets" className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5" />
          Datasets ({datasets.length})
        </TabsTrigger>
        <TabsTrigger value="dashboards" className="flex items-center gap-1.5">
          <LayoutDashboard className="w-3.5 h-3.5" />
          Dashboards ({dashboards.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="reports" className="mt-3">
        <div className="space-y-2">
          {reports.map((report) => (
            <div
              key={report.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
            >
              <FileBarChart className="w-4 h-4 text-powerbi shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{report.name}</p>
                <p className="text-xs text-muted-foreground">Created {report.createdDateTime}</p>
              </div>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="datasets" className="mt-3">
        <div className="space-y-2">
          {datasets.map((dataset) => (
            <div
              key={dataset.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
            >
              <Database className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{dataset.name}</p>
                <p className="text-xs text-muted-foreground">By {dataset.configuredBy}</p>
              </div>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="dashboards" className="mt-3">
        <div className="space-y-2">
          {dashboards.map((dashboard) => (
            <div
              key={dashboard.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
            >
              <LayoutDashboard className="w-4 h-4 text-success shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{dashboard.name}</p>
              </div>
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default WorkspaceContents;
