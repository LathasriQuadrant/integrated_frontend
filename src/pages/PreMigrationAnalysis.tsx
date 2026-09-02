// import { useEffect, useMemo, useRef, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import {
//   ArrowLeft,
//   ChevronRight,
//   Loader2,
//   AlertTriangle,
//   Database,
//   Activity,
//   Boxes,
//   RefreshCw,
//   ArrowUpRight,
//   Gauge,
//   TrendingUp,
//   TrendingDown,
// } from "lucide-react";
// import AppLayout from "@/components/layout/AppLayout";
// import { Button } from "@/components/ui/button";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { useToast } from "@/hooks/use-toast";
// import { analysisApi, AnalysisApiError } from "@/api/analysisApi";
// import { FullAnalysisResponse } from "@/types/analysis";
// import { TreeNode } from "@/types/migration";
// import IconTile from "@/components/analysis/IconTile";
// import ClassificationBadge from "@/components/analysis/ClassificationBadge";
// import ScoreGauge from "@/components/analysis/ScoreGauge";
// import WorkbookAnalysisPanel from "@/components/analysis/WorkbookAnalysisPanel";
// import WorkbookInfoPopover from "@/components/analysis/WorkbookInfoPopover";
// import InsightCard from "@/components/analysis/InsightCard";
// import {
//   Copy,
//   GitBranch,
//   Layers,
//   ShieldAlert,
//   LayoutGrid as LayoutGridIcon,
//   SlidersHorizontal as SlidersHorizontalIcon,
//   ListFilter as ListFilterIcon,
// } from "lucide-react";

// const TABLEAU_BACKEND_URL = "https://frame-premigration-test-cabfgrazgacqgzf9.eastus-01.azurewebsites.net";

// interface NavState {
//   workbookIds: string[];
//   workbookNames: string[];
// }

// function average(nums: number[]): number {
//   if (nums.length === 0) return 0;
//   return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
// }

// const underlineTabsList = "h-auto bg-transparent p-0 border-b border-border rounded-none justify-start gap-6";
// const underlineTabsTrigger =
//   "px-0 py-2.5 rounded-none bg-transparent shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary text-muted-foreground data-[state=active]:text-foreground font-medium";

// const PreMigrationAnalysis = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { toast } = useToast();

//   const navState = location.state as NavState | null;

//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [result, setResult] = useState<FullAnalysisResponse | null>(null);
//   const [activeWorkbookId, setActiveWorkbookId] = useState<string | null>(null);
//   const [isPreparingMigration, setIsPreparingMigration] = useState(false);
//   const workbookDetailRef = useRef<HTMLDivElement>(null);

//   const runAnalysis = async () => {
//     const token = sessionStorage.getItem("tableau_api_token");
//     if (!token) {
//       toast({ title: "Session expired", description: "Please sign in again", variant: "destructive" });
//       navigate("/");
//       return;
//     }

//     setIsLoading(true);
//     setError(null);

//     try {
//       const response = await analysisApi.analyzeWorkbooks({
//         apiToken: token,
//         workbookIds: navState?.workbookIds,
//       });
//       setResult(response);
//       setActiveWorkbookId(response.metadata.workbooks[0]?.workbook_metadata.id ?? null);
//     } catch (err) {
//       const message =
//         err instanceof AnalysisApiError ? err.message : "Something went wrong while analyzing the selected workbooks.";
//       setError(message);
//       toast({ title: "Analysis failed", description: message, variant: "destructive" });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     runAnalysis();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const workbooks = result?.metadata.workbooks ?? [];
//   const isMulti = workbooks.length > 1;

//   const usageById = useMemo(() => {
//     const map = new Map<string, FullAnalysisResponse["usage_analysis"][number]>();
//     result?.usage_analysis.forEach((u) => map.set(u.workbook_id, u));
//     return map;
//   }, [result]);

//   const complexityById = useMemo(() => {
//     const map = new Map<string, FullAnalysisResponse["complexity_analysis"][number]>();
//     result?.complexity_analysis.forEach((c) => map.set(c.workbook_id, c));
//     return map;
//   }, [result]);

//   const totals = useMemo(() => {
//     const totalDataSources = workbooks.reduce((sum, wb) => sum + (wb.data_model?.datasources?.length ?? 0), 0);
//     const totalKpis = workbooks.reduce((sum, wb) => sum + (wb.kpis?.length ?? 0), 0);
//     const avgComplexity = average(result?.complexity_analysis.map((c) => c.complexity_score) ?? []);
//     const highRiskCount =
//       result?.complexity_analysis.filter((c) => c.complexity_classification?.toLowerCase() === "high").length ?? 0;
//     return { totalDataSources, totalKpis, avgComplexity, highRiskCount };
//   }, [workbooks, result]);

//   const activeWorkbook = workbooks.find((wb) => wb.workbook_metadata.id === activeWorkbookId) ?? workbooks[0];

//   const workbookIdByName = useMemo(() => {
//     const map = new Map<string, string>();
//     workbooks.forEach((wb) => map.set(wb.workbook_metadata.name, wb.workbook_metadata.id));
//     return map;
//   }, [workbooks]);

//   const workbookNameSet = useMemo(() => new Set(workbookIdByName.keys()), [workbookIdByName]);

//   const jumpToWorkbook = (name: string) => {
//     const id = workbookIdByName.get(name);
//     if (!id) return;
//     setActiveWorkbookId(id);
//     requestAnimationFrame(() => workbookDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
//   };

//   /** Table names flagged as shared by the cross-workbook Shared Data Model
//    * analysis, so the active workbook's schema diagram can highlight which
//    * of its tables are also used elsewhere instead of showing it in isolation. */
//   const sharedTableNames = useMemo(
//     () => new Set((result?.datamodel_analysis?.shared_tables ?? []).map((t) => t.table).filter(Boolean)),
//     [result],
//   );

