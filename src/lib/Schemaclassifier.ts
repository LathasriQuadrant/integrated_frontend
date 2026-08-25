/**
 * Classifies a data model's shape (star / snowflake / hybrid / etc.) from
 * its table-relationship graph alone, using standard dimensional-modeling
 * heuristics:
 *
 *  - A "fact" table is a hub: the node with a degree well above the
 *    graph's average, i.e. many dimensions point at it.
 *  - Star:      the hub's dimensions are all leaves (connect only to the
 *               hub, not to each other) — the classic flat star.
 *  - Snowflake: none of the hub's dimensions are leaves — every one is
 *               itself normalized into further sub-dimension tables.
 *  - Hybrid:    a mix of both — some dimensions connect straight to the
 *               hub, others are chained into sub-dimensions.
 *  - Galaxy:    more than one comparably-sized hub — multiple subject
 *               areas/fact tables sharing a dimension pool.
 *  - Many-to-Many / Denormalized / Single Table / No Relationships: the
 *    remaining shapes that don't fit a hub-and-spoke pattern.
 *
 * This is a heuristic reading of the discovered relationships, not a
 * guarantee — it's meant to give a quick "how will this migrate" signal,
 * not a certified classification.
 */

export type SchemaShape =
  | "star"
  | "snowflake"
  | "hybrid"
  | "galaxy"
  | "many_to_many"
  | "denormalized"
  | "single_table"
  | "no_relationships"
  | "not_available";

export interface SchemaClassification {
  shape: SchemaShape;
  label: string;
  description: string;
  /** Table(s) identified as the fact/hub table(s), if any. */
  factTables: Set<string>;
}

interface Edge {
  left?: string;
  right?: string;
}

const isConnected = (nodes: string[], adjacency: Map<string, Set<string>>): boolean => {
  if (nodes.length === 0) return true;
  const visited = new Set<string>();
  const stack = [nodes[0]];
  while (stack.length) {
    const current = stack.pop()!;
    if (visited.has(current)) continue;
    visited.add(current);
    adjacency.get(current)?.forEach((next) => {
      if (!visited.has(next)) stack.push(next);
    });
  }
  return visited.size === nodes.length;
};

export function classifySchema(tableNames: string[], edges: Edge[]): SchemaClassification {
  const NOT_AVAILABLE: SchemaClassification = {
    shape: "not_available",
    label: "Not available",
    description: "No tables were discovered for this workbook.",
    factTables: new Set(),
  };
  if (tableNames.length === 0) return NOT_AVAILABLE;

  if (tableNames.length === 1) {
    return {
      shape: "single_table",
      label: "Single Table",
      description: "Only one table — nothing to relate, so there's no schema shape to classify.",
      factTables: new Set(),
    };
  }

  const adjacency = new Map<string, Set<string>>();
  tableNames.forEach((t) => adjacency.set(t, new Set()));
  const seenEdges = new Set<string>();
  let edgeCount = 0;
  edges.forEach(({ left, right }) => {
    if (!left || !right || left === right) return;
    if (!adjacency.has(left) || !adjacency.has(right)) return;
    const key = [left, right].sort().join("::");
    if (seenEdges.has(key)) return;
    seenEdges.add(key);
    adjacency.get(left)!.add(right);
    adjacency.get(right)!.add(left);
    edgeCount += 1;
  });

  if (edgeCount === 0) {
    return {
      shape: "no_relationships",
      label: "No Relationships",
      description: "Tables exist but no relationships were defined between them.",
      factTables: new Set(),
    };
  }

  const n = tableNames.length;
  const degree = (t: string) => adjacency.get(t)?.size ?? 0;
  const maxDegree = Math.max(...tableNames.map(degree));
  const avgDegree = (edgeCount * 2) / n;

  // A "hub" needs a real degree lead over the average connectivity, not
  // just the highest number in a graph where everything's degree ~1-2.
  const hubs = tableNames.filter((t) => degree(t) === maxDegree && maxDegree > 1 && maxDegree >= avgDegree * 1.3);

  const isTree = edgeCount === n - 1 && isConnected(tableNames, adjacency);

  if (hubs.length === 0) {
    return edgeCount >= n
      ? {
          shape: "many_to_many",
          label: "Many-to-Many",
          description: "Multiple tables are cross-linked without one dominant central table.",
          factTables: new Set(),
        }
      : {
          shape: "denormalized",
          label: "Denormalized",
          description: "Tables link directly to each other with no clear central fact table.",
          factTables: new Set(),
        };
  }

  if (hubs.length > 1) {
    return {
      shape: "galaxy",
      label: "Galaxy Schema",
      description: `${hubs.length} comparably-connected tables act as fact tables, sharing dimensions across subject areas.`,
      factTables: new Set(hubs),
    };
  }

  const hub = hubs[0];
  const hubNeighbors = Array.from(adjacency.get(hub) ?? []);
  const leafNeighbors = hubNeighbors.filter((t) => degree(t) === 1);
  const normalizedNeighbors = hubNeighbors.filter((t) => degree(t) > 1);

  if (!isTree) {
    return {
      shape: "many_to_many",
      label: "Many-to-Many",
      description: `"${hub}" is the primary fact table, but some dimensions cross-link to each other instead of following a strict hierarchy.`,
      factTables: new Set([hub]),
    };
  }

  if (normalizedNeighbors.length === 0) {
    return {
      shape: "star",
      label: "Star Schema",
      description: `"${hub}" sits at the center with every dimension table connected directly to it.`,
      factTables: new Set([hub]),
    };
  }

  if (leafNeighbors.length === 0) {
    return {
      shape: "snowflake",
      label: "Snowflake Schema",
      description: `"${hub}"'s dimension tables are further normalized into sub-dimension tables.`,
      factTables: new Set([hub]),
    };
  }

  return {
    shape: "hybrid",
    label: "Hybrid (Star + Snowflake)",
    description: `"${hub}" has a mix of dimensions connected directly and dimensions normalized into sub-dimensions.`,
    factTables: new Set([hub]),
  };
}