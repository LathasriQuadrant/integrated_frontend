import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as models from "powerbi-models";
import { service, factories } from "powerbi-client";
import { Loader2, CheckCircle2, XCircle, Globe, AlertTriangle, ArrowLeft, Clock, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";

import "powerbi-report-authoring";

/* ----------------------------------------------------
   📍 CONFIGURATION & CONSTANTS
   ---------------------------------------------------- */
const API_URL = "https://pbirupdatedcode-dzanbzhvdwhce5a6.eastus-01.azurewebsites.net/runtime-visuals";

const pbiService = new service.Service(factories.hpmFactory, factories.wpmpFactory, factories.routerFactory);

const DEFAULT_MEASURES_TABLE = "Measures1";

/* ----------------------------------------------------
   📦 API TYPES (visual-json API contract)
   Mirrors what createVisualsFromJson.js expects: bindings
   may carry a measure OR a column+aggregation, plus optional
   filters and visual-level properties. Pages may carry an
   explicit canvas size straight from the source report.
   ---------------------------------------------------- */
interface ApiBinding {
  table?: string;
  column?: string | null;
  measure?: string | null;
  aggregation?: string | null;
}

interface ApiFilter {
  table: string;
  column: string;
  operator?: string;
  values?: any[];
}

interface ApiProperty {
  objectName: string;
  propertyName: string;
  value: any;
}

interface ApiVisual {
  visualType: string;
  title: string;
  layout: {
    x: number;
    y: number;
    width: number;
    height: number;
    z?: number;
  };
  bindings: Record<string, ApiBinding | ApiBinding[]>;
  filters?: ApiFilter[];
  properties?: ApiProperty[];
}

interface ApiPage {
  name?: string | null;
  size?: { width: number; height: number } | null;
  visuals: ApiVisual[];
}

/* ----------------------------------------------------
   🎯 ROLE ENGINE (ported from createVisualsFromJson.js)
   Maps a semantic binding key (Category / Y / Series / ...)
   plus the visual's family (bar / line / kpi / gauge / ...)
   to the exact Power BI data-role name that visual expects.
   ---------------------------------------------------- */
const INTENT = {
  CATEGORY: "CATEGORY",
  SERIES: "SERIES",
  VALUE: "VALUE",
  SECONDARY_VALUE: "SECONDARY_VALUE",
  X: "X",
  Y: "Y",
  SIZE: "SIZE",
  TOOLTIP: "TOOLTIP",
  DETAILS: "DETAILS",
  BREAKDOWN: "BREAKDOWN",
  ROWS: "ROWS",
  COLUMNS: "COLUMNS",
  MIN: "MIN",
  MAX: "MAX",
  TARGET: "TARGET",
  INDICATOR: "INDICATOR",
  TREND: "TREND",
  GOAL: "GOAL",
  ANALYZE: "ANALYZE",
  EXPLAIN_BY: "EXPLAIN_BY",
  GRADIENT: "GRADIENT",
  PLAY_AXIS: "PLAY_AXIS",
  SMALL_MULTIPLES: "SMALL_MULTIPLES",
} as const;

type IntentKey = (typeof INTENT)[keyof typeof INTENT];

const FAMILY_OF_VISUAL_TYPE: Record<string, string> = {
  barChart: "bar", clusteredBarChart: "bar", hundredPercentStackedBarChart: "bar",
  columnChart: "bar", clusteredColumnChart: "bar", hundredPercentStackedColumnChart: "bar",
  lineChart: "line", areaChart: "line", stackedAreaChart: "line",
  lineClusteredColumnComboChart: "combo", lineStackedColumnComboChart: "combo",
  ribbonChart: "ribbon",
  pieChart: "pie", donutChart: "pie", funnel: "pie",
  treemap: "treemap",
  waterfallChart: "waterfall",
  scatterChart: "scatter",
  gauge: "gauge",
  kpi: "kpi",
  card: "card", multiRowCard: "card",
  tableEx: "table", table: "table",
  pivotTable: "matrix",
  slicer: "slicer",
  map: "map", filledMap: "filledMap", shapeMap: "shapeMap",
  decompositionTreeVisual: "decompositionTree", keyDriversVisual: "keyDrivers",
  actionButton: "noRoles", basicShape: "noRoles", image: "noRoles", textbox: "noRoles",
  qnaVisual: "noRoles", scriptVisual: "noRoles", pythonVisual: "noRoles",
  PowerApps: "noRoles", esriVisual: "noRoles", debugVisual: "noRoles",
};

const VISUAL_ROLE_SCHEMAS: Record<string, Partial<Record<IntentKey, string>>> = {
  bar: {
    [INTENT.CATEGORY]: "Category",
    [INTENT.SERIES]: "Series",
    [INTENT.VALUE]: "Y",
    [INTENT.TOOLTIP]: "Tooltips",
    [INTENT.SMALL_MULTIPLES]: "Small Multiples",
  },
  line: {
    [INTENT.CATEGORY]: "Category",
    [INTENT.SERIES]: "Series",
    [INTENT.VALUE]: "Y",
    [INTENT.SECONDARY_VALUE]: "Y2",
    [INTENT.TOOLTIP]: "Tooltips",
  },
  combo: {
    [INTENT.CATEGORY]: "Category",
    [INTENT.SERIES]: "Series",
    [INTENT.VALUE]: "Y",
    [INTENT.SECONDARY_VALUE]: "Y2",
  },
  ribbon: {
    [INTENT.CATEGORY]: "Category",
    [INTENT.SERIES]: "Series",
    [INTENT.VALUE]: "Y",
  },
  pie: {
    [INTENT.CATEGORY]: "Category",
    [INTENT.VALUE]: "Y",
    [INTENT.TOOLTIP]: "Tooltips",
  },
  treemap: {
    [INTENT.CATEGORY]: "Group",
    [INTENT.DETAILS]: "Details",
    [INTENT.VALUE]: "Values",
  },
  waterfall: {
    [INTENT.CATEGORY]: "Category",
    [INTENT.VALUE]: "Y",
    [INTENT.BREAKDOWN]: "Breakdown",
  },
  scatter: {
    [INTENT.CATEGORY]: "Category",
    [INTENT.DETAILS]: "Category",
    [INTENT.X]: "X",
    [INTENT.Y]: "Y",
    [INTENT.VALUE]: "Y",
    [INTENT.SIZE]: "Size",
    [INTENT.SERIES]: "Series",
    [INTENT.PLAY_AXIS]: "PlayAxis",
  },
  gauge: {
    [INTENT.VALUE]: "Y",
    [INTENT.MIN]: "MinValue",
    [INTENT.MAX]: "MaxValue",
    [INTENT.TARGET]: "TargetValue",
  },
  kpi: {
    [INTENT.INDICATOR]: "Indicator",
    [INTENT.VALUE]: "Indicator",
    [INTENT.TREND]: "TrendLine",
    [INTENT.GOAL]: "Goal",
    [INTENT.TARGET]: "Goal",
  },
  card: {
    [INTENT.VALUE]: "Values",
    [INTENT.TOOLTIP]: "Tooltips",
  },
  table: {
    [INTENT.VALUE]: "Values",
    [INTENT.CATEGORY]: "Values",
  },
  matrix: {
    [INTENT.ROWS]: "Rows",
    [INTENT.CATEGORY]: "Rows",
    [INTENT.COLUMNS]: "Columns",
    [INTENT.VALUE]: "Values",
  },
  slicer: {
    [INTENT.VALUE]: "Values",
    [INTENT.CATEGORY]: "Values",
  },
  map: {
    [INTENT.CATEGORY]: "Category",
    [INTENT.SERIES]: "Series",
    [INTENT.SIZE]: "Size",
  },
  filledMap: {
    [INTENT.CATEGORY]: "Category",
    [INTENT.GRADIENT]: "Gradient",
    [INTENT.VALUE]: "Gradient",
  },
  shapeMap: {
    [INTENT.CATEGORY]: "Category",
    [INTENT.VALUE]: "Values",
  },
  decompositionTree: {
    [INTENT.ANALYZE]: "Analyze",
    [INTENT.VALUE]: "Analyze",
    [INTENT.EXPLAIN_BY]: "Explainby",
    [INTENT.CATEGORY]: "Explainby",
  },
  keyDrivers: {
    [INTENT.ANALYZE]: "Explain by target",
    [INTENT.VALUE]: "Explain by target",
    [INTENT.EXPLAIN_BY]: "Explainby",
    [INTENT.CATEGORY]: "Explainby",
  },
  noRoles: {},
};

const INTENT_LOOKUP: Record<string, IntentKey | null> = {
  category: INTENT.CATEGORY, axis: INTENT.CATEGORY, dimension: INTENT.CATEGORY,
  series: INTENT.SERIES, legend: INTENT.SERIES,
  y: INTENT.VALUE, value: INTENT.VALUE, values: INTENT.VALUE, measure: INTENT.VALUE,
  y2: INTENT.SECONDARY_VALUE, secondary: INTENT.SECONDARY_VALUE, secondaryvalue: INTENT.SECONDARY_VALUE,
  x: INTENT.X, size: INTENT.SIZE,
  tooltip: INTENT.TOOLTIP, tooltips: INTENT.TOOLTIP,
  details: INTENT.DETAILS, detail: INTENT.DETAILS, group: INTENT.DETAILS,
  breakdown: INTENT.BREAKDOWN,
  rows: INTENT.ROWS, columns: INTENT.COLUMNS,
  minvalue: INTENT.MIN, min: INTENT.MIN,
  maxvalue: INTENT.MAX, max: INTENT.MAX,
  targetvalue: INTENT.TARGET, target: INTENT.TARGET,
  indicator: INTENT.INDICATOR,
  trendline: INTENT.TREND, trend: INTENT.TREND,
  goal: INTENT.GOAL,
  analyze: INTENT.ANALYZE,
  explainby: INTENT.EXPLAIN_BY, "explain by": INTENT.EXPLAIN_BY,
  gradient: INTENT.GRADIENT,
  playaxis: INTENT.PLAY_AXIS, "play axis": INTENT.PLAY_AXIS,
  smallmultiples: INTENT.SMALL_MULTIPLES, "small multiples": INTENT.SMALL_MULTIPLES,
  color: INTENT.SERIES, angle: INTENT.VALUE, text: INTENT.VALUE, label: INTENT.VALUE,
  path: null, shape: null,
};

function normalizeIntent(rawRoleKey: string, isMeasure: boolean): IntentKey {
  const key = String(rawRoleKey || "").trim().toLowerCase();
  if (key === "color" && isMeasure) return INTENT.GRADIENT;
  if (key in INTENT_LOOKUP) {
    const looked = INTENT_LOOKUP[key];
    if (looked) return looked;
  }
  return isMeasure ? INTENT.VALUE : INTENT.CATEGORY;
}

/**
 * Resolves a raw semantic binding key (e.g. "Category", "Y", "color") to the
 * exact Power BI data-role name expected by this specific visual type,
 * taking into account whether the field is a measure or a plain column.
 */
function resolveRoleName(semanticRole: string, isMeasure: boolean, visualType: string): string | null {
  const family = FAMILY_OF_VISUAL_TYPE[visualType];
  if (family === "noRoles") return null;
  const schema = VISUAL_ROLE_SCHEMAS[family || "table"];
  const intent = normalizeIntent(semanticRole, isMeasure);
  if (intent && schema[intent]) return schema[intent]!;
  const fallback = isMeasure
    ? schema[INTENT.VALUE] || schema[INTENT.Y] || Object.values(schema)[0]
    : schema[INTENT.CATEGORY] || schema[INTENT.ROWS] || Object.values(schema)[0];
  return fallback || null;
}

/** Normalizes loose aggregation strings ("avg", "countDistinct", ...) to the
 *  powerbi-models AggregationFunction enum value, when available. */
function normalizeAggregation(rawAgg?: string | null): any {
  if (!rawAgg) return undefined;
  const str = String(rawAgg).trim().toLowerCase();
  let standard = "Sum";

  if (str === "count" || str === "countnonnull") standard = "Count";
  else if (str === "distinctcount" || str === "countdistinct") standard = "DistinctCount";
  else if (str === "avg" || str === "average") standard = "Avg";
  else if (str === "min" || str === "minimum") standard = "Min";
  else if (str === "max" || str === "maximum") standard = "Max";
  else if (str === "median") standard = "Median";
  else if (str === "sum") standard = "Sum";
  else standard = rawAgg;

  const aggEnum = (models as any)?.AggregationFunction;
  if (aggEnum && aggEnum[standard] !== undefined) {
    return aggEnum[standard];
  }
  return standard;
}

/** Converts Power BI's EMU-scale layout coordinates (as used in the desktop
 *  file format) into on-canvas pixel coordinates, when needed. Layouts that
 *  are already pixel-scale (small numbers) pass through unchanged. */
function normalizeApiLayout(rawLayout: ApiVisual["layout"] | undefined) {
  const PBI_CANVAS_WIDTH = 1280;
  const PBI_CANVAS_HEIGHT = 720;

  if (!rawLayout) {
    return { x: 20, y: 20, width: 400, height: 300, z: 1 };
  }

  let { x = 0, y = 0, width = 400, height = 300 } = rawLayout;
  const { z = 1 } = rawLayout;

  if (x > 1280 || y > 720 || width > 1280 || height > 720) {
    x = Math.round((x / 100000) * PBI_CANVAS_WIDTH);
    y = Math.round((y / 100000) * PBI_CANVAS_HEIGHT);
    width = Math.round((width / 100000) * PBI_CANVAS_WIDTH);
    height = Math.round((height / 100000) * PBI_CANVAS_HEIGHT);
  }

  width = Math.max(width, 100);
  height = Math.max(height, 80);

  return { x, y, width, height, z };
}

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function PowerBIReport() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Initializing...");
  const [statusType, setStatusType] = useState<"loading" | "success" | "error" | "warning">("loading");
  const [source, setSource] = useState<"API" | "None">("None");

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  

  // Single toggle for both Lakehouse + Semantic Model
  const [scheduleEnabled, setScheduleEnabled] = useState(false);

  // Lakehouse interval
  const [lakehouseInterval, setLakehouseInterval] = useState("30");

  // Power BI schedule state
  const [selectedDays, setSelectedDays] = useState<string[]>(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  const [selectedHour, setSelectedHour] = useState("08");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedTimes, setSelectedTimes] = useState<string[]>(["08:00"]);

  const isEmbedding = useRef(false);
  const executed = useRef(false);

  /* ---------------- SESSION DATA ---------------- */
  const workspaceId = sessionStorage.getItem("workspace_id");
  const reportId = sessionStorage.getItem("upload_report_id");
  const datasetId = sessionStorage.getItem("upload_dataset_id");
  const metadataBlobUrl = sessionStorage.getItem("metadataOutputBlobUrl");
  const rawReportName = sessionStorage.getItem("report_name") || "sampletbl";

  const userToken = sessionStorage.getItem("access_token");

  const BACKEND_BASE_URL = "https://accesstokens-aecjbzaqaqcuh6bd.eastus-01.azurewebsites.net";

  /* ----------- DAY TOGGLE HELPER ----------- */
  const toggleDay = (day: string) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  /* ----------- SCHEDULE REFRESH ----------- */
  const handleScheduleRefresh = async () => {
    if (!rawReportName) {
      toast({ title: "Missing data", description: "Workbook name not found.", variant: "destructive" });
      return;
    }

    setScheduling(true);
    const errors: string[] = [];

    // 1. Lakehouse schedule
    try {
      const interval = Number(lakehouseInterval);
      const payload: Record<string, any> = {
        enable_scheduled_refresh: scheduleEnabled,
      };
      if (scheduleEnabled) {
        if (!interval || interval < 5) {
          throw new Error("Interval must be at least 5 minutes");
        }
        payload.interval_minutes = interval;
      }

      const LAKEHOUSE_BASE_URL = "https://live-data-lakehouse-erbghyatb6f4awgf.eastus-01.azurewebsites.net";
      const res = await fetch(
        `${LAKEHOUSE_BASE_URL}/api/v1/lakehouse/refresh/${encodeURIComponent(rawReportName)}/schedule`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }
    } catch (err: any) {
      errors.push(`Lakehouse: ${err.message}`);
    }

    // 2. Power BI refresh schedule
    if (datasetId && workspaceId) {
      try {
        const pbiPayload: Record<string, any> = {
          enabled: scheduleEnabled,
        };
        if (scheduleEnabled) {
          if (selectedDays.length === 0) throw new Error("Select at least one day");
          if (selectedTimes.length === 0) throw new Error("Select at least one time slot");
          pbiPayload.days = selectedDays;
          pbiPayload.times = selectedTimes;
          pbiPayload.timeZone = "UTC";
        }

        const res = await fetch(
          `${BACKEND_BASE_URL}/datasets/${encodeURIComponent(datasetId)}/refresh-schedule?workspace_id=${encodeURIComponent(workspaceId)}`,
          {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pbiPayload),
          },
        );

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || `HTTP ${res.status}`);
        }
      } catch (err: any) {
        errors.push(`Power BI: ${err.message}`);
      }
    }

    if (errors.length > 0) {
      toast({ title: "Schedule partially failed", description: errors.join("\n"), variant: "destructive" });
    } else {
      toast({
        title: "Schedule updated",
        description: "Both lakehouse and semantic model schedules have been configured.",
      });
      setScheduleOpen(false);
    }
    setScheduling(false);
  };

  /* ----------- REFRESH NOW ----------- */
  const handleRefreshNow = () => {
    if (!datasetId || !workspaceId) {
      toast({ title: "Missing data", description: "Dataset ID or Workspace ID not found.", variant: "destructive" });
      return;
    }

    toast({ title: "Refresh triggered", description: "Both semantic model and lakehouse refreshes started successfully." });

    // Fire-and-forget: don't block UI or affect report
    fetch(
      `${BACKEND_BASE_URL}/datasets/${encodeURIComponent(datasetId)}/refresh?workspace_id=${encodeURIComponent(workspaceId)}`,
      { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" } },
    ).catch(() => {});

    fetch(`${BACKEND_BASE_URL}/api/v1/lakehouse/refresh/${encodeURIComponent(rawReportName)}`, {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
    }).catch(() => {});
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  /* ----------- DATA MAPPING HELPERS ----------- */
  const cleanColumnName = (colName: string) => {
    if (!colName) return "";
    return colName.replace(/^(cnt|sum|avg|min|max|count|distinct):/i, "");
  };

  const normalizeType = (type: string) => {
    const map: Record<string, string> = {
      tableEx: "table",
      clusteredBarChart: "barChart",
      clusteredColumnChart: "columnChart",
      lineChart: "lineChart",
      pieChart: "pieChart",
      donutChart: "donutChart",
    };
    return map[type] || type;
  };

  /* ----------------------------------------------------
     📐 DYNAMIC CANVAS / GRID LAYOUT
     No hardcoded x/y. Canvas size and every visual's
     position are derived purely from how many visuals
     this specific page needs to hold.
     ---------------------------------------------------- */
  const GRID_GAP = 20;
  const MIN_CANVAS_WIDTH = 1280; // Power BI default page width
  const MIN_CANVAS_HEIGHT = 720; // Power BI default page height

  interface GridLayout {
    columns: number;
    rows: number;
    cellWidth: number;
    cellHeight: number;
    canvasWidth: number;
    canvasHeight: number;
  }

  /**
   * Computes a fresh grid layout for ONE page's worth of visuals.
   * Nothing here is shared across pages — call this once per page,
   * right before laying out that page's visuals, so every page's
   * geometry (columns, canvas size, cell size) is fully independent.
   */
  function computeGridLayout(pageVisuals: ApiVisual[]): GridLayout {
    const count = pageVisuals.length;

    if (count === 0) {
      return {
        columns: 1,
        rows: 1,
        cellWidth: 0,
        cellHeight: 0,
        canvasWidth: MIN_CANVAS_WIDTH,
        canvasHeight: MIN_CANVAS_HEIGHT,
      };
    }

    // Cell size = the largest visual on THIS page, so nothing gets clipped
    // or overlapped regardless of how the source visuals were sized.
    const cellWidth = Math.max(...pageVisuals.map((v) => v.layout?.width || 320));
    const cellHeight = Math.max(...pageVisuals.map((v) => v.layout?.height || 240));

    // Choose column count so the canvas trends toward a 16:9 canvas as the
    // visual count grows, instead of one hardcoded column/row shape.
    const targetAspectRatio = 16 / 9;
    const columns = Math.max(1, Math.round(Math.sqrt(count * targetAspectRatio)));
    const rows = Math.max(1, Math.ceil(count / columns));

    // Canvas grows with visual count (more visuals → bigger report page),
    // but never shrinks below Power BI's default page size.
    const canvasWidth = Math.max(MIN_CANVAS_WIDTH, columns * (cellWidth + GRID_GAP) + GRID_GAP);
    const canvasHeight = Math.max(MIN_CANVAS_HEIGHT, rows * (cellHeight + GRID_GAP) + GRID_GAP);

    return { columns, rows, cellWidth, cellHeight, canvasWidth, canvasHeight };
  }

  /** Binds every field in v.bindings/v.dataRoles onto the created `visual`,
   *  resolving the correct Power BI role name for measures vs. columns and
   *  carrying over the requested aggregation, with fallback-table retry. */
  async function bindVisualFields(
    visual: any,
    v: ApiVisual,
    knownGoodTables: Set<string>,
    getFallbackOrder: (excludeTable: string) => string[],
  ) {
    if (!v.bindings || typeof visual.addDataField !== "function") return;

    const bindingEntries = Object.entries(v.bindings);
    for (const [semanticRole, data] of bindingEntries) {
      if (semanticRole === "Filters") continue;
      const bindArray = Array.isArray(data) ? data : [data];

      for (const b of bindArray) {
        if (!b) continue;
        const isMeasure = Boolean(b.measure);
        const technicalRole = resolveRoleName(semanticRole, isMeasure, v.visualType);
        if (!technicalRole) continue;

        // ---- Measures ALWAYS bind against the "Measures1" table, no aggregation
        //      needed, and no fallback — this table name is fixed, never derived
        //      from the API's `table` field or from the fallback-table logic. ----
        if (isMeasure) {
          const measureTable = DEFAULT_MEASURES_TABLE;
          try {
            console.log(`🔗 Binding measure: role="${technicalRole}", table="${measureTable}", measure="${b.measure}"`);
            await visual.addDataField(technicalRole, {
              $schema: "http://powerbi.com/product/schema#measure",
              table: measureTable,
              measure: b.measure,
            });
            knownGoodTables.add(measureTable);
            console.log(`✅ Bound measure: ${measureTable}.${b.measure} → ${technicalRole}`);
          } catch (e: any) {
            console.warn(`⚠️ Measure binding failed for ${measureTable}.${b.measure} → ${technicalRole}:`, e?.message || e);
          }
          continue;
        }

        // ---- Columns bind against their source table, with an aggregation
        //      override on value-style roles (never on axis/category roles) ----
        const rawCol = b.column || "";
        const sanitizedCol = cleanColumnName(rawCol);
        if (!b.table || !sanitizedCol) continue;

        const axisRoles = new Set(["Category", "Rows", "Columns", "Group", "Details"]);
        const aggregationFunction = !axisRoles.has(technicalRole) && b.aggregation
          ? normalizeAggregation(b.aggregation)
          : undefined;

        let bound = false;
        console.log(
          `🔗 Binding: role="${technicalRole}", table="${b.table}", column="${sanitizedCol}"` +
            (aggregationFunction !== undefined ? `, aggregation="${b.aggregation}"` : ""),
        );
        try {
          await visual.addDataField(technicalRole, {
            $schema: "http://powerbi.com/product/schema#column",
            table: b.table,
            column: sanitizedCol,
            ...(aggregationFunction !== undefined ? { aggregationFunction } : {}),
          });
          bound = true;
          knownGoodTables.add(b.table);
          console.log(`✅ Bound successfully: ${b.table}.${sanitizedCol} → ${technicalRole}`);
        } catch (e: any) {
          console.warn(`⚠️ Binding failed for ${b.table}.${sanitizedCol} → ${technicalRole}:`, e?.message || e);
        }

        if (!bound) {
          for (const fallbackTable of getFallbackOrder(b.table)) {
            try {
              await visual.addDataField(technicalRole, {
                $schema: "http://powerbi.com/product/schema#column",
                table: fallbackTable,
                column: sanitizedCol,
                ...(aggregationFunction !== undefined ? { aggregationFunction } : {}),
              });
              bound = true;
              knownGoodTables.add(fallbackTable);
              console.log(`✅ Fallback bound: ${fallbackTable}.${sanitizedCol} → ${technicalRole}`);
              break;
            } catch (e: any) {
              console.warn(`⚠️ Fallback failed for ${fallbackTable}.${sanitizedCol}:`, e?.message || e);
            }
          }
        }

        if (!bound) {
          console.error(
            `❌ FAILED to bind column "${sanitizedCol}" (original: "${rawCol}") to any table. Tried: [${b.table}, ${getFallbackOrder(b.table).join(", ")}]`,
          );
        }
      }
    }
  }

  /** Applies BasicFilter entries from v.filters to the created visual. */
  async function applyVisualFilters(visual: any, v: ApiVisual) {
    if (!v.filters || v.filters.length === 0) return;
    if (typeof visual.setFilters !== "function" || !(models as any)?.BasicFilter) return;

    try {
      const basicFilters = v.filters.map(
        (f) =>
          new (models as any).BasicFilter(
            { table: f.table, column: f.column },
            f.operator || "In",
            f.values || [],
          ),
      );
      await visual.setFilters(basicFilters);
      console.log(`🧰 Applied ${basicFilters.length} filter(s) to "${v.title}"`);
    } catch (e: any) {
      console.warn(`⚠️ Filter error on "${v.title}":`, e?.message || e);
    }
  }

  /** Applies visual-level formatting properties (labelDisplayUnits, colors, etc). */
  async function applyVisualProperties(visual: any, v: ApiVisual) {
    if (!v.properties || v.properties.length === 0) return;
    if (typeof visual.setProperty !== "function") return;

    for (const prop of v.properties) {
      try {
        await visual.setProperty(
          { objectName: prop.objectName, propertyName: prop.propertyName },
          { value: prop.value },
        );
      } catch (e: any) {
        console.warn(`⚠️ Property "${prop.objectName}.${prop.propertyName}" failed on "${v.title}":`, e?.message || e);
      }
    }
  }

  async function createStaticVisuals(report: any) {
    if (executed.current) return;
    executed.current = true;
    console.group("🚀 Creating Visuals from API");

    const currentJobId = sessionStorage.getItem("current_migration_job_id");

    try {
      setStatus("Fetching visual configuration...");

      let visualsToCreate: ApiVisual[] = [];
      let dashboards: any[] = [];
      let apiPages: ApiPage[] = [];

      if (metadataBlobUrl) {
        try {
          const apiRes = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ metadataBlobPath: metadataBlobUrl }),
          });
          console.log(apiRes);

          if (apiRes.ok) {
            const data = await apiRes.json();
            visualsToCreate = data.visuals || [];
            dashboards = data.dashboards || [];
            // Newer visual-json API responses group visuals under `pages`,
            // each carrying an explicit canvas `size` straight from the
            // source report — prefer that over any client-computed layout.
            apiPages = Array.isArray(data.pages) ? data.pages : [];
            if (visualsToCreate.length > 0 || apiPages.length > 0) {
              setSource("API");
            }
          }
        } catch (e) {
          /* ignore */
        }
      }

      if (visualsToCreate.length === 0 && apiPages.length === 0) {
        setStatus("No visuals to create (Check API logs)");
        setStatusType("warning");

        if (currentJobId) {
          try {
            await fetch(
              `https://databasemanagement-e0e0d7bqhdg3gec7.eastus-01.azurewebsites.net/jobs/${currentJobId}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  MigrationStatus: "Failed",
                  ErrorMessage: "No visuals to create (Check API logs)",
                  CompletedAt: new Date().toISOString(),
                }),
              },
            );
          } catch (e) {
            console.error("Failed to update job status", e);
          }
        }

        console.groupEnd();
        return;
      }

      setStatus("Switching to Edit mode...");
      try {
        await report.switchMode(models.ViewMode.Edit);
      } catch (e) {
        /* ignore */
      }
      await sleep(1000);

      const cleanReportName = rawReportName.replace(/[^a-zA-Z0-9]/g, "");

      // Flatten every visual we know about (flat list + page-grouped list)
      // so table discovery below sees the full picture regardless of which
      // shape the API responded with.
      const allKnownVisuals: ApiVisual[] = [
        ...visualsToCreate,
        ...apiPages.flatMap((p) => p.visuals || []),
      ];

      /* ----------------------------------------------------
         🔎 DYNAMIC TABLE RESOLUTION (replaces hardcoded guesses)
         Instead of guessing generic names like "Sheet1"/"Table1"/"Extract"
         that will never match a real deployed model, we:
           1. Collect every real table name that actually appears in the
              extracted metadata (these came from your source data, so
              they're far more likely to be the real table names).
           2. Track which tables have already bound successfully this
              session ("known good") and try those FIRST on any later
              failure — they're proven to exist in the deployed model.
           3. Keep the old generic names only as a last-resort safety net.
         ---------------------------------------------------- */
      const metadataTables = new Set<string>();
      allKnownVisuals.forEach((v) => {
        Object.entries(v.bindings || {}).forEach(([key, data]) => {
          if (key === "Filters") return;
          const arr = Array.isArray(data) ? data : [data];
          arr.forEach((b: any) => {
            // Skip measure bindings — measures are strictly hardcoded to the
            // "Measures1" table and must never seed the column fallback pool.
            if (b?.measure) return;
            if (b?.table) metadataTables.add(b.table);
          });
        });
      });

      const knownGoodTables = new Set<string>();
      const GENERIC_LAST_RESORT = [rawReportName, cleanReportName, "Sheet1", "Table1", "Extract", "Data", "MainTable"];

      const getFallbackOrder = (excludeTable: string) => {
        const ordered = [...knownGoodTables, ...metadataTables, ...GENERIC_LAST_RESORT];
        return [...new Set(ordered)].filter((t) => t && t !== excludeTable);
      };

      let pages = await report.getPages();

      if (apiPages.length > 0) {
        /* ==========================================================
           📄 PAGE-DRIVEN FLOW — visual-json API returned `pages`, each
           with its own canvas `size` and its own visuals (already
           positioned). Canvas dimensions and visual coordinates both
           come straight from the JSON — nothing is recomputed here.
           ========================================================== */
        for (let i = 0; i < apiPages.length; i++) {
          const pageData = apiPages[i];
          const expectedPageName = pageData.name || `Page ${i + 1}`;
          let targetPage = pages[i];

          if (!targetPage) {
            targetPage = await report.addPage(expectedPageName);
            pages = await report.getPages();
          }

          setStatus(`Preparing ${expectedPageName}...`);

          await new Promise<void>((resolve) => {
            const handler = () => {
              report.off("pageChanged", handler);
              resolve();
            };
            report.on("pageChanged", handler);
            targetPage.setActive();
          });

          const page = await report.getActivePage();

          if (page.displayName !== expectedPageName) {
            try {
              await page.rename(expectedPageName);
            } catch (e) {
              console.warn(`Rename to ${expectedPageName} failed:`, e);
            }
          }

          try {
            const existingVisuals = await page.getVisuals();
            for (const v of existingVisuals) {
              try {
                await page.deleteVisual(v.name);
              } catch (e) {
                /* ignore */
              }
            }
          } catch (e) {
            /* ignore */
          }

          await sleep(500);

          // Canvas size comes directly from the JSON page size. Fall back to
          // Power BI's default page size only if the API didn't provide one.
          const canvasWidth = pageData.size?.width || 1280;
          const canvasHeight = pageData.size?.height || 720;

          setStatus(`Sizing canvas for ${expectedPageName} (${canvasWidth}x${canvasHeight})...`);
          try {
            await report.resizeActivePage(models.PageSizeType.Custom, canvasWidth, canvasHeight);
          } catch (e) {
            console.warn(`⚠️ Failed to resize ${expectedPageName} to ${canvasWidth}x${canvasHeight}:`, e);
          }

          for (const v of pageData.visuals || []) {
            const layout = normalizeApiLayout(v.layout);

            setStatus(`Creating ${v.visualType} on ${expectedPageName}...`);
            try {
              const { visual } = await page.createVisual(normalizeType(v.visualType), {
                x: layout.x,
                y: layout.y,
                width: layout.width,
                height: layout.height,
                z: layout.z,
                displayState: { mode: models.VisualContainerDisplayMode.Visible },
              });

              if (v.title) {
                try {
                  await visual.setProperty({ objectName: "title", propertyName: "titleText" }, { value: v.title });
                  await visual.setProperty({ objectName: "title", propertyName: "visible" }, { value: true });
                } catch (e) {
                  /* ignore */
                }
              }
              if (v.visualType === "card") {
                try {
                  await visual.setProperty({ objectName: "categoryLabel", propertyName: "show" }, { value: false });
                } catch (e) {
                  console.warn(`⚠️ categoryLabel hide failed for "${v.title}":`, e?.message || e);
                }
              }
              await sleep(200);

              await bindVisualFields(visual, v, knownGoodTables, getFallbackOrder);
              await applyVisualFilters(visual, v);
              await applyVisualProperties(visual, v);
            } catch (e: any) {
              console.error(`❌ Create failed for ${v.title}:`, e);
            }
          }
        }
      } else {
        /* ==========================================================
           📋 LEGACY FLOW — flat `visuals` + `dashboards[].worksheets`.
           No explicit canvas size was provided, so the canvas and each
           visual's position are computed from a grid layout, as before.
           ========================================================== */
        const visualMap = new Map<string, ApiVisual>();
        visualsToCreate.forEach((v) => visualMap.set(v.title, v));

        const assignedVisuals = new Set<string>();
        dashboards.forEach((d) => {
          (d.worksheets || []).forEach((w: string) => assignedVisuals.add(w));
        });

        const orphanWorksheets = visualsToCreate.filter((v) => !assignedVisuals.has(v.title)).map((v) => v.title);

        const pagesToProcess = dashboards.map((d) => ({
          worksheets: d.worksheets,
          isOrphan: false,
        }));

        if (orphanWorksheets.length > 0) {
          pagesToProcess.push({
            worksheets: orphanWorksheets,
            isOrphan: true,
          });
        }

        for (let i = 0; i < pagesToProcess.length; i++) {
          const config = pagesToProcess[i];
          const expectedPageName = `Page ${i + 1}`;
          let targetPage = pages[i];

          if (!targetPage) {
            targetPage = await report.addPage(expectedPageName);
            pages = await report.getPages();
          }

          setStatus(`Preparing ${expectedPageName}...`);

          await new Promise<void>((resolve) => {
            const handler = () => {
              report.off("pageChanged", handler);
              resolve();
            };
            report.on("pageChanged", handler);
            targetPage.setActive();
          });

          const page = await report.getActivePage();

          if (page.displayName !== expectedPageName) {
            try {
              await page.rename(expectedPageName);
            } catch (e) {
              console.warn(`Rename to ${expectedPageName} failed:`, e);
            }
          }

          try {
            const existingVisuals = await page.getVisuals();
            for (const v of existingVisuals) {
              try {
                await page.deleteVisual(v.name);
              } catch (e) {
                /* ignore */
              }
            }
          } catch (e) {
            /* ignore */
          }

          await sleep(500);

          // Resolve the actual ApiVisual objects that belong to THIS page only.
          const pageVisuals = config.worksheets
            .map((sheetName: string) => visualMap.get(sheetName))
            .filter((v): v is ApiVisual => Boolean(v));

          // Independent grid layout for this page — recomputed from scratch every
          // iteration, so no state (columns, cell size, canvas size) leaks between pages.
          const { columns, cellWidth, cellHeight, canvasWidth, canvasHeight } = computeGridLayout(pageVisuals);

          setStatus(`Sizing canvas for ${expectedPageName} (${pageVisuals.length} visuals)...`);
          try {
            await report.resizeActivePage(models.PageSizeType.Custom, canvasWidth, canvasHeight);
          } catch (e) {
            console.warn(`⚠️ Failed to resize ${expectedPageName} to ${canvasWidth}x${canvasHeight}:`, e);
          }

          let visualIndex = 0;

          for (const sheetName of config.worksheets) {
            const v = visualMap.get(sheetName);
            if (!v) continue;

            // Grid position derived purely from this visual's index on this page.
            const col = visualIndex % columns;
            const row = Math.floor(visualIndex / columns);
            const finalX = GRID_GAP + col * (cellWidth + GRID_GAP);
            const finalY = GRID_GAP + row * (cellHeight + GRID_GAP);
            visualIndex++;

            setStatus(`Creating ${v.visualType} on ${expectedPageName}...`);
            try {
              const { visual } = await page.createVisual(normalizeType(v.visualType), {
                x: finalX,
                y: finalY,
                width: v.layout.width,
                height: v.layout.height,
                displayState: { mode: models.VisualContainerDisplayMode.Visible },
              });

              if (v.title) {
                try {
                  await visual.setProperty({ objectName: "title", propertyName: "titleText" }, { value: v.title });
                  await visual.setProperty({ objectName: "title", propertyName: "visible" }, { value: true });
                } catch (e) {
                  /* ignore */
                }
              }

              if (v.visualType === "card") {
                try {
                  await visual.setProperty({ objectName: "categoryLabel", propertyName: "show" }, { value: false });
                } catch (e) {
                  console.warn(`⚠️ categoryLabel hide failed for "${v.title}":`, e?.message || e);
                }
              }
              await sleep(200);

              await bindVisualFields(visual, v, knownGoodTables, getFallbackOrder);
              await applyVisualFilters(visual, v);
              await applyVisualProperties(visual, v);
            } catch (e: any) {
              console.error(`❌ Create failed for ${sheetName}:`, e);
            }
          }
        }
      }

      await report.save();
      setStatus("Dashboards and Visuals generated successfully!");
      setStatusType("success");

      if (currentJobId) {
        try {
          await fetch(`https://databasemanagement-e0e0d7bqhdg3gec7.eastus-01.azurewebsites.net/jobs/${currentJobId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              MigrationStatus: "Completed",
              CompletedAt: new Date().toISOString(),
            }),
          });
        } catch (e) {
          console.error("Failed to update job status to Completed", e);
        }
      }
    } catch (err: any) {
      console.error("❌ Critical Error:", err);
      setStatus("Error: " + err.message);
      setStatusType("error");

      if (currentJobId) {
        try {
          await fetch(`https://databasemanagement-e0e0d7bqhdg3gec7.eastus-01.azurewebsites.net/jobs/${currentJobId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              MigrationStatus: "Failed",
              ErrorMessage: err.message || "Unknown error occurred during visual generation",
              CompletedAt: new Date().toISOString(),
            }),
          });
        } catch (e) {
          console.error("Failed to update job status to Failed", e);
        }
      }
    } finally {
      console.groupEnd();
    }
  }

  /* ----------- EMBED REPORT ----------- */
  useEffect(() => {
    let report: any;
    if (isEmbedding.current) return;
    isEmbedding.current = true;

    async function init() {
      console.group("🔍 DEBUG: Session Data");
      console.log("workspaceId:", workspaceId);
      console.log("reportId:", reportId);
      console.log("datasetId:", datasetId);
      console.log("metadataBlobUrl:", metadataBlobUrl);
      console.log("rawReportName:", rawReportName);
      console.groupEnd();

      if (!workspaceId || !reportId || !userToken) {
        setStatus("Missing Session Data or Auth Token");
        setStatusType("error");
        return;
      }

      try {
        if (containerRef.current) {
          pbiService.reset(containerRef.current);

          const builtEmbedUrl = `https://app.powerbi.com/reportEmbed?reportId=${reportId}&groupId=${workspaceId}`;

          const embedConfig = {
            type: "report",
            id: reportId,
            embedUrl: builtEmbedUrl,
            accessToken: userToken,
            tokenType: models.TokenType.Aad,
            permissions: models.Permissions.All,
            viewMode: models.ViewMode.Edit,
            settings: {
              panes: {
                fields: { visible: true, expanded: true },
                visualizations: { visible: true },
              },
            },
          };

          console.group("📋 DEBUG: Embed Configuration");
          console.log("tokenType:", models.TokenType.Aad, "(models.TokenType.Aad)");
          console.log("permissions:", models.Permissions.All, "(models.Permissions.All)");
          console.log("viewMode:", models.ViewMode.Edit, "(models.ViewMode.Edit)");
          console.log("report id:", reportId);
          console.log(
            "Full config (token redacted):",
            JSON.stringify({ ...embedConfig, accessToken: "[REDACTED]" }, null, 2),
          );
          console.groupEnd();

          report = pbiService.embed(containerRef.current, embedConfig);

          report.on("loaded", () => {
            console.log("✅ DEBUG: Report 'loaded' event fired");
          });

          report.on("rendered", () => {
            console.log("📊 DEBUG: Report 'rendered' event fired");
            createStaticVisuals(report);
          });

          let schemaDriftRetries = 0;
          const MAX_SCHEMA_DRIFT_RETRIES = 3;

          report.on("error", (e: any) => {
            console.group("❌ DEBUG: Power BI Error Event");
            console.error("Full error event:", JSON.stringify(e, null, 2));
            if (e.detail) {
              console.error("Error detail:", JSON.stringify(e.detail, null, 2));
              console.error("Message:", e.detail.message);
              console.error("Error code:", e.detail.errorCode);
              console.error("Level:", e.detail.level);
              if (e.detail.technicalDetails) {
                console.error("Technical Details:", JSON.stringify(e.detail.technicalDetails, null, 2));
                console.error("  RequestId:", e.detail.technicalDetails.requestId);
                console.error("  ErrorInfo:", e.detail.technicalDetails.errorInfo);
              }
              if (e.detail.activityId) console.error("ActivityId:", e.detail.activityId);
              if (e.detail.requestId) console.error("RequestId:", e.detail.requestId);
              if (e.detail.clusterUri) console.error("Cluster URI:", e.detail.clusterUri);
            }
            console.groupEnd();

            // "The key didn't match any rows in the table" / Mashup ErrorCode 10061
            // means the Lakehouse SQL Analytics Endpoint hadn't finished
            // materializing a table yet when the semantic model queried it.
            // This is a sync-lag issue, not a real error — retry with backoff
            // instead of surfacing a hard failure immediately.
            const msg: string = e?.detail?.detailedMessage || e?.detail?.message || "";
            const looksLikeLakehouseSyncLag = msg.includes("didn't match any rows") || msg.includes("ErrorCode = 10061");

            if (looksLikeLakehouseSyncLag && schemaDriftRetries < MAX_SCHEMA_DRIFT_RETRIES) {
              schemaDriftRetries += 1;
              setStatus(
                `Underlying table not ready yet in the Lakehouse — retrying (${schemaDriftRetries}/${MAX_SCHEMA_DRIFT_RETRIES})...`,
              );
              setStatusType("warning");
              setTimeout(() => {
                report.refresh().catch((err: any) => console.warn("Schema-drift retry refresh failed:", err));
              }, 5000 * schemaDriftRetries); // 5s, 10s, 15s backoff
              return;
            }

            setStatus("Power BI Error");
            setStatusType("error");
          });

          report.on("dataSelected", (e: any) => {
            console.log("📊 DEBUG: dataSelected event:", JSON.stringify(e, null, 2));
          });

          report.on("commandTriggered", (e: any) => {
            console.log("⚡ DEBUG: commandTriggered event:", JSON.stringify(e, null, 2));
          });

          const originalFetch = window.fetch;
          window.fetch = async function (...args: Parameters<typeof fetch>) {
            const url = typeof args[0] === "string" ? args[0] : (args[0] as Request).url;
            const isQueryData =
              url.includes("querydata") ||
              url.includes("QueryData") ||
              url.includes("conceptualschema") ||
              url.includes("explore");

            if (isQueryData) {
              console.group("🌐 DEBUG: PBI Network Request");
              console.log("URL:", url);
              console.log("Method:", (args[1] as RequestInit)?.method || "GET");
            }

            try {
              const response = await originalFetch.apply(this, args);

              if (isQueryData) {
                console.log("Status:", response.status, response.statusText);
                response.headers.forEach((value, key) => {
                  if (
                    key.toLowerCase().includes("requestid") ||
                    key.toLowerCase().includes("activityid") ||
                    key.toLowerCase().includes("x-powerbi") ||
                    key.toLowerCase().includes("cluster")
                  ) {
                    console.log(`  Header ${key}: ${value}`);
                  }
                });

                if (!response.ok) {
                  console.error("⚠️ QUERY DATA FAILURE!");
                  console.error("HTTP Status:", response.status);
                  try {
                    const cloned = response.clone();
                    const errorBody = await cloned.text();
                    console.error("Response Body:", errorBody);
                  } catch (readErr) {
                    console.error("Could not read error body:", readErr);
                  }
                }
                console.groupEnd();
              }

              return response;
            } catch (err) {
              if (isQueryData) {
                console.error("❌ NETWORK ERROR on querydata:", err);
                console.groupEnd();
              }
              throw err;
            }
          };
        }
      } catch (e: any) {
        console.error("❌ DEBUG: Init failed:", e);
        console.error("Stack:", e.stack);
        setStatus("Init failed: " + e.message);
        setStatusType("error");
      }
    }
    init();
  }, [workspaceId, reportId, datasetId, metadataBlobUrl, rawReportName, userToken]);

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 p-6 h-full">
        {/* Header Section */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/migration")}>
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold">Report Preview</h1>
        </div>

        {/* Status Bar */}
        <div
          className={`flex items-center gap-3 p-4 rounded-lg border shadow-sm transition-all duration-300 ${
            statusType === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : statusType === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : statusType === "warning"
                  ? "bg-amber-50 border-amber-200 text-amber-700"
                  : "bg-white border-blue-100 text-slate-700"
          }`}
        >
          {statusType === "loading" && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
          {statusType === "success" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
          {statusType === "error" && <XCircle className="h-5 w-5 text-red-600" />}
          {statusType === "warning" && <AlertTriangle className="h-5 w-5 text-amber-600" />}

          <div className="flex flex-col flex-1">
            <span className="text-sm font-semibold uppercase tracking-wider opacity-70">System Status</span>
            <span className="font-medium">{status}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/50 rounded-full border border-black/5 text-xs font-medium">
            <Globe className="h-3 w-3" />
            Config Source: {source}
          </div>
        </div>

        {/* Refresh Buttons - shown after success */}
        {statusType === "success" && (
          <div className="flex justify-end gap-2">
            <Button onClick={handleRefreshNow} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh Now
            </Button>
            <Button onClick={() => setScheduleOpen(true)} className="gap-2">
              <Clock className="h-4 w-4" />
              Schedule Refresh
            </Button>
          </div>
        )}

        {/* Power BI Container */}
        <div className="relative flex-1 w-full min-h-[600px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div ref={containerRef} className="h-full w-full" />
        </div>
      </div>

      {/* Schedule Refresh Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Refresh</DialogTitle>
            <DialogDescription>
              Configure refresh schedules for <strong>{rawReportName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* ─── Single Toggle for Both ─── */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <span className="text-sm font-semibold">Enable Scheduled Refresh</span>
                <p className="text-xs text-muted-foreground">
                  {scheduleEnabled
                    ? "Both Lakehouse and Semantic Model refresh are active"
                    : "Scheduled refresh is off"}
                </p>
              </div>
              <Switch checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
            </div>

            {scheduleEnabled && (
              <>
                {/* ─── Lakehouse Interval ─── */}
                <div className="space-y-3 rounded-lg border p-4">
                  <span className="text-sm font-semibold">Lakehouse Refresh Interval</span>
                  <Select value={lakehouseInterval} onValueChange={setLakehouseInterval}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">Every 5 minutes</SelectItem>
                      <SelectItem value="10">Every 10 minutes</SelectItem>
                      <SelectItem value="30">Every 30 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* ─── Semantic Model Schedule ─── */}
                <div className="space-y-4 rounded-lg border p-4">
                  <span className="text-sm font-semibold">Semantic Model Schedule</span>

                  {/* Days selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Days</label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_DAYS.map((day) => (
                        <label key={day} className="flex items-center gap-1.5 cursor-pointer">
                          <Checkbox checked={selectedDays.includes(day)} onCheckedChange={() => toggleDay(day)} />
                          <span className="text-sm">{day.slice(0, 3)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Time selection via dropdowns */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Add Time Slot (UTC)</label>
                    <div className="flex items-center gap-2">
                      <Select value={selectedHour} onValueChange={setSelectedHour}>
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-sm font-medium">:</span>
                      <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Min" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="00">00</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const time = `${selectedHour}:${selectedMinute}`;
                          if (!selectedTimes.includes(time)) {
                            setSelectedTimes((prev) => [...prev, time].sort());
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Selected time slots */}
                  {selectedTimes.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Selected Time Slots</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedTimes.map((time) => (
                          <span
                            key={time}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                          >
                            {time}
                            <button
                              type="button"
                              onClick={() => setSelectedTimes((prev) => prev.filter((t) => t !== time))}
                              className="ml-1 rounded-full hover:bg-primary/20 p-0.5"
                            >
                              <XCircle className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{selectedTimes.length} time slot(s) selected</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleRefresh} disabled={scheduling}>
              {scheduling && <Loader2 className="h-4 w-4 animate-spin" />}
              {scheduling ? "Scheduling..." : "Set Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