//   /** Most/least-used workbook by AI popularity score — real aggregated
//    * signal (usage_analysis), used to answer "which workbook is most/least
//    * frequently used" at a glance without digging into the table. */
//   const usageExtremes = useMemo(() => {
//     const scored = result?.usage_analysis.filter((u) => typeof u.popularity_score === "number") ?? [];
//     if (scored.length < 2) return null;
//     const sorted = [...scored].sort((a, b) => b.popularity_score - a.popularity_score);
//     return { most: sorted[0], least: sorted[sorted.length - 1] };
//   }, [result]);

//   // ---------------- Migrate to Power BI ----------------
//   const handleMigrateToPowerBI = async () => {
//     if (!activeWorkbook) return;
//     const token = sessionStorage.getItem("tableau_api_token");
//     if (!token) {
//       toast({ title: "Session expired", description: "Please sign in again", variant: "destructive" });
//       navigate("/");
//       return;
//     }

//     setIsPreparingMigration(true);
//     try {
//       const dlRes = await fetch(`${TABLEAU_BACKEND_URL}/tableau/download_workbook`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           api_token: token,
//           workbook_id: activeWorkbook.workbook_metadata.id,
//           file_name: `${activeWorkbook.workbook_metadata.name}.twbx`,
//         }),
//       });
//       if (!dlRes.ok) throw new Error("Failed to prepare workbook for migration");

//       const node: TreeNode = {
//         id: activeWorkbook.workbook_metadata.id,
//         name: activeWorkbook.workbook_metadata.name,
//         type: "workbook",
//       };
//       sessionStorage.setItem(
//         "selected_workbook",
//         JSON.stringify({ id: node.id, name: node.name, projectName: activeWorkbook.workbook_metadata.project }),
//       );

//       toast({ title: "Preparation complete", description: "Ready to select destination workspace" });
//       navigate("/workspace-selection", { state: { node, source: "tableau" } });
//     } catch (err) {
//       const message = err instanceof Error ? err.message : "Migration preparation failed";
//       toast({ title: "Migration failed", description: message, variant: "destructive" });
//     } finally {
//       setIsPreparingMigration(false);
//     }
//   };

//   // ---------------- Loading ----------------
//   if (isLoading) {
//     return (
//       <AppLayout>
//         <div className="max-w-3xl mx-auto h-full flex flex-col items-center justify-center text-center gap-3">
//           <Loader2 className="w-8 h-8 animate-spin text-primary" />
//           <h2 className="text-base font-semibold">Analyzing selected workbooks…</h2>
//           <p className="text-sm text-muted-foreground">
//             This may take a few moments
//             {navState?.workbookIds?.length
//               ? ` for ${navState.workbookIds.length} workbook${navState.workbookIds.length === 1 ? "" : "s"}`
//               : ""}
//             .
//           </p>
//         </div>
//       </AppLayout>
//     );
//   }

//   // ---------------- Error ----------------
//   if (error || !result) {
//     return (
//       <AppLayout>
//         <div className="max-w-2xl mx-auto h-full flex flex-col items-center justify-center text-center gap-4">
//           <AlertTriangle className="w-8 h-8 text-destructive" />
//           <h2 className="text-base font-semibold">Analysis failed</h2>
//           <p className="text-sm text-muted-foreground">{error || "No analysis result was returned."}</p>
//           <div className="flex gap-2">
//             <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
//               <ArrowLeft className="w-4 h-4 mr-2" />
//               Back
//             </Button>
//             <Button size="sm" onClick={runAnalysis}>
//               <RefreshCw className="w-4 h-4 mr-2" />
//               Retry
//             </Button>
//           </div>
//         </div>
//       </AppLayout>
//     );
//   }

//   return (
//     <AppLayout>
//       <div className="max-w-6xl mx-auto h-full flex flex-col overflow-y-auto pb-10">
//         {/* Breadcrumb */}
//         <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3 flex-shrink-0">
//           <button onClick={() => navigate("/")} className="hover:text-foreground">Dashboard</button>
//           <ChevronRight className="w-3.5 h-3.5" />
//           <span className="text-foreground font-medium">Pre-Migration Analysis</span>
//         </div>

//         {/* Header */}
//         <div className="flex items-center justify-between mb-5 flex-shrink-0">
//           <div className="flex items-center gap-3">
//             <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
//               <ArrowLeft className="w-4 h-4" />
//             </Button>
//             <div>
//               <h1 className="text-lg font-semibold">Pre-Migration Analysis</h1>
//               <p className="text-sm text-muted-foreground">
//                 {workbooks.length} workbook{workbooks.length === 1 ? "" : "s"} analyzed
//               </p>
//             </div>
//           </div>
//           <Button variant="outline" size="sm" onClick={runAnalysis}>
//             <RefreshCw className="w-3.5 h-3.5 mr-2" />
//             Re-run
//           </Button>
//         </div>

//         {/* Executive summary — one divided strip: portfolio health signal
//              first, then the counts, instead of two separate card groups. */}
//         <div className="rounded-xl border border-border bg-border overflow-hidden enterprise-shadow mb-6">
//           <div className="grid grid-cols-1 sm:grid-cols-4 gap-px">
//             <div className="bg-card p-4 flex items-center gap-4">
//               {result.complexity_analysis.length ? (
//                 <ScoreGauge value={totals.avgComplexity} size={56} strokeWidth={6} />
//               ) : (
//                 <div className="w-14 h-14 rounded-full border-4 border-dashed border-muted shrink-0" />
//               )}
//               <div className="min-w-0">
//                 <p className="text-xs font-medium text-muted-foreground">Avg. Complexity</p>
//                 <p className="text-sm font-semibold mt-0.5">
//                   {result.complexity_analysis.length ? `${totals.avgComplexity} / 100` : "Not available"}
//                 </p>
//                 <div className="flex items-center gap-1.5 mt-1 text-xs">
//                   <ShieldAlert
//                     className={`w-3.5 h-3.5 ${totals.highRiskCount > 0 ? "text-destructive" : "text-muted-foreground"}`}
//                   />
//                   <span className={totals.highRiskCount > 0 ? "text-destructive font-medium" : "text-muted-foreground"}>
//                     {totals.highRiskCount} high-risk
//                   </span>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-card p-4 flex items-center gap-3">
//               <IconTile icon={<Boxes />} />
//               <div className="min-w-0">
//                 <p className="text-xs font-medium text-muted-foreground truncate">Workbooks</p>
//                 <p className="text-xl font-semibold text-foreground tracking-tight tabular-nums">{workbooks.length}</p>
//               </div>
//             </div>

