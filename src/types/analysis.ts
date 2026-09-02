// ==============================================================
// Pre-Migration AI Analysis types.
//
// These mirror the ACTUAL backend contract exactly:
//   - app/models/schemas.py            (request/response shapes)
//   - app/api/orchestration.py         (POST /analyze)
//   - app/services/ai/*.py             (what each analyzer really returns)
//
// Anything not present in the backend response is intentionally left
// out here rather than guessed. UI code should treat any field as
// possibly missing/empty and render "Not available" instead of
// fabricating data.
// ==============================================================

/** Request body for POST /analyze (FullAnalyzeRequest extends DiscoveryRequest). */
export interface AnalyzeRequest {
  // Auth: EITHER api_token (reuse existing Tableau session) OR username+password.
  api_token?: string;
  username?: string;
  password?: string;
  site_content_url?: string;

  // Optional: LUIDs of workbooks to analyze. Omit to analyze the whole site.
  workbook_ids?: string[];

  include_twbx_parsing?: boolean;

  // Toggle individual AI analyzers. All default to true server-side.
  run_usage_analysis?: boolean;
  run_kpi_analysis?: boolean;
  run_datamodel_analysis?: boolean;
  run_unused_asset_analysis?: boolean;
  run_complexity_analysis?: boolean;
}

// --------------------------------------------------------------
// Discovery / normalized metadata (per-workbook bundle)
// --------------------------------------------------------------

export interface WorkbookMetadata {
  id: string;
  name: string;
  description: string;
  owner: string;
  project: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  revisions: Record<string, unknown>[];
}

export interface ReportAssets {
  workbooks: Record<string, unknown>[];
  dashboards: Record<string, unknown>[];
  worksheets: Record<string, unknown>[];
}

export interface UsageMetadata {
  view_counts: ViewCountEntry[];
  view_statistics: Record<string, unknown>[];
  user_activity: Record<string, unknown>[];
  subscriptions: Record<string, unknown>[];
  permissions: Record<string, unknown>[];
}

export interface DataModelMetadata {
  datasources: Record<string, any>[];
  databases: Record<string, unknown>[];
  schemas: Record<string, unknown>[];
  tables: Record<string, any>[];
  relationships: Record<string, any>[];
  joins: Record<string, any>[];
  connections: Record<string, any>[];
  custom_sql: Record<string, unknown>[];
}

export interface FieldMetadata {
  dimensions: Record<string, unknown>[];
  measures: Record<string, unknown>[];
  calculated_fields: Record<string, any>[];
  formulas: Record<string, any>[];
  data_types: Record<string, unknown>[];
}

export interface KpiMetadata {
  name: string;
  formula: string;
  aggregation: string;
  dependencies: string[];
}

export interface DependencyMetadata {
  upstream: Record<string, unknown>[];
  downstream: Record<string, unknown>[];
  workbook_dependencies: Record<string, unknown>[];
  shared_datasources: Record<string, unknown>[];
}

export interface ComponentMetadata {
  dashboards: Record<string, unknown>[];
  worksheets: Record<string, unknown>[];
  filters: Record<string, any>[];
  parameters: Record<string, any>[];
  actions: Record<string, unknown>[];
}

export interface MappingMetrics {
  reports_per_datasource: Record<string, number>;
  datasources_per_dashboard: Record<string, number>;
  shared_datasources: number;
  shared_tables: number;
}

export interface MappingMetadata {
  datasource_to_reports: Record<string, string[]>;
  dashboard_to_datasources: Record<string, string[]>;
  mapping_metrics: MappingMetrics;
}

export interface WorkbookBundle {
  workbook_metadata: WorkbookMetadata;
  reports: ReportAssets;
  usage: UsageMetadata;
  data_model: DataModelMetadata;
  fields: FieldMetadata;
  kpis: KpiMetadata[];
  dependencies: DependencyMetadata;
  components: ComponentMetadata;
  mappings: MappingMetadata;
}

export interface NormalizedMetadata {
  workbooks: WorkbookBundle[];
}

// --------------------------------------------------------------
// AI analysis outputs
// --------------------------------------------------------------

export interface UsageAnalysisResult {
  workbook_id: string;
  workbook_name: string;
  popularity_score: number;
  usage_classification: string;
  rationale?: string;
}

// NOTE: the shapes below mirror the exact JSON contract each AI system
// prompt requests (see app/services/ai/prompts.py). The model is asked to
// return ONLY these keys, so it's safe to type them precisely instead of
// falling back to Record<string, any> — that lets the UI render each field
// meaningfully (e.g. distinguishing group_name from a list of KPI names)
// rather than dumping every key as an undifferentiated text block.

// export interface KpiGroup {
//   group_name: string;
//   kpis: string[];
//   reason: string;
// }
 export interface KpiGroup {
   group_name: string;
   kpis: string[];
   reason: string;
   advisory_note?: string;
   recommended_keep: string;
   recommended_remove: string[];
   recommendation_rationale: string;
 }

export interface KpiCluster {
  cluster_name: string;
  kpis: string[];
}

export interface KpiIntelligenceResult {
  duplicate_kpis: KpiGroup[];
  similar_kpis: KpiGroup[];
  kpi_clusters: KpiCluster[];
}

export interface SharedDatasourceEntry {
  datasource: string;
  used_by_report_count: number;
  used_by_reports: string[];
}

export interface SharedTableEntry {
  table: string;
  used_by_datasource_count: number;
  used_by_datasources: string[];
}

export interface RecommendedSemanticModel {
  model_name: string;
  source_datasources: string[];
  rationale: string;
}

export interface SharedDataModelResult {
  shared_datasources: SharedDatasourceEntry[];
  shared_tables: SharedTableEntry[];
  recommended_semantic_models: RecommendedSemanticModel[];
}

export interface UnusedComponentEntry {
  name: string;
  reason: string;
}

export interface UnusedComponentResult {
  unused_worksheets: UnusedComponentEntry[];
  unused_calculated_fields: UnusedComponentEntry[];
  unused_filters: UnusedComponentEntry[];
  unused_parameters: UnusedComponentEntry[];
  unused_datasources: UnusedComponentEntry[];
}

/** A single view's raw view-count entry, as returned by
 * discover_usage_metadata (app/services/discovery/usage_service.py).
 * There is currently no last-viewed/last-accessed timestamp coming from
 * the Tableau REST usage stats endpoint — only a cumulative total view
 * count per view — so "frequency" can be ranked but "recency" cannot. */
export interface ViewCountEntry {
  view_id: string;
  view_name: string;
  total_views: number;
}

export interface ComplexityAnalysisResult {
  workbook_id: string;
  workbook_name: string;
  complexity_score: number;
  complexity_classification: string;
  factor_breakdown: Record<string, number>;
  rationale?: string;
}

/** Full response body from POST /analyze. */
export interface FullAnalysisResponse {
  metadata: NormalizedMetadata;
  usage_analysis: UsageAnalysisResult[];
  kpi_analysis: KpiIntelligenceResult | null;
  datamodel_analysis: SharedDataModelResult | null;
  unused_asset_analysis: UnusedComponentResult | null;
  complexity_analysis: ComplexityAnalysisResult[];
}

/** Minimal shape the backend's global error handler / HTTPExceptions return. */
export interface AnalysisErrorResponse {
  detail: string;
}
