import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Download, Share2, ChevronRight, Calendar, Server, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/AppLayout';

const ReportViewer = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All Regions');

  const filters = ['All Regions', 'North America', 'Europe', 'Asia Pacific'];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <button
            onClick={() => navigate('/')}
            className="hover:text-foreground transition-colors"
          >
            Dashboard
          </button>
          <ChevronRight className="w-4 h-4" />
          <button
            onClick={() => navigate('/history')}
            className="hover:text-foreground transition-colors"
          >
            Migration History
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Report Viewer</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">Regional Performance</h1>
                <span className="px-2 py-0.5 bg-success/10 text-success text-xs font-medium rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Migrated
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Power BI Report • ID: {reportId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="azure" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Power BI
            </Button>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Server className="w-4 h-4" />
              <span className="text-xs font-medium">Source System</span>
            </div>
            <p className="font-medium text-foreground">Tableau Server</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-medium">Migration Date</span>
            </div>
            <p className="font-medium text-foreground">Dec 15, 2024 at 2:30 PM</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-medium">Validation Status</span>
            </div>
            <p className="font-medium text-success">Passed All Checks</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-card rounded-xl border border-border p-4 mb-4 flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">Filter by:</span>
          <div className="flex gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  activeFilter === filter
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Embedded Power BI Report (Simulated) */}
        <div className="bg-card rounded-xl border border-border enterprise-shadow overflow-hidden">
          <div className="bg-muted/50 p-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-powerbi flex items-center justify-center">
                <svg className="w-5 h-5 text-powerbi-foreground" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 2H4v18h6V2zm8 4h-6v14h6V6z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-foreground">Power BI Embedded</span>
            </div>
            <span className="text-xs text-muted-foreground">Interactive Mode</span>
          </div>

          {/* Simulated Power BI Dashboard */}
          <div className="p-6 bg-muted/20 min-h-[500px]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* KPI Cards */}
              <div className="bg-card rounded-lg border border-border p-4 enterprise-shadow">
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-foreground">$2.4M</p>
                <p className="text-sm text-success mt-1">↑ 12.5% vs last period</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4 enterprise-shadow">
                <p className="text-sm text-muted-foreground mb-1">Active Customers</p>
                <p className="text-3xl font-bold text-foreground">8,234</p>
                <p className="text-sm text-success mt-1">↑ 8.2% vs last period</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4 enterprise-shadow">
                <p className="text-sm text-muted-foreground mb-1">Avg. Order Value</p>
                <p className="text-3xl font-bold text-foreground">$291</p>
                <p className="text-sm text-destructive mt-1">↓ 2.1% vs last period</p>
              </div>
            </div>

            {/* Charts (Simulated) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card rounded-lg border border-border p-4 enterprise-shadow">
                <h4 className="font-medium text-foreground mb-4">Revenue by Region</h4>
                <div className="space-y-3">
                  {[
                    { region: 'North America', value: 45, color: 'bg-primary' },
                    { region: 'Europe', value: 30, color: 'bg-info' },
                    { region: 'Asia Pacific', value: 20, color: 'bg-success' },
                    { region: 'Other', value: 5, color: 'bg-muted-foreground' },
                  ].map((item) => (
                    <div key={item.region}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{item.region}</span>
                        <span className="font-medium text-foreground">{item.value}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-4 enterprise-shadow">
                <h4 className="font-medium text-foreground mb-4">Monthly Trend</h4>
                <div className="h-48 flex items-end justify-between gap-2">
                  {[65, 80, 55, 90, 75, 85, 95, 70, 88, 72, 92, 98].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary/80 rounded-t transition-all duration-300 hover:bg-primary"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Jan</span>
                  <span>Jun</span>
                  <span>Dec</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ReportViewer;