//             <div className="bg-card p-4 flex items-center gap-3">
//               <IconTile icon={<Database />} />
//               <div className="min-w-0">
//                 <p className="text-xs font-medium text-muted-foreground truncate">Data Sources</p>
//                 <p className="text-xl font-semibold text-foreground tracking-tight tabular-nums">
//                   {totals.totalDataSources}
//                 </p>
//               </div>
//             </div>

//             <div className="bg-card p-4 flex items-center gap-3">
//               <IconTile icon={<Activity />} />
//               <div className="min-w-0">
//                 <p className="text-xs font-medium text-muted-foreground truncate">KPIs</p>
//                 <p className="text-xl font-semibold text-foreground tracking-tight tabular-nums">{totals.totalKpis}</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Most/least frequently used workbook — real aggregated usage signal, front and center */}
//         {isMulti && usageExtremes && (
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
//             <button
//               onClick={() => jumpToWorkbook(usageExtremes.most.workbook_name)}
//               className="p-3 rounded-lg border border-border bg-card enterprise-shadow text-left hover:enterprise-shadow-md transition-enterprise flex items-center gap-3"
//             >
//               <div className="w-8 h-8 rounded-md bg-success/10 text-success flex items-center justify-center shrink-0">
//                 <TrendingUp className="w-4 h-4" />
//               </div>
//               <div className="min-w-0">
//                 <p className="text-xs text-muted-foreground">Most frequently used</p>
//                 <p className="text-sm font-medium truncate">{usageExtremes.most.workbook_name}</p>
//               </div>
//             </button>
//             <button
//               onClick={() => jumpToWorkbook(usageExtremes.least.workbook_name)}
//               className="p-3 rounded-lg border border-border bg-card enterprise-shadow text-left hover:enterprise-shadow-md transition-enterprise flex items-center gap-3"
//             >
//               <div className="w-8 h-8 rounded-md bg-muted text-muted-foreground flex items-center justify-center shrink-0">
//                 <TrendingDown className="w-4 h-4" />
//               </div>
//               <div className="min-w-0">
//                 <p className="text-xs text-muted-foreground">Least used</p>
//                 <p className="text-sm font-medium truncate">{usageExtremes.least.workbook_name}</p>
//               </div>
//             </button>
//           </div>
//         )}

//         {/* Portfolio comparison (multi-workbook only) */}
//         {isMulti && (
//           <div className="mb-6 rounded-lg border border-border bg-card enterprise-shadow overflow-hidden">
//             <div className="px-4 py-3 border-b border-border">
//               <h2 className="text-sm font-semibold">All Workbooks</h2>
//             </div>
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Workbook</TableHead>
//                   <TableHead>Usage</TableHead>
//                   <TableHead>Complexity</TableHead>
//                   <TableHead className="text-right">Data Sources</TableHead>
//                   <TableHead className="text-right">KPIs</TableHead>
//                   <TableHead className="text-right">Details</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {workbooks.map((wb) => {
//                   const id = wb.workbook_metadata.id;
//                   const usage = usageById.get(id);
//                   const complexity = complexityById.get(id);
//                   const isActive = activeWorkbookId === id;
//                   return (
//                     <TableRow
//                       key={id}
//                       onClick={() => setActiveWorkbookId(id)}
//                       className={`cursor-pointer ${isActive ? "bg-muted/60" : ""}`}
//                     >
//                       <TableCell className="font-medium">{wb.workbook_metadata.name}</TableCell>
//                       <TableCell>
//                         <div className="flex items-center gap-2">
//                           {usage && (
//                             <ScoreGauge
//                               value={usage.popularity_score}
//                               classification={usage.usage_classification}
//                               size={22}
//                               strokeWidth={3}
//                             />
//                           )}
//                           <ClassificationBadge value={usage?.usage_classification} />
//                         </div>
//                       </TableCell>
//                       <TableCell>
//                         <div className="flex items-center gap-2">
//                           {complexity && (
//                             <ScoreGauge
//                               value={complexity.complexity_score}
//                               classification={complexity.complexity_classification}
//                               size={22}
//                               strokeWidth={3}
//                             />
//                           )}
//                           <ClassificationBadge value={complexity?.complexity_classification} />
//                         </div>
//                       </TableCell>
//                       <TableCell className="text-right tabular-nums">{wb.data_model?.datasources?.length ?? 0}</TableCell>
//                       <TableCell className="text-right tabular-nums">{wb.kpis?.length ?? 0}</TableCell>
//                       <TableCell className="text-right">
//                         <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setActiveWorkbookId(id); }}>
//                           View <ChevronRight className="w-3.5 h-3.5 ml-1" />
//                         </Button>
//                       </TableCell>
//                     </TableRow>
//                   );
//                 })}
//               </TableBody>
//             </Table>
//           </div>
//         )}

//         {/* Single-workbook detail / drill-down */}
//         {activeWorkbook && (
//           <div className="mb-8" ref={workbookDetailRef}>
//             <div className="flex items-center justify-between mb-3">
//               <div className="flex items-center gap-1">
//                 <h2 className="text-sm font-semibold">
//                   {activeWorkbook.workbook_metadata.name || "Workbook Details"}
//                 </h2>
//                 <WorkbookInfoPopover meta={activeWorkbook.workbook_metadata} />
//               </div>
//               <Button size="sm" onClick={handleMigrateToPowerBI} disabled={isPreparingMigration}>
//                 {isPreparingMigration ? (
//                   <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
//                 ) : (
//                   <ArrowUpRight className="w-3.5 h-3.5 mr-2" />
//                 )}
//                 Migrate to Power BI
//               </Button>
//             </div>
//             <WorkbookAnalysisPanel
//               bundle={activeWorkbook}
//               usage={usageById.get(activeWorkbook.workbook_metadata.id)}
//               complexity={complexityById.get(activeWorkbook.workbook_metadata.id)}
//               sharedTableNames={sharedTableNames}
//             />
//           </div>
//         )}

