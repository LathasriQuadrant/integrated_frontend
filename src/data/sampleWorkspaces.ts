import { PowerBIWorkspace, PowerBIReport, PowerBIDataset, PowerBIDashboard } from '@/types/migration';

export const sampleWorkspaces: PowerBIWorkspace[] = [
  {
    id: 'ws-1',
    name: 'Enterprise Analytics',
    type: 'workspace',
    isReadOnly: false,
  },
  {
    id: 'ws-2',
    name: 'Sales Department',
    type: 'workspace',
    isReadOnly: false,
  },
  {
    id: 'ws-3',
    name: 'Finance Reports',
    type: 'workspace',
    isReadOnly: false,
  },
  {
    id: 'ws-4',
    name: 'Marketing Insights',
    type: 'workspace',
    isReadOnly: true,
  },
  {
    id: 'ws-5',
    name: 'My Workspace',
    type: 'personal',
    isReadOnly: false,
  },
];

export const sampleReports: Record<string, PowerBIReport[]> = {
  'ws-1': [
    { id: 'rpt-1', name: 'Executive Dashboard', datasetId: 'ds-1', createdDateTime: '2024-01-15' },
    { id: 'rpt-2', name: 'KPI Overview', datasetId: 'ds-2', createdDateTime: '2024-02-20' },
  ],
  'ws-2': [
    { id: 'rpt-3', name: 'Regional Sales', datasetId: 'ds-3', createdDateTime: '2024-03-10' },
    { id: 'rpt-4', name: 'Pipeline Analysis', datasetId: 'ds-4', createdDateTime: '2024-03-25' },
  ],
  'ws-3': [
    { id: 'rpt-5', name: 'Budget Tracker', datasetId: 'ds-5', createdDateTime: '2024-01-05' },
  ],
  'ws-4': [],
  'ws-5': [
    { id: 'rpt-6', name: 'Personal Dashboard', datasetId: 'ds-6', createdDateTime: '2024-04-01' },
  ],
};

export const sampleDatasets: Record<string, PowerBIDataset[]> = {
  'ws-1': [
    { id: 'ds-1', name: 'Enterprise Data Model', configuredBy: 'admin@contoso.com', createdDate: '2024-01-10' },
    { id: 'ds-2', name: 'KPI Dataset', configuredBy: 'analyst@contoso.com', createdDate: '2024-02-15' },
  ],
  'ws-2': [
    { id: 'ds-3', name: 'Sales Data', configuredBy: 'sales@contoso.com', createdDate: '2024-03-05' },
    { id: 'ds-4', name: 'CRM Dataset', configuredBy: 'sales@contoso.com', createdDate: '2024-03-20' },
  ],
  'ws-3': [
    { id: 'ds-5', name: 'Financial Model', configuredBy: 'finance@contoso.com', createdDate: '2024-01-02' },
  ],
  'ws-4': [],
  'ws-5': [
    { id: 'ds-6', name: 'Personal Data', configuredBy: 'user@contoso.com', createdDate: '2024-03-28' },
  ],
};

export const sampleDashboards: Record<string, PowerBIDashboard[]> = {
  'ws-1': [
    { id: 'dash-1', name: 'Executive Summary', isReadOnly: false },
  ],
  'ws-2': [
    { id: 'dash-2', name: 'Sales Overview', isReadOnly: false },
  ],
  'ws-3': [],
  'ws-4': [],
  'ws-5': [],
};
