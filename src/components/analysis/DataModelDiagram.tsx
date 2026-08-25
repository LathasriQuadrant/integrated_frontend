import { useMemo } from "react";
import { classifySchema, SchemaShape } from "@/lib/Schemaclassifier";
import RationaleTooltip from "./Rationaletooltip";

interface RelationshipEntry {
  left_table?: string;
  right_table?: string;
  left_column?: string;
  right_column?: string;
  type?: string;
  operator?: string;
}

interface TableEntry {
  name?: string;
  table?: string;
}

interface DataModelDiagramProps {
  tables: TableEntry[];
  relationships: RelationshipEntry[];
  /** Table names (from the cross-workbook Shared Data Model analysis)
   * that are also referenced by other workbooks' datasources — rendered
   * with a distinct "Shared" treatment so this workbook's schema reads
   * in the context of the wider portfolio, not in isolation. */
  sharedTableNames?: Set<string>;
}

const NODE_WIDTH = 168;
const NODE_HEIGHT = 46;
const H_GAP = 96;
const V_GAP = 72;
const PADDING = 24;

const tableLabel = (t: TableEntry): string => t.name?.trim() || t.table?.trim() || "";

/** Badge color per schema shape — greener/simpler shapes read as
 * lower migration risk, more tangled shapes read as higher. */
const shapeToneClasses: Record<SchemaShape, string> = {
  star: "bg-success/10 text-success border-success/20",
  snowflake: "bg-primary/10 text-primary border-primary/20",
  hybrid: "bg-warning/10 text-warning border-warning/20",
  galaxy: "bg-warning/10 text-warning border-warning/20",
  many_to_many: "bg-destructive/10 text-destructive border-destructive/20",
  denormalized: "bg-muted text-muted-foreground border-border",
  single_table: "bg-muted text-muted-foreground border-border",
  no_relationships: "bg-muted text-muted-foreground border-border",
  not_available: "bg-muted text-muted-foreground border-border",
};