//         {/* Cross-workbook AI insights */}
//         <div>
//           <h2 className="text-sm font-semibold mb-1">Cross-Workbook Insights</h2>
//           <p className="text-xs text-muted-foreground mb-3">Click any card for the full detail.</p>
//           <Tabs defaultValue="kpi-intel">
//             <TabsList className={underlineTabsList}>
//               <TabsTrigger value="kpi-intel" className={underlineTabsTrigger}>KPI Intelligence</TabsTrigger>
//               <TabsTrigger value="shared-model" className={underlineTabsTrigger}>Shared Data Model</TabsTrigger>
//               <TabsTrigger value="unused" className={underlineTabsTrigger}>Unused Assets</TabsTrigger>
//             </TabsList>

//             <TabsContent value="kpi-intel" className="space-y-5 pt-4">
//               {result.kpi_analysis ? (
//                 <>
//                   <InsightGroup title="Duplicate KPIs" icon={<Copy />} tone="warning" count={result.kpi_analysis.duplicate_kpis.length}>
//                     {result.kpi_analysis.duplicate_kpis.map((g, i) => (
//                       <InsightCard
//                         key={i}
//                         title={g.group_name}
//                         meta={`${g.kpis.length} KPIs`}
//                         chips={g.kpis}
//                         detail={g.reason}
//                         icon={<Copy />}
//                         tone="warning"
//                       />
//                     ))}
//                   </InsightGroup>
//                   <InsightGroup title="Similar KPIs" icon={<GitBranch />} tone="default" count={result.kpi_analysis.similar_kpis.length}>
//                     {result.kpi_analysis.similar_kpis.map((g, i) => (
//                       <InsightCard key={i} title={g.group_name} meta={`${g.kpis.length} KPIs`} chips={g.kpis} detail={g.reason} icon={<GitBranch />} />
//                     ))}
//                   </InsightGroup>
//                   <InsightGroup title="KPI Clusters" icon={<Layers />} tone="default" count={result.kpi_analysis.kpi_clusters.length}>
//                     {result.kpi_analysis.kpi_clusters.map((c, i) => (
//                       <InsightCard key={i} title={c.cluster_name} meta={`${c.kpis.length} KPIs`} chips={c.kpis} icon={<Layers />} />
//                     ))}
//                   </InsightGroup>
//                 </>
//               ) : (
//                 <p className="text-sm text-muted-foreground italic">Not available</p>
//               )}
//             </TabsContent>

//             <TabsContent value="shared-model" className="space-y-5 pt-4">
//               {result.datamodel_analysis ? (
//                 <>
//                   <InsightGroup title="Shared Data Sources" icon={<Database />} count={result.datamodel_analysis.shared_datasources.length}>
//                     {result.datamodel_analysis.shared_datasources.map((s, i) => (
//                       <InsightCard
//                         key={i}
//                         title={s.datasource}
//                         meta={`Used by ${s.used_by_report_count} report${s.used_by_report_count === 1 ? "" : "s"}`}
//                         chips={s.used_by_reports}
//                         icon={<Database />}
//                         onJumpToWorkbook={jumpToWorkbook}
//                         workbookNames={workbookNameSet}
//                       />
//                     ))}
//                   </InsightGroup>
//                   <InsightGroup title="Shared Tables" icon={<Layers />} count={result.datamodel_analysis.shared_tables.length}>
//                     {result.datamodel_analysis.shared_tables.map((t, i) => (
//                       <InsightCard
//                         key={i}
//                         title={t.table}
//                         meta={`Used by ${t.used_by_datasource_count} data source${t.used_by_datasource_count === 1 ? "" : "s"}`}
//                         chips={t.used_by_datasources}
//                         icon={<Layers />}
//                       />
//                     ))}
//                   </InsightGroup>
//                   <InsightGroup
//                     title="Recommended Semantic Models"
//                     icon={<Gauge />}
//                     tone="success"
//                     count={result.datamodel_analysis.recommended_semantic_models.length}
//                   >
//                     {result.datamodel_analysis.recommended_semantic_models.map((m, i) => (
//                       <InsightCard
//                         key={i}
//                         title={m.model_name}
//                         meta={`${m.source_datasources.length} source datasource${m.source_datasources.length === 1 ? "" : "s"}`}
//                         chips={m.source_datasources}
//                         detail={m.rationale}
//                         icon={<Gauge />}
//                         tone="success"
//                       />
//                     ))}
//                   </InsightGroup>
//                 </>
//               ) : (
//                 <p className="text-sm text-muted-foreground italic">Not available</p>
//               )}
//             </TabsContent>

