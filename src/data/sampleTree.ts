import { TreeNode } from '@/types/migration';

export const sampleTableauTree: TreeNode[] = [
  {
    id: 'repo-1',
    name: 'Tableau Server',
    type: 'repository',
    children: [
      {
        id: 'folder-1',
        name: 'Sales & Marketing',
        type: 'folder',
        children: [
          {
            id: 'project-1',
            name: 'Q4 2024 Analytics',
            type: 'project',
            children: [
              {
                id: 'workbook-1',
                name: 'Sales Overview',
                type: 'workbook',
                children: [
                  { id: 'report-1', name: 'Regional Performance', type: 'report' },
                  { id: 'dashboard-1', name: 'Executive Summary', type: 'dashboard' },
                  { id: 'report-2', name: 'Product Analysis', type: 'report' },
                ],
              },
              {
                id: 'workbook-2',
                name: 'Marketing Metrics',
                type: 'workbook',
                children: [
                  { id: 'dashboard-2', name: 'Campaign Dashboard', type: 'dashboard' },
                  { id: 'report-3', name: 'Lead Funnel', type: 'report' },
                ],
              },
            ],
          },
          {
            id: 'project-2',
            name: 'Customer Insights',
            type: 'project',
            children: [
              {
                id: 'workbook-3',
                name: 'Customer 360',
                type: 'workbook',
                children: [
                  { id: 'dashboard-3', name: 'Customer Overview', type: 'dashboard' },
                  { id: 'report-4', name: 'Churn Analysis', type: 'report' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'folder-2',
        name: 'Finance',
        type: 'folder',
        children: [
          {
            id: 'project-3',
            name: 'Financial Reporting',
            type: 'project',
            children: [
              {
                id: 'workbook-4',
                name: 'P&L Dashboard',
                type: 'workbook',
                children: [
                  { id: 'report-5', name: 'Income Statement', type: 'report' },
                  { id: 'report-6', name: 'Balance Sheet', type: 'report' },
                  { id: 'dashboard-4', name: 'Financial KPIs', type: 'dashboard' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'folder-3',
        name: 'Operations',
        type: 'folder',
        children: [
          {
            id: 'project-4',
            name: 'Supply Chain',
            type: 'project',
            children: [
              {
                id: 'workbook-5',
                name: 'Inventory Management',
                type: 'workbook',
                children: [
                  { id: 'dashboard-5', name: 'Stock Levels', type: 'dashboard' },
                  { id: 'report-7', name: 'Supplier Performance', type: 'report' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];
