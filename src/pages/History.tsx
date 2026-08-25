import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/layout/AppLayout";

// 1. Update the interface to match your FastAPI backend schema
interface MigrationJob {
  Id: number;
  UserId: string;
  ReportName: string;
  ReportPath: string | null;
  SourceReportId: string | null;
  SourcePlatform: string;
  TargetPlatform: string;
  MigrationStatus: string;
  ErrorMessage: string | null;
  StartedAt: string;
  CompletedAt: string | null;
  DurationMinutes: number | null;
  SheetsCount: number;
  DashboardsCount: number;
  WorkbooksCount: number;
}

const History = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // 2. Add State for the API data
  const [history, setHistory] = useState<MigrationJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // FIXED VARIABLE: Change this later when user auth is ready!
  const CURRENT_USER_EMAIL = sessionStorage.getItem("azure_user_email") || "dummy@dummy.com";

  // 3. Fetch data from your live Azure Backend
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const userId = encodeURIComponent(CURRENT_USER_EMAIL);
        const response = await fetch(
          `https://databasemanagement-e0e0d7bqhdg3gec7.eastus-01.azurewebsites.net/jobs/user/${userId}`,
        );

        if (response.ok) {
          const data = await response.json();
          // Sort so newest migrations appear at the top
          const sortedData = data.sort(
            (a: MigrationJob, b: MigrationJob) => new Date(b.StartedAt).getTime() - new Date(a.StartedAt).getTime(),
          );
          setHistory(sortedData);
        } else {
          console.error("Failed to fetch history");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // 4. Update filtering to use the real API data and handle potential nulls
  const filteredHistory = history.filter((item) => {
    const searchLower = searchQuery.toLowerCase();
    const pathLower = item.ReportPath ? item.ReportPath.toLowerCase() : "";

    const matchesSearch = item.ReportName.toLowerCase().includes(searchLower) || pathLower.includes(searchLower);

    // API returns 'Completed', 'Running', etc. (capitalized), so we lowercase both to safely compare
    const matchesFilter = !filterStatus || item.MigrationStatus.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">
            Dashboard
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Migration History</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Migration History</h1>
              <p className="text-sm text-muted-foreground">View and manage all your report migrations</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4 mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by report name or path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filterStatus || ""}
              onChange={(e) => setFilterStatus(e.target.value || null)}
              className="h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="running">Running</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* History table */}
        <div className="bg-card rounded-xl border border-border enterprise-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Report
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Source
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Started
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span>Loading migration history...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      No migrations found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item) => {
                    // Safe lowercase status for your CSS classes
                    const statusStr = item.MigrationStatus.toLowerCase();

                    // Fallback duration logic if the database didn't compute it
                    const duration =
                      item.DurationMinutes !== null
                        ? item.DurationMinutes
                        : item.CompletedAt
                          ? Math.round(
                              (new Date(item.CompletedAt).getTime() - new Date(item.StartedAt).getTime()) / 60000,
                            )
                          : null;

                    return (
                      <tr key={item.Id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-foreground">{item.ReportName}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-xs">
                              {item.ReportPath || "Root folder"}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-muted-foreground">{item.SourcePlatform}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                              ${statusStr === "completed" ? "status-completed" : ""}
                              ${statusStr === "running" ? "status-running pulse-running" : ""}
                              ${statusStr === "failed" ? "status-failed" : ""}
                              ${statusStr === "pending" ? "bg-muted text-muted-foreground" : ""}
                            `}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                statusStr === "completed"
                                  ? "bg-success"
                                  : statusStr === "running"
                                    ? "bg-info"
                                    : statusStr === "failed"
                                      ? "bg-destructive"
                                      : "bg-muted-foreground"
                              }`}
                            />
                            {item.MigrationStatus}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">{formatDate(item.StartedAt)}</td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {duration !== null ? `${duration} min` : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default History;