//             <TabsContent value="unused" className="space-y-5 pt-4">
//               {result.unused_asset_analysis ? (
//                 <>
//                   <InsightGroup title="Unused Worksheets" icon={<LayoutGridIcon />} tone="warning" count={result.unused_asset_analysis.unused_worksheets.length}>
//                     {result.unused_asset_analysis.unused_worksheets.map((u, i) => (
//                       <InsightCard key={i} title={u.name} detail={u.reason} icon={<LayoutGridIcon />} tone="warning" />
//                     ))}
//                   </InsightGroup>
//                   <InsightGroup
//                     title="Unused Calculated Fields"
//                     icon={<SlidersHorizontalIcon />}
//                     tone="warning"
//                     count={result.unused_asset_analysis.unused_calculated_fields.length}
//                   >
//                     {result.unused_asset_analysis.unused_calculated_fields.map((u, i) => (
//                       <InsightCard key={i} title={u.name} detail={u.reason} icon={<SlidersHorizontalIcon />} tone="warning" />
//                     ))}
//                   </InsightGroup>
//                   <InsightGroup title="Unused Filters" icon={<ListFilterIcon />} tone="warning" count={result.unused_asset_analysis.unused_filters.length}>
//                     {result.unused_asset_analysis.unused_filters.map((u, i) => (
//                       <InsightCard key={i} title={u.name} detail={u.reason} icon={<ListFilterIcon />} tone="warning" />
//                     ))}
//                   </InsightGroup>
//                   <InsightGroup
//                     title="Unused Parameters"
//                     icon={<SlidersHorizontalIcon />}
//                     tone="warning"
//                     count={result.unused_asset_analysis.unused_parameters.length}
//                   >
//                     {result.unused_asset_analysis.unused_parameters.map((u, i) => (
//                       <InsightCard key={i} title={u.name} detail={u.reason} icon={<SlidersHorizontalIcon />} tone="warning" />
//                     ))}
//                   </InsightGroup>
//                   <InsightGroup title="Unused Data Sources" icon={<Database />} tone="warning" count={result.unused_asset_analysis.unused_datasources.length}>
//                     {result.unused_asset_analysis.unused_datasources.map((u, i) => (
//                       <InsightCard key={i} title={u.name} detail={u.reason} icon={<Database />} tone="warning" />
//                     ))}
//                   </InsightGroup>
//                 </>
//               ) : (
//                 <p className="text-sm text-muted-foreground italic">Not available</p>
//               )}
//             </TabsContent>
//           </Tabs>
//         </div>
//       </div>
//     </AppLayout>
//   );
// };

// const insightGroupIconClasses: Record<"default" | "warning" | "success", string> = {
//   default: "bg-primary/10 text-primary",
//   warning: "bg-warning/10 text-warning",
//   success: "bg-success/10 text-success",
// };

// /** Groups a set of InsightCards under a labeled, counted heading. */
// const InsightGroup = ({
//   title,
//   icon,
//   tone = "default",
//   count,
//   children,
// }: {
//   title: string;
//   icon?: React.ReactNode;
//   tone?: "default" | "warning" | "success";
//   count: number;
//   children: React.ReactNode;
// }) => (
//   <div>
//     <div className="flex items-center gap-2 mb-2.5">
//       {icon && (
//         <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${insightGroupIconClasses[tone]}`}>
//           <div className="w-3.5 h-3.5">{icon}</div>
//         </div>
//       )}
//       <p className="text-sm font-medium">{title}</p>
//       <span className="text-xs font-medium text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 leading-none">
//         {count}
//       </span>
//     </div>
//     {count === 0 ? (
//       <p className="text-sm text-muted-foreground italic pl-8">None found</p>
//     ) : (
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">{children}</div>
//     )}
//   </div>
// );

// export default PreMigrationAnalysis;

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Database,
  Activity,
  Boxes,
  RefreshCw,
  ArrowUpRight,
  Gauge,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { analysisApi, AnalysisApiError } from "@/api/analysisApi";
import { FullAnalysisResponse } from "@/types/analysis";
import { TreeNode } from "@/types/migration";
import IconTile from "@/components/analysis/IconTile";
import ClassificationBadge from "@/components/analysis/ClassificationBadge";
import ScoreGauge from "@/components/analysis/ScoreGauge";
import WorkbookAnalysisPanel from "@/components/analysis/WorkbookAnalysisPanel";
import WorkbookInfoPopover from "@/components/analysis/WorkbookInfoPopover";
import InsightCard from "@/components/analysis/InsightCard";
import {
  Copy,
  GitBranch,
  Layers,
  ShieldAlert,
  LayoutGrid as LayoutGridIcon,
  SlidersHorizontal as SlidersHorizontalIcon,
  ListFilter as ListFilterIcon,
} from "lucide-react";

// const TABLEAU_BACKEND_URL = import.meta.env.VITE_TABLEAU_BACKEND_URL || "http://localhost:8000";
const TABLEAU_BACKEND_URL = "https://frame-premigration-test-cabfgrazgacqgzf9.eastus-01.azurewebsites.net";

interface NavState {
  workbookIds: string[];
  workbookNames: string[];
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

const underlineTabsList = "h-auto bg-transparent p-0 border-b border-border rounded-none justify-start gap-6";
const underlineTabsTrigger =
  "px-0 py-2.5 rounded-none bg-transparent shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary text-muted-foreground data-[state=active]:text-foreground font-medium";

const PreMigrationAnalysis = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const navState = location.state as NavState | null;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FullAnalysisResponse | null>(null);
  const [activeWorkbookId, setActiveWorkbookId] = useState<string | null>(null);
  const [isPreparingMigration, setIsPreparingMigration] = useState(false);
  const workbookDetailRef = useRef<HTMLDivElement>(null);

