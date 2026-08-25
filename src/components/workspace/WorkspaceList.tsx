import { Briefcase, User, Lock, ChevronRight } from 'lucide-react';
import { PowerBIWorkspace } from '@/types/migration';
import { cn } from '@/lib/utils';

interface WorkspaceListProps {
  workspaces: PowerBIWorkspace[];
  selectedId: string | null;
  onSelect: (workspace: PowerBIWorkspace) => void;
}

const WorkspaceList = ({ workspaces, selectedId, onSelect }: WorkspaceListProps) => {
  return (
    <div className="divide-y divide-border">
      {workspaces.map((workspace) => (
        <button
          key={workspace.id}
          onClick={() => !workspace.isReadOnly && onSelect(workspace)}
          disabled={workspace.isReadOnly}
          className={cn(
            "w-full flex items-center gap-3 p-4 text-left transition-colors",
            "hover:bg-accent/50",
            selectedId === workspace.id && "bg-accent border-l-2 border-l-primary",
            workspace.isReadOnly && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
            workspace.type === 'personal' ? "bg-secondary" : "bg-primary/10"
          )}>
            {workspace.type === 'personal' ? (
              <User className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Briefcase className="w-5 h-5 text-primary" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground truncate">
                {workspace.name}
              </span>
              {workspace.isReadOnly && (
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </div>
            <span className="text-xs text-muted-foreground capitalize">
              {workspace.type === 'personal' ? 'Personal Workspace' : 'Shared Workspace'}
            </span>
          </div>

          {!workspace.isReadOnly && (
            <ChevronRight className={cn(
              "w-4 h-4 text-muted-foreground transition-colors",
              selectedId === workspace.id && "text-primary"
            )} />
          )}
        </button>
      ))}
    </div>
  );
};

export default WorkspaceList;
