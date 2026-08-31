import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatStrip from "./StatStrip";
import ClassificationBadge from "./ClassificationBadge";
import RationaleTooltip from "./Rationaletooltip";
import DataModelDiagram from "./DataModelDiagram";
import ScoreGauge from "./ScoreGauge";
import ViewActivityList from "./ViewActivityList";
import {
  WorkbookBundle,
  UsageAnalysisResult,
  ComplexityAnalysisResult,
} from "@/types/analysis";
import {
  Database,
  Gauge,
  Activity,
  LayoutGrid,
  SlidersHorizontal,
  Table2,
  BarChart3,
  Calculator,
  ListFilter,
  Share2,
} from "lucide-react";

const NA = () => <span className="text-muted-foreground italic">Not available</span>;

/** Tableau's internal field/datasource `name` is an opaque technical
 * identifier (e.g. "federated.abc123", "Calculation_98765..."); `caption`
 * is the human-readable label a user actually sees in Tableau. Always
 * prefer caption for anything rendered in the UI. */
const displayName = (entity: { caption?: string; name?: string } | undefined | null, fallback = "Unnamed"): string =>
  entity?.caption?.trim() || entity?.name?.trim() || fallback;

interface WorkbookAnalysisPanelProps {
  bundle: WorkbookBundle;
  usage?: UsageAnalysisResult;
  complexity?: ComplexityAnalysisResult;
  /** Table names flagged by the cross-workbook Shared Data Model analysis,
   * used to show this workbook's schema in the context of the wider
   * portfolio rather than in isolation. */
  sharedTableNames?: Set<string>;
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">{children}</p>
);