  const runAnalysis = async () => {
    const token = sessionStorage.getItem("tableau_api_token");
    if (!token) {
      toast({ title: "Session expired", description: "Please sign in again", variant: "destructive" });
      navigate("/");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await analysisApi.analyzeWorkbooks({
        apiToken: token,
        workbookIds: navState?.workbookIds,
      });
      setResult(response);
      setActiveWorkbookId(response.metadata.workbooks[0]?.workbook_metadata.id ?? null);
    } catch (err) {
      const message =
        err instanceof AnalysisApiError ? err.message : "Something went wrong while analyzing the selected workbooks.";
      setError(message);
      toast({ title: "Analysis failed", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const workbooks = result?.metadata.workbooks ?? [];
  const isMulti = workbooks.length > 1;

  const usageById = useMemo(() => {
    const map = new Map<string, FullAnalysisResponse["usage_analysis"][number]>();
    result?.usage_analysis.forEach((u) => map.set(u.workbook_id, u));
    return map;
  }, [result]);

  const complexityById = useMemo(() => {
    const map = new Map<string, FullAnalysisResponse["complexity_analysis"][number]>();
    result?.complexity_analysis.forEach((c) => map.set(c.workbook_id, c));
    return map;
  }, [result]);

  const totals = useMemo(() => {
    const totalDataSources = workbooks.reduce((sum, wb) => sum + (wb.data_model?.datasources?.length ?? 0), 0);
    const totalKpis = workbooks.reduce((sum, wb) => sum + (wb.kpis?.length ?? 0), 0);
    const avgComplexity = average(result?.complexity_analysis.map((c) => c.complexity_score) ?? []);
    const highRiskCount =
      result?.complexity_analysis.filter((c) => c.complexity_classification?.toLowerCase() === "high").length ?? 0;
    return { totalDataSources, totalKpis, avgComplexity, highRiskCount };
  }, [workbooks, result]);

  const activeWorkbook = workbooks.find((wb) => wb.workbook_metadata.id === activeWorkbookId) ?? workbooks[0];

  const workbookIdByName = useMemo(() => {
    const map = new Map<string, string>();
    workbooks.forEach((wb) => map.set(wb.workbook_metadata.name, wb.workbook_metadata.id));
    return map;
  }, [workbooks]);

  const workbookNameSet = useMemo(() => new Set(workbookIdByName.keys()), [workbookIdByName]);

  const jumpToWorkbook = (name: string) => {
    const id = workbookIdByName.get(name);
    if (!id) return;
    setActiveWorkbookId(id);
    requestAnimationFrame(() => workbookDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  /** Table names flagged as shared by the cross-workbook Shared Data Model
   * analysis, so the active workbook's schema diagram can highlight which
   * of its tables are also used elsewhere instead of showing it in isolation. */
  const sharedTableNames = useMemo(
    () => new Set((result?.datamodel_analysis?.shared_tables ?? []).map((t) => t.table).filter(Boolean)),
    [result],
  );

  /** Most/least-used workbook by AI popularity score — real aggregated
   * signal (usage_analysis), used to answer "which workbook is most/least
   * frequently used" at a glance without digging into the table. */
  const usageExtremes = useMemo(() => {
    const scored = result?.usage_analysis.filter((u) => typeof u.popularity_score === "number") ?? [];
    if (scored.length < 2) return null;
    const sorted = [...scored].sort((a, b) => b.popularity_score - a.popularity_score);
    return { most: sorted[0], least: sorted[sorted.length - 1] };
  }, [result]);

  // ---------------- Migrate to Power BI ----------------
  const handleMigrateToPowerBI = async () => {
    if (!activeWorkbook) return;
    const token = sessionStorage.getItem("tableau_api_token");
    if (!token) {
      toast({ title: "Session expired", description: "Please sign in again", variant: "destructive" });
      navigate("/");
      return;
    }

    setIsPreparingMigration(true);
    try {
      const dlRes = await fetch(`${TABLEAU_BACKEND_URL}/tableau/download_workbook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_token: token,
          workbook_id: activeWorkbook.workbook_metadata.id,
          file_name: `${activeWorkbook.workbook_metadata.name}.twbx`,
        }),
      });
      if (!dlRes.ok) throw new Error("Failed to prepare workbook for migration");

      const node: TreeNode = {
        id: activeWorkbook.workbook_metadata.id,
        name: activeWorkbook.workbook_metadata.name,
        type: "workbook",
      };
      sessionStorage.setItem(
        "selected_workbook",
        JSON.stringify({ id: node.id, name: node.name, projectName: activeWorkbook.workbook_metadata.project }),
      );

      toast({ title: "Preparation complete", description: "Ready to select destination workspace" });
      navigate("/workspace-selection", { state: { node, source: "tableau" } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Migration preparation failed";
      toast({ title: "Migration failed", description: message, variant: "destructive" });
    } finally {
      setIsPreparingMigration(false);
    }
  };

  // ---------------- Loading ----------------
  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto h-full flex flex-col items-center justify-center text-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <h2 className="text-base font-semibold">Analyzing selected workbooks…</h2>
          <p className="text-sm text-muted-foreground">
            This may take a few moments
            {navState?.workbookIds?.length
              ? ` for ${navState.workbookIds.length} workbook${navState.workbookIds.length === 1 ? "" : "s"}`
              : ""}
            .
          </p>
        </div>
      </AppLayout>
    );
  }

  // ---------------- Error ----------------
  if (error || !result) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto h-full flex flex-col items-center justify-center text-center gap-4">
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <h2 className="text-base font-semibold">Analysis failed</h2>
          <p className="text-sm text-muted-foreground">{error || "No analysis result was returned."}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button size="sm" onClick={runAnalysis}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto h-full flex flex-col overflow-y-auto pb-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3 flex-shrink-0">
          <button onClick={() => navigate("/")} className="hover:text-foreground">Dashboard</button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">Pre-Migration Analysis</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Pre-Migration Analysis</h1>
              <p className="text-sm text-muted-foreground">
                {workbooks.length} workbook{workbooks.length === 1 ? "" : "s"} analyzed
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={runAnalysis}>
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Re-run
          </Button>
        </div>

        {/* Executive summary — one divided strip: portfolio health signal
             first, then the counts, instead of two separate card groups. */}
        <div className="rounded-xl border border-border bg-border overflow-hidden enterprise-shadow mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-px">
            <div className="bg-card p-4 flex items-center gap-4">
              {result.complexity_analysis.length ? (
                <ScoreGauge value={totals.avgComplexity} size={56} strokeWidth={6} />
              ) : (
                <div className="w-14 h-14 rounded-full border-4 border-dashed border-muted shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Avg. Complexity</p>
                <p className="text-sm font-semibold mt-0.5">
                  {result.complexity_analysis.length ? `${totals.avgComplexity} / 100` : "Not available"}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-xs">
                  <ShieldAlert
                    className={`w-3.5 h-3.5 ${totals.highRiskCount > 0 ? "text-destructive" : "text-muted-foreground"}`}
                  />
                  <span className={totals.highRiskCount > 0 ? "text-destructive font-medium" : "text-muted-foreground"}>
                    {totals.highRiskCount} high-risk
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-card p-4 flex items-center gap-3">
              <IconTile icon={<Boxes />} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground truncate">Workbooks</p>
                <p className="text-xl font-semibold text-foreground tracking-tight tabular-nums">{workbooks.length}</p>
              </div>
            </div>

            <div className="bg-card p-4 flex items-center gap-3">
              <IconTile icon={<Database />} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground truncate">Data Sources</p>
                <p className="text-xl font-semibold text-foreground tracking-tight tabular-nums">
                  {totals.totalDataSources}
                </p>
              </div>
            </div>

            <div className="bg-card p-4 flex items-center gap-3">
              <IconTile icon={<Activity />} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground truncate">KPIs</p>
                <p className="text-xl font-semibold text-foreground tracking-tight tabular-nums">{totals.totalKpis}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Most/least frequently used workbook — real aggregated usage signal, front and center */}
        {isMulti && usageExtremes && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => jumpToWorkbook(usageExtremes.most.workbook_name)}
              className="p-3 rounded-lg border border-border bg-card enterprise-shadow text-left hover:enterprise-shadow-md transition-enterprise flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-md bg-success/10 text-success flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Most frequently used</p>
                <p className="text-sm font-medium truncate">{usageExtremes.most.workbook_name}</p>
              </div>
            </button>
            <button
              onClick={() => jumpToWorkbook(usageExtremes.least.workbook_name)}
              className="p-3 rounded-lg border border-border bg-card enterprise-shadow text-left hover:enterprise-shadow-md transition-enterprise flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-md bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Least used</p>
                <p className="text-sm font-medium truncate">{usageExtremes.least.workbook_name}</p>
              </div>
            </button>
          </div>
        )}

        {/* Portfolio comparison (multi-workbook only) */}
        {isMulti && (
          <div className="mb-6 rounded-lg border border-border bg-card enterprise-shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold">All Workbooks</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workbook</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Complexity</TableHead>
                  <TableHead className="text-right">Data Sources</TableHead>
                  <TableHead className="text-right">KPIs</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workbooks.map((wb) => {
                  const id = wb.workbook_metadata.id;
                  const usage = usageById.get(id);
                  const complexity = complexityById.get(id);
                  const isActive = activeWorkbookId === id;
                  return (
                    <TableRow
                      key={id}
                      onClick={() => setActiveWorkbookId(id)}
                      className={`cursor-pointer ${isActive ? "bg-muted/60" : ""}`}
                    >
                      <TableCell className="font-medium">{wb.workbook_metadata.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {usage && (
                            <ScoreGauge
                              value={usage.popularity_score}
                              classification={usage.usage_classification}
                              size={22}
                              strokeWidth={3}
                            />
                          )}
                          <ClassificationBadge value={usage?.usage_classification} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {complexity && (
                            <ScoreGauge
                              value={complexity.complexity_score}
                              classification={complexity.complexity_classification}
                              size={22}
                              strokeWidth={3}
                            />
                          )}
                          <ClassificationBadge value={complexity?.complexity_classification} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{wb.data_model?.datasources?.length ?? 0}</TableCell>
                      <TableCell className="text-right tabular-nums">{wb.kpis?.length ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setActiveWorkbookId(id); }}>
                          View <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Single-workbook detail / drill-down */}
        {activeWorkbook && (
          <div className="mb-8" ref={workbookDetailRef}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                <h2 className="text-sm font-semibold">
                  {activeWorkbook.workbook_metadata.name || "Workbook Details"}
                </h2>
                <WorkbookInfoPopover meta={activeWorkbook.workbook_metadata} />
              </div>
             <div className="flex items-center gap-2">
                  <Button size="sm" disabled={isPreparingMigration}>
                
                    Migrate With Suggestions
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleMigrateToPowerBI}
                    disabled={isPreparingMigration}
                  >
                    
                    Migrate Without Suggestions
                  </Button>
                </div>
            </div>
            <WorkbookAnalysisPanel
              bundle={activeWorkbook}
              usage={usageById.get(activeWorkbook.workbook_metadata.id)}
              complexity={complexityById.get(activeWorkbook.workbook_metadata.id)}
              sharedTableNames={sharedTableNames}
            />
          </div>
        )}

        {/* Cross-workbook AI insights */}
        <div>
          <h2 className="text-sm font-semibold mb-1">Cross-Workbook Insights</h2>
          <p className="text-xs text-muted-foreground mb-3">Click any card for the full detail.</p>
          <Tabs defaultValue="kpi-intel">
            <TabsList className={underlineTabsList}>
              <TabsTrigger value="kpi-intel" className={underlineTabsTrigger}>KPI Intelligence</TabsTrigger>
              <TabsTrigger value="shared-model" className={underlineTabsTrigger}>Shared Data Model</TabsTrigger>
              <TabsTrigger value="unused" className={underlineTabsTrigger}>Unused Assets</TabsTrigger>
            </TabsList>

            <TabsContent value="kpi-intel" className="space-y-5 pt-4">
              {result.kpi_analysis ? (
                <>
                  <InsightGroup title="Duplicate KPIs" icon={<Copy />} tone="warning" count={result.kpi_analysis.duplicate_kpis.length}>
                    {result.kpi_analysis.duplicate_kpis.map((g, i) => (
                      <InsightCard
                        key={i}
                        title={g.group_name}
                        meta={`${g.kpis.length} KPIs`}
                        chips={g.kpis}
                        detail={g.reason}
                        icon={<Copy />}
                        tone="warning"
                        recommendedKeep={g.recommended_keep}
                        recommendedRemove={g.recommended_remove}
                        recommendationRationale={g.recommendation_rationale}
                      />
                    ))}
                  </InsightGroup>
                  {/* <InsightGroup title="Similar KPIs" icon={<GitBranch />} tone="default" count={result.kpi_analysis.similar_kpis.length}>
                    {result.kpi_analysis.similar_kpis.map((g, i) => (
                      <InsightCard
                        key={i}
                        title={g.group_name}
                        meta={`${g.kpis.length} KPIs`}
                        chips={g.kpis}
                        detail={g.reason}
                        icon={<GitBranch />}
                        recommendedKeep={g.recommended_keep}
                        recommendedRemove={g.recommended_remove}
                        recommendationRationale={g.recommendation_rationale}
                      />
                    ))}
                  </InsightGroup> */}
                  <InsightGroup title="Similar KPIs" icon={<GitBranch />} tone="default" count={result.kpi_analysis.similar_kpis.length}>
                    {result.kpi_analysis.similar_kpis.map((g, i) => (
                      <InsightCard
                        key={i}
                        title={g.group_name}
                        meta={`${g.kpis.length} KPIs`}
                        chips={g.kpis}
                        detail={[g.reason, g.advisory_note].filter(Boolean).join("\n\n")}
                        icon={<GitBranch />}
                      />
                    ))}
                  </InsightGroup>
                  <InsightGroup title="KPI Clusters" icon={<Layers />} tone="default" count={result.kpi_analysis.kpi_clusters.length}>
                    {result.kpi_analysis.kpi_clusters.map((c, i) => (
                      <InsightCard key={i} title={c.cluster_name} meta={`${c.kpis.length} KPIs`} chips={c.kpis} icon={<Layers />} />
                    ))}
                  </InsightGroup>
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">Not available</p>
              )}
            </TabsContent>

            <TabsContent value="shared-model" className="space-y-5 pt-4">
              {result.datamodel_analysis ? (
                <>
                  <InsightGroup title="Shared Data Sources" icon={<Database />} count={result.datamodel_analysis.shared_datasources.length}>
                    {result.datamodel_analysis.shared_datasources.map((s, i) => (
                      <InsightCard
                        key={i}
                        title={s.datasource}
                        meta={`Used by ${s.used_by_report_count} view${s.used_by_report_count === 1 ? "" : "s"}`}
                        chips={s.used_by_reports}
                        icon={<Database />}
                        onJumpToWorkbook={jumpToWorkbook}
                        workbookNames={workbookNameSet}
                      />
                    ))}
                  </InsightGroup>
                  <InsightGroup title="Shared Tables" icon={<Layers />} count={result.datamodel_analysis.shared_tables.length}>
                    {result.datamodel_analysis.shared_tables.map((t, i) => (
                      <InsightCard
                        key={i}
                        title={t.table}
                        meta={`Used by ${t.used_by_datasource_count} data source${t.used_by_datasource_count === 1 ? "" : "s"}`}
                        chips={t.used_by_datasources}
                        icon={<Layers />}
                      />
                    ))}
                  </InsightGroup>
                  <InsightGroup
                    title="Recommended Semantic Models"
                    icon={<Gauge />}
                    tone="success"
                    count={result.datamodel_analysis.recommended_semantic_models.length}
                  >
                    {result.datamodel_analysis.recommended_semantic_models.map((m, i) => (
                      <InsightCard
                        key={i}
                        title={m.model_name}
                        meta={`${m.source_datasources.length} source datasource${m.source_datasources.length === 1 ? "" : "s"}`}
                        chips={m.source_datasources}
                        detail={m.rationale}
                        icon={<Gauge />}
                        tone="success"
                      />
                    ))}
                  </InsightGroup>
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">Not available</p>
              )}
            </TabsContent>

            <TabsContent value="unused" className="space-y-5 pt-4">
              {result.unused_asset_analysis ? (
                <>
                  <InsightGroup title="Unused Worksheets" icon={<LayoutGridIcon />} tone="warning" count={result.unused_asset_analysis.unused_worksheets.length}>
                    {result.unused_asset_analysis.unused_worksheets.map((u, i) => (
                      <InsightCard key={i} title={u.name} detail={u.reason} icon={<LayoutGridIcon />} tone="warning" />
                    ))}
                  </InsightGroup>
                  <InsightGroup
                    title="Unused Calculated Fields"
                    icon={<SlidersHorizontalIcon />}
                    tone="warning"
                    count={result.unused_asset_analysis.unused_calculated_fields.length}
                  >
                    {result.unused_asset_analysis.unused_calculated_fields.map((u, i) => (
                      <InsightCard key={i} title={u.name} detail={u.reason} icon={<SlidersHorizontalIcon />} tone="warning" />
                    ))}
                  </InsightGroup>
                  <InsightGroup title="Unused Filters" icon={<ListFilterIcon />} tone="warning" count={result.unused_asset_analysis.unused_filters.length}>
                    {result.unused_asset_analysis.unused_filters.map((u, i) => (
                      <InsightCard key={i} title={u.name} detail={u.reason} icon={<ListFilterIcon />} tone="warning" />
                    ))}
                  </InsightGroup>
                  <InsightGroup
                    title="Unused Parameters"
                    icon={<SlidersHorizontalIcon />}
                    tone="warning"
                    count={result.unused_asset_analysis.unused_parameters.length}
                  >
                    {result.unused_asset_analysis.unused_parameters.map((u, i) => (
                      <InsightCard key={i} title={u.name} detail={u.reason} icon={<SlidersHorizontalIcon />} tone="warning" />
                    ))}
                  </InsightGroup>
                  <InsightGroup title="Unused Data Sources" icon={<Database />} tone="warning" count={result.unused_asset_analysis.unused_datasources.length}>
                    {result.unused_asset_analysis.unused_datasources.map((u, i) => (
                      <InsightCard key={i} title={u.name} detail={u.reason} icon={<Database />} tone="warning" />
                    ))}
                  </InsightGroup>
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">Not available</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

const insightGroupIconClasses: Record<"default" | "warning" | "success", string> = {
  default: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
};

/** Groups a set of InsightCards under a labeled, counted heading. */
const InsightGroup = ({
  title,
  icon,
  tone = "default",
  count,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  tone?: "default" | "warning" | "success";
  count: number;
  children: React.ReactNode;
}) => (
  <div>
    <div className="flex items-center gap-2 mb-2.5">
      {icon && (
        <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${insightGroupIconClasses[tone]}`}>
          <div className="w-3.5 h-3.5">{icon}</div>
        </div>
      )}
      <p className="text-sm font-medium">{title}</p>
      <span className="text-xs font-medium text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 leading-none">
        {count}
      </span>
    </div>
    {count === 0 ? (
      <p className="text-sm text-muted-foreground italic pl-8">None found</p>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">{children}</div>
    )}
  </div>
);

export default PreMigrationAnalysis;
