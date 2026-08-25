import { TreeNode } from "@/types/migration";

interface BackendProject {
  id: string;
  name: string;
  owner?: { id: string };
  description?: string;
  parent_id?: string | null;
}

interface BackendWorkbook {
  id: string;
  name: string;
  project?: { id: string; name: string };
  project_id?: string;
}

interface BackendView {
  id: string;
  name: string;
  workbook_id?: string;
  workbook?: { id: string };
}

interface BackendDatasource {
  id: string;
  name: string;
  project?: { id: string; name: string };
  project_id?: string;
}

interface BackendData {
  projects: BackendProject[];
  workbooks: BackendWorkbook[];
  views?: BackendView[];
  datasources?: BackendDatasource[];
}

/**
 * Converts backend Tableau JSON into TreeNode[]
 */
export function buildTableauTree(data: BackendData): TreeNode[] {
  const projectMap: Record<string, TreeNode> = {};
  const workbookMap: Record<string, TreeNode> = {};

  /* ------------------------
     ROOT NODE
  ------------------------ */
  const root: TreeNode = {
    id: "tableau-root",
    name: "Tableau Server",
    type: "repository",
    children: [],
  };

  /* ------------------------
     PROJECTS
  ------------------------ */
  data.projects.forEach((project) => {
    projectMap[project.id] = {
      id: project.id,
      name: project.name,
      type: "project",
      children: [],
    };
  });

  /* Attach projects to root */
  Object.values(projectMap).forEach((projectNode) => {
    root.children!.push(projectNode);
  });

  /* ------------------------
     WORKBOOKS
  ------------------------ */
  data.workbooks.forEach((wb) => {
    const wbNode: TreeNode = {
      id: wb.id,
      name: wb.name,
      type: "workbook",
      children: [],
    };

    workbookMap[wb.id] = wbNode;

    // Handle both formats: project.id or project_id
    const projectId = wb.project?.id || wb.project_id;
    if (projectId) {
      const parentProject = projectMap[projectId];
      if (parentProject) {
        parentProject.children!.push(wbNode);
      }
    }
  });

  /* ------------------------
     VIEWS (Reports/Dashboards)
  ------------------------ */
  if (data.views) {
    data.views.forEach((view) => {
      const viewNode: TreeNode = {
        id: view.id,
        name: view.name,
        type: "report",
      };

      const workbookId = view.workbook?.id || view.workbook_id;
      if (workbookId) {
        const parentWorkbook = workbookMap[workbookId];
        if (parentWorkbook) {
          parentWorkbook.children!.push(viewNode);
        }
      }
    });
  }

  /* ------------------------
     DATASOURCES
  ------------------------ */
  if (data.datasources) {
    data.datasources.forEach((ds) => {
      const dsNode: TreeNode = {
        id: ds.id,
        name: ds.name,
        type: "dashboard",
        metadata: { isDatasource: true },
      };

      const projectId = ds.project?.id || ds.project_id;
      if (projectId) {
        const parentProject = projectMap[projectId];
        if (parentProject) {
          parentProject.children!.push(dsNode);
        }
      }
    });
  }

  return [root];
}