const WorkbookAnalysisPanel = ({ bundle, usage, complexity, sharedTableNames }: WorkbookAnalysisPanelProps) => {
  /** Merge duplicate table entries into one row per table.
   *
   * `bundle.data_model.tables` can contain more than one object for the
   * same physical table when the backend runs multiple analysis passes
   * over a workbook (e.g. a "structure" pass that records `table` +
   * `datasource`, and a separate "schema" pass that records `table` +
   * `columns`) and appends each result instead of upserting into a
   * single record. Left unmerged, the UI renders the same table name
   * twice — once with a datasource and no columns, once with columns and
   * no datasource.
   *
   * This merges by table name (case-insensitive) and combines fields
   * from every entry seen, preferring the earliest non-empty value found
   * for group-level fields and always keeping non-empty `columns`. */
  const mergedTables = useMemo(() => {
    const map = new Map<string, any>();
    (bundle.data_model?.tables ?? []).forEach((t: any) => {
      const key = (t.name || t.table || "").trim().toLowerCase();
      if (!key) return;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, t);
        return;
      }
      map.set(key, {
        ...existing,
        ...t,
        // Never let a later, columns-less pass wipe out columns we
        // already found, and vice versa.
        columns: (t.columns?.length ? t.columns : existing.columns) ?? [],
        datasource: t.datasource || existing.datasource,
        name: existing.name || t.name,
        table: existing.table || t.table,
      });
    });
    return Array.from(map.values());
  }, [bundle.data_model?.tables]);

  const structure = {
    dashboards: bundle.components?.dashboards?.length ?? bundle.reports?.dashboards?.length ?? 0,
    worksheets: bundle.components?.worksheets?.length ?? bundle.reports?.worksheets?.length ?? 0,
    datasources: bundle.data_model?.datasources?.length ?? 0,
    tables: mergedTables.length,
    calculatedFields: bundle.fields?.calculated_fields?.length ?? 0,
    kpis: bundle.kpis?.length ?? 0,
    parameters: bundle.components?.parameters?.length ?? 0,
    filters: bundle.components?.filters?.length ?? 0,
  };

  const structureMax = Math.max(structure.dashboards, structure.datasources, structure.calculatedFields, structure.kpis, 1);
  const sharedCount = mergedTables.filter((t: any) => {
    const label = (t.name || t.table || "").trim();
    return label && sharedTableNames?.has(label);
  }).length ?? 0;

  return (
    <div className="space-y-5">
      {/* ---- Complexity / Usage : lead with the two scores as gauges, not buried
           numbers. One merged card (not two) so the pair reads as a single
           "how healthy is this workbook" unit. The rationale shows as a
           truncated one-liner with an info icon — hover/focus it for the
           full explanation in a tooltip, instead of a wall of text
           competing with the score for space. ---- */}
      <div className="rounded-lg border border-border bg-border overflow-hidden enterprise-shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px">
          <div className="bg-card p-4 flex gap-4">
            {complexity ? (
              <ScoreGauge value={complexity.complexity_score} classification={complexity.complexity_classification} />
            ) : (
              <div className="w-16 h-16 rounded-full border-4 border-dashed border-muted shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5" /> Migration Complexity
                </span>
                {complexity && <ClassificationBadge value={complexity.complexity_classification} />}
              </div>
              {complexity?.rationale ? (
                <div className="flex items-center gap-1.5 mt-2 min-w-0">
                  <p className="text-xs text-muted-foreground truncate min-w-0 flex-1">{complexity.rationale}</p>
                  <RationaleTooltip text={complexity.rationale} />
                </div>
              ) : (
                !complexity && <NA />
              )}
            </div>
          </div>

          <div className="bg-card p-4 flex gap-4">
            {usage ? (
              <ScoreGauge value={usage.popularity_score} classification={usage.usage_classification} />
            ) : (
              <div className="w-16 h-16 rounded-full border-4 border-dashed border-muted shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Usage
                </span>
                {usage && <ClassificationBadge value={usage.usage_classification} />}
              </div>
              {usage?.rationale ? (
                <div className="flex items-center gap-1.5 mt-2 min-w-0">
                  <p className="text-xs text-muted-foreground truncate min-w-0 flex-1">{usage.rationale}</p>
                  <RationaleTooltip text={usage.rationale} />
                </div>
              ) : (
                !usage && <NA />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---- View activity: real per-view frequency ranking (no fabricated recency) ---- */}
      {(bundle.usage?.view_counts?.length ?? 0) > 0 && (
        <div className="p-4 rounded-lg border border-border bg-card enterprise-shadow">
          <ViewActivityList viewCounts={bundle.usage.view_counts} />
        </div>
      )}

      {/* ---- At a glance : one divided strip instead of four separate cards ---- */}
      <StatStrip
        smCols={4}
        items={[
          {
            label: "Dashboards",
            value: structure.dashboards,
            icon: <LayoutGrid />,
            fillPercent: (structure.dashboards / structureMax) * 100,
          },
          {
            label: "Data Sources",
            value: structure.datasources,
            icon: <Database />,
            fillPercent: (structure.datasources / structureMax) * 100,
          },
          {
            label: "Calculated Fields",
            value: structure.calculatedFields,
            icon: <SlidersHorizontal />,
            fillPercent: (structure.calculatedFields / structureMax) * 100,
          },
          {
            label: "KPIs",
            value: structure.kpis,
            icon: <Activity />,
            fillPercent: (structure.kpis / structureMax) * 100,
          },
        ]}
      />

      {/* ---- Detail sections : collapsed by default so the page opens on
           signal (scores, view activity, at-a-glance counts) rather than
           a wall of raw metadata. Project/owner/dates live behind the
           person icon in the page header instead of a section here. ---- */}
      <Accordion type="multiple" defaultValue={[]} className="border border-border rounded-lg divide-y divide-border overflow-hidden">
        {/* Data Sources */}
        <AccordionItem value="datasources" className="border-0">
          <AccordionTrigger className="px-4 py-3 text-sm hover:no-underline">
            <span className="flex items-center gap-2">
              <Database className="w-4 h-4 text-muted-foreground" />
              Data Sources
              <span className="text-xs font-normal text-muted-foreground">
                ({bundle.data_model?.datasources?.length ?? 0})
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {bundle.data_model?.datasources?.length ? (
              <div className="space-y-2">
                {bundle.data_model.datasources.map((ds: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-md border border-border">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{displayName(ds, `Data source ${idx + 1}`)}</p>
                      {ds.type && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">
                          {ds.type}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                      {ds.server && <span>Server: {ds.server}</span>}
                      {ds.database && <span>Database: {ds.database}</span>}
                      {ds.schema && <span>Schema: {ds.schema}</span>}
                    </div>
                    {/* Credentials/tokens are never rendered. */}
                  </div>
                ))}
              </div>
            ) : (
              <NA />
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Shared Data Model */}
        <AccordionItem value="datamodel" className="border-0">
          <AccordionTrigger className="px-4 py-3 text-sm hover:no-underline">
            <span className="flex items-center gap-2">
              <Table2 className="w-4 h-4 text-muted-foreground" />
              Shared Data Model
              <span className="text-xs font-normal text-muted-foreground">
                ({mergedTables.length} tables{sharedCount > 0 ? `, ${sharedCount} shared` : ""})
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            {sharedCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-accent text-xs text-accent-foreground">
                <Share2 className="w-3.5 h-3.5 shrink-0" />
                {sharedCount} table{sharedCount === 1 ? " is" : "s are"} also used by other workbooks — good
                consolidation candidate{sharedCount === 1 ? "" : "s"} for a shared Power BI semantic model.
              </div>
            )}
            <div>
              <SectionLabel>Schema</SectionLabel>
              {mergedTables.length ? (
                <DataModelDiagram
                  tables={mergedTables}
                  relationships={bundle.data_model?.relationships ?? []}
                  sharedTableNames={sharedTableNames}
                />
              ) : (
                <NA />
              )}
            </div>

            <div>
              <SectionLabel>Tables</SectionLabel>
              {mergedTables.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Table</TableHead>
                      <TableHead>Data Source</TableHead>
                      <TableHead>Columns</TableHead>
                      <TableHead className="text-right">Shared</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mergedTables.map((t: any, i: number) => {
                      const label = displayName(t, "Unnamed table");
                      const isShared = sharedTableNames?.has((t.name || t.table || "").trim());
                      const cols: string[] = Array.isArray(t.columns) ? t.columns : [];
                      return (
                        <TableRow key={i}>
                          <TableCell>{label}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {displayName(
                              bundle.data_model.datasources.find((d: any) => d.name === t.datasource),
                              t.datasource || "Not available",
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-xs">
                            {cols.length ? (
                              <span className="text-xs" title={cols.join(", ")}>
                                {cols.slice(0, 4).join(", ")}
                                {cols.length > 4 ? ` +${cols.length - 4} more` : ""}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Not available</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isShared ? (
                              <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium bg-powerbi/15 text-powerbi-foreground border-powerbi/30">
                                Shared
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <NA />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* KPIs */}
        <AccordionItem value="kpis" className="border-0">
          <AccordionTrigger className="px-4 py-3 text-sm hover:no-underline">
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              KPIs
              <span className="text-xs font-normal text-muted-foreground">({bundle.kpis?.length ?? 0})</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {bundle.kpis?.length ? (
              <div className="space-y-2">
                {bundle.kpis.map((kpi, i) => (
                  <div key={i} className="p-3 rounded-md border border-border">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{kpi.name || `KPI ${i + 1}`}</p>
                      {kpi.aggregation && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                          {kpi.aggregation}
                        </span>
                      )}
                    </div>
                    {kpi.formula && (
                      <details className="mt-1.5 group">
                        <summary className="text-xs text-primary cursor-pointer select-none list-none inline-flex items-center gap-1 hover:underline">
                          <span className="group-open:hidden">View formula</span>
                          <span className="hidden group-open:inline">Hide formula</span>
                        </summary>
                        <pre className="text-xs bg-muted/50 rounded p-2 mt-2 overflow-x-auto font-mono">
                          <code>{kpi.formula}</code>
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <NA />
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Calculations */}
        <AccordionItem value="calculations" className="border-0">
          <AccordionTrigger className="px-4 py-3 text-sm hover:no-underline">
            <span className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-muted-foreground" />
              Calculated Fields
              <span className="text-xs font-normal text-muted-foreground">
                ({bundle.fields?.calculated_fields?.length ?? 0})
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {bundle.fields?.calculated_fields?.length ? (
              <div className="space-y-2">
                {bundle.fields.calculated_fields.map((cf: any, i: number) => (
                  <div key={i} className="p-3 rounded-md border border-border">
                    <p className="text-sm font-medium">{displayName(cf, `Field ${i + 1}`)}</p>
                    {cf.formula ? (
                      <details className="mt-1.5 group">
                        <summary className="text-xs text-primary cursor-pointer select-none list-none inline-flex items-center gap-1 hover:underline">
                          <span className="group-open:hidden">View formula</span>
                          <span className="hidden group-open:inline">Hide formula</span>
                        </summary>
                        <pre className="text-xs bg-muted/50 rounded p-2 mt-2 overflow-x-auto font-mono">
                          <code>{cf.formula}</code>
                        </pre>
                      </details>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1"><NA /></p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <NA />
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Filters & Parameters */}
        <AccordionItem value="filters-params" className="border-0">
          <AccordionTrigger className="px-4 py-3 text-sm hover:no-underline">
            <span className="flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-muted-foreground" />
              Filters &amp; Parameters
              <span className="text-xs font-normal text-muted-foreground">
                ({(bundle.components?.filters?.length ?? 0) + (bundle.components?.parameters?.length ?? 0)})
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <div>
              <SectionLabel>Filters</SectionLabel>
              {bundle.components?.filters?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {bundle.components.filters.map((f: any, i: number) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-md bg-muted">
                      {displayName(f, f.column) || `Filter ${i + 1}`}
                    </span>
                  ))}
                </div>
              ) : (
                <NA />
              )}
            </div>
            <div>
              <SectionLabel>Parameters</SectionLabel>
              {bundle.components?.parameters?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {bundle.components.parameters.map((p: any, i: number) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-md bg-muted">
                      {displayName(p, `Parameter ${i + 1}`)}
                    </span>
                  ))}
                </div>
              ) : (
                <NA />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default WorkbookAnalysisPanel;
