import { AnalysisApiError } from "./analysisApi";

const TABLEAU_BACKEND_URL = "https://frame-premigration-test-cabfgrazgacqgzf9.eastus-01.azurewebsites.net";

/**
 * Response from /discovery endpoint
 */
export interface DiscoveryResponse {
  workbooks: {
    workbook_metadata: {
      id: string;
      name: string;
      description: string;
      owner: string;
      project: string;
      created_at: string;
      updated_at: string;
      published_at: string;
      revisions: Array<{
        revision_number: string;
        published_at: string;
        publisher: string;
        current: boolean;
      }>;
    };
    reports: {
      workbooks: Array<{ id: string; name: string }>;
      dashboards: Array<{
        id: string;
        name: string;
        content_url: string;
        worksheets_contained: string[];
      }>;
      worksheets: Array<{
        id: string;
        name: string;
        content_url: string;
      }>;
    };
    usage: {
      view_counts: Array<{
        view_id: string;
        view_name: string;
        total_views: number;
      }>;
      view_statistics: Array<{
        view_id: string;
        view_name: string;
        total_view_count: number;
      }>;
      user_activity: Array<any>;
      subscriptions: Array<any>;
      permissions: Array<any>;
    };
    data_model: {
      datasources: Array<{
        name: string;
        caption: string;
        type: string;
      }>;
      databases: Array<{
        name: string;
        server: string;
        type: string;
      }>;
      schemas: Array<{
        database: string;
        schema: string;
      }>;
      tables: Array<any>;
      relationships: Array<any>;
      joins: Array<any>;
      connections: Array<any>;
      custom_sql: Array<any>;
    };
    fields: {
      dimensions: Array<{
        datasource: string;
        name: string;
        caption: string;
        role: string;
        data_type: string;
        default_aggregation: string;
        is_calculated: boolean;
      }>;
      measures: Array<{
        datasource: string;
        name: string;
        caption: string;
        role: string;
        data_type: string;
        default_aggregation: string;
        is_calculated: boolean;
      }>;
      calculated_fields: Array<any>;
    };
    kpis: Array<any>;
    dependencies: {
      upstream: Array<any>;
      downstream: Array<any>;
      workbook_dependencies: Array<any>;
      shared_datasources: Array<any>;
    };
    components: {
      dashboards: Array<any>;
      worksheets: Array<any>;
      filters: Array<any>;
      parameters: Array<any>;
      actions: Array<any>;
    };
    mappings: {
      datasource_to_reports: { [key: string]: string[] };
      dashboard_to_datasources: { [key: string]: string[] };
      mapping_metrics: {
        reports_per_datasource: { [key: string]: number };
        datasources_per_dashboard: { [key: string]: number };
        shared_datasources: number;
        shared_tables: number;
      };
    };
    visuals: {
      dashboards: Array<any>;
      orphan_worksheets: Array<any>;
    };
  }[];
}

/**
 * Payload for /discovery endpoint
 */
interface DiscoveryRequest {
  username?: string;
  password?: string;
  api_token?: string;
  site_content_url: string;
  workbook_ids?: string[];
  include_twbx_parsing: boolean;
}

/**
 * Discovery API - Calls /discovery endpoint to get workbook metadata
 * 
 * Usage:
 * - Option A: Use API token (from existing Tableau session)
 * - Option B: Use username/password for direct auth
 */
export async function getWorkbookDiscovery(
  params: {
    apiToken?: string;
    username?: string;
    password?: string;
    workbookIds?: string[];
    siteContentUrl?: string;
  },
  signal?: AbortSignal,
): Promise<DiscoveryResponse> {
  // Validate auth method
  if (!params.apiToken && (!params.username || !params.password)) {
    throw new AnalysisApiError("Must provide either api_token or username+password");
  }

  const body: DiscoveryRequest = {
    ...(params.apiToken && { api_token: params.apiToken }),
    ...(params.username && { username: params.username }),
    ...(params.password && { password: params.password }),
    site_content_url: params.siteContentUrl || "",
    workbook_ids: params.workbookIds && params.workbookIds.length > 0 ? params.workbookIds : undefined,
    include_twbx_parsing: true,
  };

  let response: Response;
  try {
    response = await fetch(`${TABLEAU_BACKEND_URL}/discovery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new AnalysisApiError("Could not reach the discovery backend. Is it running?");
  }

  if (!response.ok) {
    let errorDetail = "Failed to fetch workbook discovery";
    try {
      const errorData = await response.json();
      errorDetail = errorData.detail || errorData.message || errorDetail;
    } catch {
      // If response body is not JSON, use status text
      errorDetail = `${response.status}: ${response.statusText}`;
    }
    throw new AnalysisApiError(errorDetail, response.status);
  }

  return (await response.json()) as DiscoveryResponse;
}

/**
 * Transform discovery response to artifact count summary
 */
export function getArtifactCounts(discovery: DiscoveryResponse) {
  const workbook = discovery.workbooks[0];
  if (!workbook) {
    return null;
  }

  return {
    dashboards: workbook.reports.dashboards?.length ?? 0,
    worksheets: workbook.reports.worksheets?.length ?? 0,
    datasources: workbook.data_model.datasources?.length ?? 0,
    dimensions: workbook.fields.dimensions?.length ?? 0,
    measures: workbook.fields.measures?.length ?? 0,
    calculatedFields: workbook.fields.calculated_fields?.length ?? 0,
    kpis: workbook.kpis?.length ?? 0,
  };
}

export const discoveryApi = { getWorkbookDiscovery, getArtifactCounts };
