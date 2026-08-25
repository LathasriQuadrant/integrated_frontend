import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TableauIcon, MicroStrategyIcon, SAPBOIcon, CognosIcon } from "@/components/icons/SourceIcons";
import {
  ArrowRight,
  BarChart3,
  FileStack,
  Shield,
  Zap,
  CheckCircle2,
  Database,
  Lock,
  Users,
  FileCheck,
  CloudUpload,
  Search,
  Settings,
  Play,
} from "lucide-react";

const migrationSources = [
  {
    id: "tableau",
    name: "Tableau",
    target: "Power BI",
    description: "Migrate workbooks, dashboards, and data sources from Tableau Server or Tableau Online",
    icon: <TableauIcon className="w-6 h-6" />,
    color: "#E97627",
  },
  {
    id: "microstrategy",
    name: "MicroStrategy",
    target: "Power BI",
    description: "Convert MicroStrategy reports, dossiers, and cubes to Power BI semantic models",
    icon: <MicroStrategyIcon className="w-6 h-6" />,
    color: "#CC2131",
  },
  {
    id: "sapbo",
    name: "SAP BusinessObjects",
    target: "Power BI",
    description: "Transform SAP BO universes, Web Intelligence reports, and Crystal Reports",
    icon: <SAPBOIcon className="w-6 h-6" />,
    color: "#0FAAFF",
  },
  {
    id: "cognos",
    name: "IBM Cognos",
    target: "Power BI",
    description: "Migrate IBM Cognos Analytics reports, dashboards, and data modules",
    icon: <CognosIcon className="w-6 h-6" />,
    color: "#054ADA",
  },
];

const processSteps = [
  {
    step: 1,
    title: "Connect Source",
    description: "Authenticate with your legacy BI platform",
    icon: <Settings className="w-5 h-5" />,
  },
  {
    step: 2,
    title: "Analyze Metadata",
    description: "Scan and map data models automatically",
    icon: <Search className="w-5 h-5" />,
  },
  {
    step: 3,
    title: "Automated Conversion",
    description: "Transform reports via conversion pipeline",
    icon: <Zap className="w-5 h-5" />,
  },
  {
    step: 4,
    title: "Publish to Power BI",
    description: "Deploy to your Power BI workspace",
    icon: <CloudUpload className="w-5 h-5" />,
  },
];

