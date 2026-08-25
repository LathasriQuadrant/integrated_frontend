import { AnalyzeRequest, FullAnalysisResponse } from "@/types/analysis";

// Same integrated backend as the existing /tableau routes.
// Override with VITE_TABLEAU_BACKEND_URL for a non-local deployment.
const TABLEAU_BACKEND_URL = "https://frame-premigration-test-cabfgrazgacqgzf9.eastus-01.azurewebsites.net";

export class AnalysisApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "AnalysisApiError";
    this.status = status;
  }
}

async function parseErrorDetail(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.detail === "string") return data.detail;
    return JSON.stringify(data);
  } catch {
    return response.statusText || `Request failed with status ${response.status}`;
  }
}

/**
 * POST /analyze — end-to-end orchestration (discovery + AI analysis) for
 * one or more Tableau workbooks. Reuses the existing Tableau session
 * (api_token from POST /tableau/signin) so the user never re-authenticates.
 *
 * Omit `workbook_ids` to analyze every workbook on the site; pass one or
 * more LUIDs to scope the run to specific workbooks (single or multi).
 */
export async function analyzeWorkbooks(
  params: {
    apiToken: string;
    workbookIds?: string[];
    siteContentUrl?: string;
  },
  signal?: AbortSignal,
): Promise<FullAnalysisResponse> {
  const body: AnalyzeRequest = {
    api_token: params.apiToken,
    site_content_url: params.siteContentUrl || "",
    workbook_ids: params.workbookIds && params.workbookIds.length > 0 ? params.workbookIds : undefined,
    include_twbx_parsing: true,
    run_usage_analysis: true,
    run_kpi_analysis: true,
    run_datamodel_analysis: true,
    run_unused_asset_analysis: true,
    run_complexity_analysis: true,
  };

  let response: Response;
  try {
    response = await fetch(`${TABLEAU_BACKEND_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new AnalysisApiError("Could not reach the analysis backend. Is it running?");
  }

  if (!response.ok) {
    const detail = await parseErrorDetail(response);
    throw new AnalysisApiError(detail, response.status);
  }

  return (await response.json()) as FullAnalysisResponse;
}

export const analysisApi = { analyzeWorkbooks };
