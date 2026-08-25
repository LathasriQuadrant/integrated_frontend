import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileBarChart, LayoutDashboard, Database, Box } from 'lucide-react';
import { TreeNode } from '@/types/migration';
import { cn } from '@/lib/utils';

interface TreeViewProps {
  nodes: TreeNode[];
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
}

const getIcon = (type: TreeNode['type'], isExpanded: boolean) => {
  switch (type) {
    case 'repository':
      return <Database className="w-4 h-4 text-primary" />;
    case 'folder':
      return isExpanded ? (
        <FolderOpen className="w-4 h-4 text-warning" />
      ) : (
        <Folder className="w-4 h-4 text-warning" />
      );
    case 'project':
      return <Box className="w-4 h-4 text-info" />;
    case 'workbook':
      return <FileBarChart className="w-4 h-4 text-accent-foreground" />;
    case 'report':
      return <FileBarChart className="w-4 h-4 text-success" />;
    case 'dashboard':
      return <LayoutDashboard className="w-4 h-4 text-primary" />;
    default:
      return <Folder className="w-4 h-4" />;
  }
};

interface TreeNodeItemProps {
  node: TreeNode;
  level: number;
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
  expandedNodes: Set<string>;
  onToggle: (id: string) => void;
}

const TreeNodeItem = ({ node, level, selectedId, onSelect, expandedNodes, onToggle }: TreeNodeItemProps) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedId === node.id;
  const isSelectable = node.type === 'report' || node.type === 'dashboard' || node.type === 'workbook';

  const handleClick = () => {
    if (hasChildren) {
      onToggle(node.id);
    }
    if (isSelectable) {
      onSelect(node);
    }
  };

  return (
    <div className="tree-expand">
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
          "hover:bg-accent/50",
          isSelected && "bg-accent text-accent-foreground font-medium",
          !isSelectable && "cursor-default"
        )}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        <span className="w-4 h-4 flex items-center justify-center shrink-0">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )
          ) : null}
        </span>
        {getIcon(node.type, isExpanded)}
        <span className="truncate">{node.name}</span>
        {isSelectable && (
          <span className="ml-auto text-xs text-muted-foreground capitalize">{node.type}</span>
        )}
      </button>

      {hasChildren && isExpanded && (
        <div className="tree-expand">
          {node.children!.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TreeView = ({ nodes, selectedId, onSelect }: TreeViewProps) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['repo-1', 'folder-1']));

  const handleToggle = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="py-2">
      {nodes.map((node) => (
        <TreeNodeItem
          key={node.id}
          node={node}
          level={0}
          selectedId={selectedId}
          onSelect={onSelect}
          expandedNodes={expandedNodes}
          onToggle={handleToggle}
        />
      ))}
    </div>
  );
};

export default TreeView;