const DataModelDiagram = ({ tables, relationships, sharedTableNames }: DataModelDiagramProps) => {
  const nodeNames = useMemo(() => {
    const names = new Set<string>();
    tables.forEach((t) => {
      const label = tableLabel(t);
      if (label) names.add(label);
    });
    relationships.forEach((r) => {
      if (r.left_table) names.add(r.left_table);
      if (r.right_table) names.add(r.right_table);
    });
    return Array.from(names);
  }, [tables, relationships]);

  const classification = useMemo(
    () =>
      classifySchema(
        nodeNames,
        relationships.map((r) => ({ left: r.left_table, right: r.right_table })),
      ),
    [nodeNames, relationships],
  );

  const columns = Math.max(1, Math.ceil(Math.sqrt(nodeNames.length || 1)));

  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    nodeNames.forEach((name, i) => {
      const col = i % columns;
      const row = Math.floor(i / columns);
      map.set(name, {
        x: col * (NODE_WIDTH + H_GAP) + NODE_WIDTH / 2 + PADDING,
        y: row * (NODE_HEIGHT + V_GAP) + NODE_HEIGHT / 2 + PADDING,
      });
    });
    return map;
  }, [nodeNames, columns]);

  if (nodeNames.length === 0) {
    return <p className="text-sm text-muted-foreground italic">Not available</p>;
  }

  const rows = Math.ceil(nodeNames.length / columns);
  const width = columns * (NODE_WIDTH + H_GAP) - H_GAP + PADDING * 2;
  const height = rows * (NODE_HEIGHT + V_GAP) - V_GAP + PADDING * 2;
  const hasSharedInfo = !!sharedTableNames && sharedTableNames.size > 0;
  const hasFactTables = classification.factTables.size > 0;

  return (
    <div className="border border-border rounded-lg bg-muted/20 overflow-auto">
      {/* Header: schema-shape badge always shown, legend rows only when relevant */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3 py-2 border-b border-border text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${shapeToneClasses[classification.shape]}`}
          >
            {classification.label}
          </span>
          <RationaleTooltip text={classification.description} />
        </span>
        {hasFactTables && (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "hsl(var(--warning))" }} /> Fact table
          </span>
        )}
        {hasSharedInfo && (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-card" style={{ background: "hsl(var(--powerbi))" }} /> Shared across workbooks
          </span>
        )}
      </div>
      <svg width={width} height={height} className="block min-w-full">
        {/* Relationship lines, drawn first so nodes sit on top */}
        {relationships.map((r, i) => {
          const from = r.left_table ? positions.get(r.left_table) : undefined;
          const to = r.right_table ? positions.get(r.right_table) : undefined;
          if (!from || !to || from === to) return null;
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          const typeLabel = r.type || r.operator;
          const columnLabel = r.left_column && r.right_column ? `${r.left_column} = ${r.right_column}` : "";

          return (
            <g key={i}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="hsl(var(--border))"
                strokeWidth={1.5}
              />
              <circle cx={from.x} cy={from.y} r={3} fill="hsl(var(--primary))" />
              <circle cx={to.x} cy={to.y} r={3} fill="hsl(var(--primary))" />
              <g transform={`translate(${midX}, ${midY})`}>
                <rect
                  x={-52}
                  y={columnLabel ? -18 : -9}
                  width={104}
                  height={columnLabel ? 36 : 18}
                  rx={4}
                  fill="hsl(var(--card))"
                  stroke="hsl(var(--border))"
                />
                {typeLabel && (
                  <text textAnchor="middle" dy={columnLabel ? -4 : 4} fontSize={9} fontWeight={600} fill="hsl(var(--muted-foreground))">
                    {typeLabel.length > 16 ? `${typeLabel.slice(0, 15)}…` : typeLabel}
                  </text>
                )}
                {columnLabel && (
                  <text textAnchor="middle" dy={11} fontSize={8.5} fontFamily="monospace" fill="hsl(var(--primary))">
                    {columnLabel.length > 22 ? `${columnLabel.slice(0, 21)}…` : columnLabel}
                  </text>
                )}
              </g>
            </g>
          );
        })}

        {/* Table nodes */}
        {nodeNames.map((name) => {
          const pos = positions.get(name)!;
          const truncated = name.length > 22 ? `${name.slice(0, 21)}…` : name;
          const isShared = sharedTableNames?.has(name);
          const isFact = classification.factTables.has(name);
          const accent = isFact ? "hsl(var(--warning))" : isShared ? "hsl(var(--powerbi))" : "hsl(var(--primary))";
          const headerFill = isFact
            ? "hsl(var(--warning) / 0.18)"
            : isShared
              ? "hsl(var(--powerbi) / 0.18)"
              : "hsl(var(--primary) / 0.12)";
          const headerText = isFact
            ? "hsl(var(--warning))"
            : isShared
              ? "hsl(var(--powerbi-foreground))"
              : "hsl(var(--primary))";
          const kindLabel = isFact ? "FACT" : "TABLE";
          return (
            <g key={name} transform={`translate(${pos.x - NODE_WIDTH / 2}, ${pos.y - NODE_HEIGHT / 2})`}>
              <title>{name}</title>
              <rect
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx={6}
                fill="hsl(var(--card))"
                stroke={accent}
                strokeWidth={isFact ? 1.75 : 1.25}
              />
              <rect width={NODE_WIDTH} height={16} rx={6} fill={headerFill} />
              <rect y={10} width={NODE_WIDTH} height={6} fill={headerFill} />
              <text x={10} y={11} fontSize={8} fontWeight={600} letterSpacing={0.5} fill={headerText}>
                {kindLabel}
              </text>
              <text x={10} y={33} fontSize={11.5} fontWeight={500} fill="hsl(var(--foreground))">
                {truncated}
              </text>
              {/* Shared-across-workbooks marker — independent of fact/dimension
                  styling, so a table can read as both at once. */}
              {isShared && (
                <circle cx={NODE_WIDTH - 8} cy={8} r={3.5} fill="hsl(var(--powerbi))" stroke="hsl(var(--card))" strokeWidth={1} />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default DataModelDiagram;