const capabilities = [
  {
    title: "Automated Pipelines",
    description: "End-to-end migration with zero manual intervention",
    icon: <Zap className="w-5 h-5" />,
  },
  {
    title: "Metadata Conversion",
    description: "Preserve data models, relationships, and calculations",
    icon: <Database className="w-5 h-5" />,
  },
  {
    title: "Security & Governance",
    description: "Enterprise-grade security with audit logging",
    icon: <Shield className="w-5 h-5" />,
  },
  {
    title: "Incremental Validation",
    description: "Step-by-step validation at each migration phase",
    icon: <FileCheck className="w-5 h-5" />,
  },
  {
    title: "Workspace Deployment",
    description: "Direct publish to Power BI service workspaces",
    icon: <CloudUpload className="w-5 h-5" />,
  },
  {
    title: "Role-Based Access",
    description: "Granular permissions for teams and projects",
    icon: <Users className="w-5 h-5" />,
  },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/frame-logo-color.png" alt="FRAMe" className="h-6 w-auto" />
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#sources" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Migration Services
              </a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </a>
              <a href="#security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Security
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Docs
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button size="sm" onClick={() => navigate("/login")}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-xl">
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-tight mb-6">
                Automated BI Migration to Microsoft Power BI
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Migrate dashboards, reports, and datasets from legacy BI platforms with accuracy, speed, and enterprise
                security. No manual conversion. No data loss.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={() => navigate("/login")}>
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Animated Migration Visual */}
            <div className="hidden lg:block relative">
              <div className="relative w-full h-80">
                {/* Source platforms floating cards */}
                <div className="absolute left-0 top-4 ">
                  <div className="bg-card border border-border rounded-lg p-3 shadow-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-[#E97627]/10 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-[#E97627]" />
                    </div>
                    <span className="text-sm font-medium">Tableau</span>
                  </div>
                </div>

                <div className="absolute left-4 top-24 ">
                  <div className="bg-card border border-border rounded-lg p-3 shadow-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-[#CC2131]/10 flex items-center justify-center">
                      <FileStack className="w-4 h-4 text-[#CC2131]" />
                    </div>
                    <span className="text-sm font-medium">MicroStrategy</span>
                  </div>
                </div>

                <div className="absolute left-0 top-44">
                  <div className="bg-card border border-border rounded-lg p-3 shadow-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-[#0FAAFF]/10 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-[#0FAAFF]" />
                    </div>
                    <span className="text-sm font-medium">SAP BO</span>
                  </div>
                </div>

                <div className="absolute left-8 bottom-4 ">
                  <div className="bg-card border border-border rounded-lg p-3 shadow-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-[#054ADA]/10 flex items-center justify-center">
                      <FileStack className="w-4 h-4 text-[#054ADA]" />
                    </div>
                    <span className="text-sm font-medium">Cognos</span>
                  </div>
                </div>

                {/* Animated flow lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 320">
                  <defs>
                    <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.2" />
                      <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 150 30 Q 250 30 280 100"
                    fill="none"
                    stroke="url(#flowGradient)"
                    strokeWidth="2"
                    strokeDasharray="8 4"
                    className="animate-[dash_2s_linear_infinite]"
                  />
                  <path
                    d="M 160 90 Q 240 90 280 120"
                    fill="none"
                    stroke="url(#flowGradient)"
                    strokeWidth="2"
                    strokeDasharray="8 4"
                    className="animate-[dash_2s_linear_infinite_0.3s]"
                  />
                  <path
                    d="M 140 170 Q 220 170 280 150"
                    fill="none"
                    stroke="url(#flowGradient)"
                    strokeWidth="2"
                    strokeDasharray="8 4"
                    className="animate-[dash_2s_linear_infinite_0.6s]"
                  />
                  <path
                    d="M 150 250 Q 230 250 280 180"
                    fill="none"
                    stroke="url(#flowGradient)"
                    strokeWidth="2"
                    strokeDasharray="8 4"
                    className="animate-[dash_2s_linear_infinite_0.9s]"
                  />
                </svg>

                {/* Power BI destination */}
                <div className="absolute right-4 top-24 ">
                  <div className="bg-card border border-border rounded-lg p-4 shadow-xl flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none">
                      <rect x="3" y="10" width="4" height="10" rx="1" fill="#F2C811" />
                      <rect x="10" y="6" width="4" height="14" rx="1" fill="#F2C811" />
                      <rect x="17" y="2" width="4" height="18" rx="1" fill="#F2C811" />
                    </svg>
                    <span className="text-foreground font-semibold">Power BI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Architecture visual */}
        </div>
      </section>

      {/* Migration Sources Section */}
      <section id="sources" className="py-20 bg-muted/70">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Supported Migration Sources</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Migrate from the most popular enterprise BI platforms with full metadata and data model preservation
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {migrationSources.map((source) => (
              <div
                key={source.id}
                className="group bg-card rounded-xl border border-border p-6 enterprise-shadow transition-all hover:enterprise-shadow-hover border-l-[4px]"
                style={{ borderLeftColor: source.color }}
              >
                <div className="flex items-start gap-5">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${source.color}12`, color: source.color }}
                  >
                    {source.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {source.name} → {source.target}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{source.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A streamlined four-step process from source connection to Power BI deployment
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {processSteps.map((step, index) => (
              <div key={step.step} className="relative">
                {/* Connector line */}
                {index < processSteps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[calc(50%+40px)] w-[calc(100%-40px)] h-px bg-border" />
                )}

                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 relative">
                    <div className="text-primary">{step.icon}</div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-20 bg-muted/70">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Platform Capabilities</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Enterprise-grade features designed for reliable, secure BI migrations at scale
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((capability) => (
              <div key={capability.title} className="bg-card rounded-xl border border-border p-6 enterprise-shadow">
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                  {capability.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{capability.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{capability.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Trust Section */}
      <section id="security" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4">Enterprise Security & Governance</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Built with enterprise security requirements in mind. Your data remains protected throughout the
                migration process with comprehensive audit trails and access controls.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Azure AD Authentication</h4>
                    <p className="text-sm text-muted-foreground">
                      Single sign-on with your existing Azure Active Directory
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Role-Based Access Control</h4>
                    <p className="text-sm text-muted-foreground">
                      Granular permissions for administrators, analysts, and viewers
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Comprehensive Audit Logs</h4>
                    <p className="text-sm text-muted-foreground">
                      Complete visibility into all migration activities and changes
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-8 enterprise-shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">Security Posture</h3>
                  <p className="text-sm text-muted-foreground">Enterprise-ready compliance</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  "SOC 2 Type II aligned controls",
                  "Data encryption at rest and in transit",
                  "No data persistence after migration",
                  "Isolated tenant environments",
                  "Regular security assessments",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/70">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to migrate your BI reports?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start your migration to Microsoft Power BI today. Connect your source system and let FRAMe handle the
            rest.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/login")}>
              <Play className="w-4 h-4 mr-2" />
              Start Migration
            </Button>
            <Button variant="outline" size="lg">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Link to="/" className="flex items-center gap-2.5 mb-4">
                <img src="/frame-logo-color.png" alt="FRAMe" className="h-6 w-auto" />
              </Link>
              <p className="text-sm text-muted-foreground">Enterprise BI migration platform for Microsoft Power BI</p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Migration Sources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Tableau</li>
                <li>MicroStrategy</li>
                <li>SAP BusinessObjects</li>
                <li>IBM Cognos</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Status Page
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} FRAMe. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">Built for Microsoft Power BI</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
