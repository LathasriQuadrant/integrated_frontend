// ==============================
// Migration core enums & types
// ==============================

export type MigrationSource = "tableau" | "microstrategy" | "sapbo" | "cognos";

export type MigrationStatus = "pending" | "running" | "completed" | "failed";

export type AzureAppStatus = "checking" | "not_detected" | "detected" | "error";

// ==============================
// Migration execution
// ==============================

export interface MigrationStep {
  id: string;
  name: string;
  description: string;
  status: MigrationStatus;
  startTime?: Date;
  endTime?: Date;
  errorMessage?: string;
}

export interface MigrationRecord {
  id: string;
  sourceSystem: MigrationSource;
  sourcePath: string;
  reportName: string;
  status: MigrationStatus;
  startedAt: Date;
  completedAt?: Date;
  powerBILink?: string;
  workspaceName?: string;
  steps?: MigrationStep[];
}

// ==============================
// Tree / Repository structure
// ==============================

export interface TreeNode {
  id: string;
  name: string;
  type: "repository" | "folder" | "project" | "workbook" | "report" | "dashboard";
  children?: TreeNode[];
  expanded?: boolean;
  metadata?: Record<string, any>;
}

// ==============================
// User
// ==============================

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: "admin" | "user";
}

// ==============================
// Tableau backend API (NEW)
// ==============================

export interface TableauSigninRequest {
  username: string;
  password: string;
  site_content_url?: string;
}

export interface TableauSigninResponse {
  api_token: string;
}

export interface TableauTokenContext {
  apiToken: string;
  expiresAt?: Date;
}

export interface TableauProject {
  project_id: string;
  project_name: string;
  workbooks: TableauWorkbook[];
  datasources: TableauDatasource[];
}

export interface TableauWorkbook {
  workbook_id: string;
  workbook_name: string;
  views?: TableauView[];
}

export interface TableauView {
  id: string;
  name: string;
}

export interface TableauDatasource {
  datasource_id: string;
  datasource_name: string;
}

// ==============================
// Workbook download
// ==============================

export interface WorkbookDownloadRequest {
  api_token: string;
  workbook_id: string;
  file_name?: string;
}

export interface WorkbookDownloadResult {
  success: boolean;
  fileName: string;
  downloadUrl?: string;
  errorMessage?: string;
}

// ==============================
// Power BI Workspace types
// ==============================

export interface PowerBIWorkspace {
  id: string;
  name: string;
  type: "personal" | "workspace";
  isReadOnly: boolean;
}

export interface PowerBIDataset {
  id: string;
  name: string;
  configuredBy: string;
  createdDate: string;
}

export interface PowerBIReport {
  id: string;
  name: string;
  datasetId: string;
  createdDateTime: string;
}

export interface PowerBIDashboard {
  id: string;
  name: string;
  isReadOnly: boolean;
}

// ==============================
// Workspace validation
// ==============================

export interface WorkspaceValidation {
  workspaceId: string;
  appStatus: AzureAppStatus;
  hasReadPermission: boolean;
  hasWritePermission: boolean;
  errorMessage?: string;
}

// ==============================
// Migration execution payloads
// ==============================

export interface StartMigrationRequest {
  source: MigrationSource;
  apiToken: string;
  workbookId: string;
  targetWorkspaceId: string;
}

export interface StartMigrationResponse {
  migrationId: string;
  status: MigrationStatus;
}

export interface MigrationStatusResponse {
  migrationId: string;
  status: MigrationStatus;
  steps: MigrationStep[];
}
