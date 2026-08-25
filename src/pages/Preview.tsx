// import { useEffect, useRef, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import * as models from "powerbi-models";
// import { service, factories } from "powerbi-client";
// import { Loader2, CheckCircle2, XCircle, Globe, AlertTriangle, ArrowLeft, Clock, RefreshCw } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Switch } from "@/components/ui/switch";
// import { Checkbox } from "@/components/ui/checkbox";

// import { useToast } from "@/hooks/use-toast";
// import AppLayout from "@/components/layout/AppLayout";

// import "powerbi-report-authoring";

// /* ----------------------------------------------------
//    📍 CONFIGURATION & CONSTANTS
//    ---------------------------------------------------- */
// const API_URL = "https://visuals-json-gdfth9dsbmhrgcb0.eastus-01.azurewebsites.net/runtime-visuals";

// const pbiService = new service.Service(factories.hpmFactory, factories.wpmpFactory, factories.routerFactory);

// interface ApiBinding {
//   table: string;
//   column: string;
// }

// interface ApiVisual {
//   visualType: string;
//   title: string;
//   layout: {
//     x: number;
//     y: number;
//     width: number;
//     height: number;
//   };
//   bindings: Record<string, ApiBinding | ApiBinding[]>;
// }

// const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// export default function PowerBIReport() {
//   const navigate = useNavigate();
//   const { toast } = useToast();

//   const containerRef = useRef<HTMLDivElement>(null);
//   const [status, setStatus] = useState("Initializing...");
//   const [statusType, setStatusType] = useState<"loading" | "success" | "error" | "warning">("loading");
//   const [source, setSource] = useState<"API" | "None">("None");

//   const [scheduleOpen, setScheduleOpen] = useState(false);
//   const [scheduling, setScheduling] = useState(false);
  

//   // Single toggle for both Lakehouse + Semantic Model
//   const [scheduleEnabled, setScheduleEnabled] = useState(false);

//   // Lakehouse interval
//   const [lakehouseInterval, setLakehouseInterval] = useState("30");

//   // Power BI schedule state
//   const [selectedDays, setSelectedDays] = useState<string[]>(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
//   const [selectedHour, setSelectedHour] = useState("08");
//   const [selectedMinute, setSelectedMinute] = useState("00");
//   const [selectedTimes, setSelectedTimes] = useState<string[]>(["08:00"]);

//   const isEmbedding = useRef(false);
//   const executed = useRef(false);

//   /* ---------------- SESSION DATA ---------------- */
//   const workspaceId = sessionStorage.getItem("workspace_id");
//   const reportId = sessionStorage.getItem("upload_report_id");
//   const datasetId = sessionStorage.getItem("upload_dataset_id");
//   const metadataBlobUrl = sessionStorage.getItem("metadataOutputBlobUrl");
//   const rawReportName = sessionStorage.getItem("report_name") || "sampletbl";

//   const userToken = sessionStorage.getItem("access_token");

//   const BACKEND_BASE_URL = "https://accesstokens-aecjbzaqaqcuh6bd.eastus-01.azurewebsites.net";

//   /* ----------- DAY TOGGLE HELPER ----------- */
//   const toggleDay = (day: string) => {
//     setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
//   };

//   /* ----------- SCHEDULE REFRESH ----------- */
//   const handleScheduleRefresh = async () => {
//     if (!rawReportName) {
//       toast({ title: "Missing data", description: "Workbook name not found.", variant: "destructive" });
//       return;
//     }

//     setScheduling(true);
//     const errors: string[] = [];

//     // 1. Lakehouse schedule
//     try {
//       const interval = Number(lakehouseInterval);
//       const payload: Record<string, any> = {
//         enable_scheduled_refresh: scheduleEnabled,
//       };
//       if (scheduleEnabled) {
//         if (!interval || interval < 5) {
//           throw new Error("Interval must be at least 5 minutes");
//         }
//         payload.interval_minutes = interval;
//       }

//       const LAKEHOUSE_BASE_URL = "https://live-data-lakehouse-erbghyatb6f4awgf.eastus-01.azurewebsites.net";
//       const res = await fetch(
//         `${LAKEHOUSE_BASE_URL}/api/v1/lakehouse/refresh/${encodeURIComponent(rawReportName)}/schedule`,
//         {
//           method: "PATCH",
//           credentials: "include",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload),
//         },
//       );

//       if (!res.ok) {
//         const errText = await res.text();
//         throw new Error(errText || `HTTP ${res.status}`);
//       }
//     } catch (err: any) {
//       errors.push(`Lakehouse: ${err.message}`);
//     }

//     // 2. Power BI refresh schedule
//     if (datasetId && workspaceId) {
//       try {
//         const pbiPayload: Record<string, any> = {
//           enabled: scheduleEnabled,
//         };
//         if (scheduleEnabled) {
//           if (selectedDays.length === 0) throw new Error("Select at least one day");
//           if (selectedTimes.length === 0) throw new Error("Select at least one time slot");
//           pbiPayload.days = selectedDays;
//           pbiPayload.times = selectedTimes;
//           pbiPayload.timeZone = "UTC";
//         }

//         const res = await fetch(
//           `${BACKEND_BASE_URL}/datasets/${encodeURIComponent(datasetId)}/refresh-schedule?workspace_id=${encodeURIComponent(workspaceId)}`,
//           {
//             method: "PATCH",
//             credentials: "include",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(pbiPayload),
//           },
//         );

//         if (!res.ok) {
//           const errText = await res.text();
//           throw new Error(errText || `HTTP ${res.status}`);
//         }
//       } catch (err: any) {
//         errors.push(`Power BI: ${err.message}`);
//       }
//     }

//     if (errors.length > 0) {
//       toast({ title: "Schedule partially failed", description: errors.join("\n"), variant: "destructive" });
//     } else {
//       toast({
//         title: "Schedule updated",
//         description: "Both lakehouse and semantic model schedules have been configured.",
//       });
//       setScheduleOpen(false);
//     }
//     setScheduling(false);
//   };

//   /* ----------- REFRESH NOW ----------- */
//   const handleRefreshNow = () => {
//     if (!datasetId || !workspaceId) {
//       toast({ title: "Missing data", description: "Dataset ID or Workspace ID not found.", variant: "destructive" });
//       return;
//     }

//     toast({ title: "Refresh triggered", description: "Both semantic model and lakehouse refreshes started successfully." });

//     // Fire-and-forget: don't block UI or affect report
//     fetch(
//       `${BACKEND_BASE_URL}/datasets/${encodeURIComponent(datasetId)}/refresh?workspace_id=${encodeURIComponent(workspaceId)}`,
//       { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" } },
//     ).catch(() => {});

//     fetch(`${BACKEND_BASE_URL}/api/v1/lakehouse/refresh/${encodeURIComponent(rawReportName)}`, {
//       method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
//     }).catch(() => {});
//   };

//   const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

//   /* ----------- DATA MAPPING HELPERS ----------- */
//   const cleanColumnName = (colName: string) => {
//     if (!colName) return "";
//     return colName.replace(/^(cnt|sum|avg|min|max|count|distinct):/i, "");
//   };

//   const mapRoleName = (visualType: string, semanticRole: string): string => {
//     const type = visualType.toLowerCase();
//     const role = semanticRole.toLowerCase();

//     if (type.includes("table") || type.includes("matrix")) return "Values";

//     if (
//       type.includes("bar") ||
//       type.includes("column") ||
//       type.includes("line") ||
//       type.includes("area") ||
//       type.includes("scatter")
//     ) {
//       if (role === "category" || role === "axis") return "Category";
//       if (role === "values" || role === "y") return "Y";
//       if (role === "legend" || role === "series") return "Series";
//       if (type.includes("scatter") && role === "x") return "X";
//     }

//     if (type.includes("pie") || type.includes("donut")) {
//       if (role === "legend" || role === "category") return "Category";
//       if (role === "values") return "Y";
//     }

//     return semanticRole;
//   };

//   const normalizeType = (type: string) => {
//     const map: Record<string, string> = {
//       tableEx: "table",
//       clusteredBarChart: "barChart",
//       clusteredColumnChart: "columnChart",
//       lineChart: "lineChart",
//       pieChart: "pieChart",
//       donutChart: "donutChart",
//     };
//     return map[type] || type;
//   };

//   async function createStaticVisuals(report: any) {
//     if (executed.current) return;
//     executed.current = true;
//     console.group("🚀 Creating Visuals from API");

//     const currentJobId = sessionStorage.getItem("current_migration_job_id");

//     try {
//       setStatus("Fetching visual configuration...");

//       let visualsToCreate: ApiVisual[] = [];
//       let dashboards: any[] = [];

//       if (metadataBlobUrl) {
//         try {
//           const apiRes = await fetch(API_URL, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ metadataBlobPath: metadataBlobUrl }),
//           });
//           console.log(apiRes);

//           if (apiRes.ok) {
//             const data = await apiRes.json();
//             visualsToCreate = data.visuals || [];
//             dashboards = data.dashboards || [];
//             if (visualsToCreate.length > 0) {
//               setSource("API");
//             }
//           }
//         } catch (e) {
//           /* ignore */
//         }
//       }

//       if (visualsToCreate.length === 0) {
//         setStatus("No visuals to create (Check API logs)");
//         setStatusType("warning");

//         if (currentJobId) {
//           try {
//             await fetch(
//               `https://databasemanagement-e0e0d7bqhdg3gec7.eastus-01.azurewebsites.net/jobs/${currentJobId}`,
//               {
//                 method: "PUT",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                   MigrationStatus: "Failed",
//                   ErrorMessage: "No visuals to create (Check API logs)",
//                   CompletedAt: new Date().toISOString(),
//                 }),
//               },
//             );
//           } catch (e) {
//             console.error("Failed to update job status", e);
//           }
//         }

//         console.groupEnd();
//         return;
//       }

//       setStatus("Switching to Edit mode...");
//       try {
//         await report.switchMode(models.ViewMode.Edit);
//       } catch (e) {
//         /* ignore */
//       }
//       await sleep(1000);

//       const visualMap = new Map<string, ApiVisual>();
//       visualsToCreate.forEach((v) => visualMap.set(v.title, v));

//       const assignedVisuals = new Set<string>();
//       dashboards.forEach((d) => {
//         d.worksheets.forEach((w: string) => assignedVisuals.add(w));
//       });

//       const orphanWorksheets = visualsToCreate.filter((v) => !assignedVisuals.has(v.title)).map((v) => v.title);

//       const pagesToProcess = dashboards.map((d) => ({
//         worksheets: d.worksheets,
//         isOrphan: false,
//       }));

//       if (orphanWorksheets.length > 0) {
//         pagesToProcess.push({
//           worksheets: orphanWorksheets,
//           isOrphan: true,
//         });
//       }

//       const cleanReportName = rawReportName.replace(/[^a-zA-Z0-9]/g, "");
//       const FALLBACK_TABLES = [rawReportName, cleanReportName, "Sheet1", "Table1", "Extract", "Data", "MainTable"];
//       const uniqueFallbacks = [...new Set(FALLBACK_TABLES)];

//       let pages = await report.getPages();

//       for (let i = 0; i < pagesToProcess.length; i++) {
//         const config = pagesToProcess[i];
//         const expectedPageName = `Page ${i + 1}`;
//         let targetPage = pages[i];

//         if (!targetPage) {
//           targetPage = await report.addPage(expectedPageName);
//           pages = await report.getPages();
//         }

//         setStatus(`Preparing ${expectedPageName}...`);

//         await new Promise<void>((resolve) => {
//           const handler = () => {
//             report.off("pageChanged", handler);
//             resolve();
//           };
//           report.on("pageChanged", handler);
//           targetPage.setActive();
//         });

//         const page = await report.getActivePage();

//         if (page.displayName !== expectedPageName) {
//           try {
//             await page.rename(expectedPageName);
//           } catch (e) {
//             console.warn(`Rename to ${expectedPageName} failed:`, e);
//           }
//         }

//         try {
//           const existingVisuals = await page.getVisuals();
//           for (const v of existingVisuals) {
//             try {
//               await page.deleteVisual(v.name);
//             } catch (e) {
//               /* ignore */
//             }
//           }
//         } catch (e) {
//           /* ignore */
//         }

//         await sleep(500);

//         let currentOrphanY = 40;

//         for (const sheetName of config.worksheets) {
//           const v = visualMap.get(sheetName);
//           if (!v) continue;

//           let finalX = v.layout.x;
//           let finalY = v.layout.y;

//           if (config.isOrphan) {
//             finalX = 40;
//             finalY = currentOrphanY;
//             currentOrphanY += v.layout.height + 20;
//           }

//           setStatus(`Creating ${v.visualType} on ${expectedPageName}...`);
//           try {
//             const { visual } = await page.createVisual(normalizeType(v.visualType), {
//               x: finalX,
//               y: finalY,
//               width: v.layout.width,
//               height: v.layout.height,
//               displayState: { mode: models.VisualContainerDisplayMode.Visible },
//             });

//             if (v.title) {
//               try {
//                 await visual.setProperty({ objectName: "title", propertyName: "text" }, { value: v.title });
//                 await visual.setProperty({ objectName: "title", propertyName: "visible" }, { value: true });
//               } catch (e) {
//                 /* ignore */
//               }
//             }
//             await sleep(200);

//             const bindingEntries = Object.entries(v.bindings);
//             for (const [semanticRole, data] of bindingEntries) {
//               const technicalRole = mapRoleName(v.visualType, semanticRole);
//               const bindArray = Array.isArray(data) ? data : [data];

//               for (const b of bindArray) {
//                 const rawCol = b?.column || "";
//                 const sanitizedCol = cleanColumnName(rawCol);

//                 if (b && b.table && sanitizedCol) {
//                   let bound = false;
//                   console.log(`🔗 Binding: role="${technicalRole}", table="${b.table}", column="${sanitizedCol}"`);
//                   try {
//                     await visual.addDataField(technicalRole, {
//                       $schema: "http://powerbi.com/product/schema#column",
//                       table: b.table,
//                       column: sanitizedCol,
//                     });
//                     bound = true;
//                     console.log(`✅ Bound successfully: ${b.table}.${sanitizedCol} → ${technicalRole}`);
//                   } catch (e: any) {
//                     console.warn(`⚠️ Binding failed for ${b.table}.${sanitizedCol} → ${technicalRole}:`, e?.message || e);
//                   }

//                   if (!bound) {
//                     for (const fallbackTable of uniqueFallbacks) {
//                       if (fallbackTable === b.table) continue;
//                       try {
//                         await visual.addDataField(technicalRole, {
//                           $schema: "http://powerbi.com/product/schema#column",
//                           table: fallbackTable,
//                           column: sanitizedCol,
//                         });
//                         bound = true;
//                         console.log(`✅ Fallback bound: ${fallbackTable}.${sanitizedCol} → ${technicalRole}`);
//                         break;
//                       } catch (e: any) {
//                         console.warn(`⚠️ Fallback failed for ${fallbackTable}.${sanitizedCol}:`, e?.message || e);
//                       }
//                     }
//                   }

//                   if (!bound) {
//                     console.error(`❌ FAILED to bind column "${sanitizedCol}" (original: "${rawCol}") to any table. Tried: [${b.table}, ${uniqueFallbacks.join(', ')}]`);
//                   }
//                 }
//               }
//             }
//           } catch (e: any) {
//             console.error(`❌ Create failed for ${sheetName}:`, e);
//           }
//         }
//       }

//       await report.save();
//       setStatus("Dashboards and Visuals generated successfully!");
//       setStatusType("success");

//       if (currentJobId) {
//         try {
//           await fetch(`https://databasemanagement-e0e0d7bqhdg3gec7.eastus-01.azurewebsites.net/jobs/${currentJobId}`, {
//             method: "PUT",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               MigrationStatus: "Completed",
//               CompletedAt: new Date().toISOString(),
//             }),
//           });
//         } catch (e) {
//           console.error("Failed to update job status to Completed", e);
//         }
//       }
//     } catch (err: any) {
//       console.error("❌ Critical Error:", err);
//       setStatus("Error: " + err.message);
//       setStatusType("error");

//       if (currentJobId) {
//         try {
//           await fetch(`https://databasemanagement-e0e0d7bqhdg3gec7.eastus-01.azurewebsites.net/jobs/${currentJobId}`, {
//             method: "PUT",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               MigrationStatus: "Failed",
//               ErrorMessage: err.message || "Unknown error occurred during visual generation",
//               CompletedAt: new Date().toISOString(),
//             }),
//           });
//         } catch (e) {
//           console.error("Failed to update job status to Failed", e);
//         }
//       }
//     } finally {
//       console.groupEnd();
//     }
//   }

//   /* ----------- EMBED REPORT ----------- */
//   useEffect(() => {
//     let report: any;
//     if (isEmbedding.current) return;
//     isEmbedding.current = true;

//     async function init() {
//       console.group("🔍 DEBUG: Session Data");
//       console.log("workspaceId:", workspaceId);
//       console.log("reportId:", reportId);
//       console.log("datasetId:", datasetId);
//       console.log("metadataBlobUrl:", metadataBlobUrl);
//       console.log("rawReportName:", rawReportName);
//       console.groupEnd();

//       if (!workspaceId || !reportId || !userToken) {
//         setStatus("Missing Session Data or Auth Token");
//         setStatusType("error");
//         return;
//       }

//       try {
//         if (containerRef.current) {
//           pbiService.reset(containerRef.current);

//           const builtEmbedUrl = `https://app.powerbi.com/reportEmbed?reportId=${reportId}&groupId=${workspaceId}`;

//           const embedConfig = {
//             type: "report",
//             id: reportId,
//             embedUrl: builtEmbedUrl,
//             accessToken: userToken,
//             tokenType: models.TokenType.Aad,
//             permissions: models.Permissions.All,
//             viewMode: models.ViewMode.Edit,
//             settings: {
//               panes: {
//                 fields: { visible: true, expanded: true },
//                 visualizations: { visible: true },
//               },
//             },
//           };

//           console.group("📋 DEBUG: Embed Configuration");
//           console.log("tokenType:", models.TokenType.Aad, "(models.TokenType.Aad)");
//           console.log("permissions:", models.Permissions.All, "(models.Permissions.All)");
//           console.log("viewMode:", models.ViewMode.Edit, "(models.ViewMode.Edit)");
//           console.log("report id:", reportId);
//           console.log(
//             "Full config (token redacted):",
//             JSON.stringify({ ...embedConfig, accessToken: "[REDACTED]" }, null, 2),
//           );
//           console.groupEnd();

//           report = pbiService.embed(containerRef.current, embedConfig);

//           report.on("loaded", () => {
//             console.log("✅ DEBUG: Report 'loaded' event fired");
//           });

//           report.on("rendered", () => {
//             console.log("📊 DEBUG: Report 'rendered' event fired");
//             createStaticVisuals(report);
//           });

//           report.on("error", (e: any) => {
//             console.group("❌ DEBUG: Power BI Error Event");
//             console.error("Full error event:", JSON.stringify(e, null, 2));
//             if (e.detail) {
//               console.error("Error detail:", JSON.stringify(e.detail, null, 2));
//               console.error("Message:", e.detail.message);
//               console.error("Error code:", e.detail.errorCode);
//               console.error("Level:", e.detail.level);
//               if (e.detail.technicalDetails) {
//                 console.error("Technical Details:", JSON.stringify(e.detail.technicalDetails, null, 2));
//                 console.error("  RequestId:", e.detail.technicalDetails.requestId);
//                 console.error("  ErrorInfo:", e.detail.technicalDetails.errorInfo);
//               }
//               if (e.detail.activityId) console.error("ActivityId:", e.detail.activityId);
//               if (e.detail.requestId) console.error("RequestId:", e.detail.requestId);
//               if (e.detail.clusterUri) console.error("Cluster URI:", e.detail.clusterUri);
//             }
//             console.groupEnd();
//             setStatus("Power BI Error");
//             setStatusType("error");
//           });

//           report.on("dataSelected", (e: any) => {
//             console.log("📊 DEBUG: dataSelected event:", JSON.stringify(e, null, 2));
//           });

//           report.on("commandTriggered", (e: any) => {
//             console.log("⚡ DEBUG: commandTriggered event:", JSON.stringify(e, null, 2));
//           });

//           const originalFetch = window.fetch;
//           window.fetch = async function (...args: Parameters<typeof fetch>) {
//             const url = typeof args[0] === "string" ? args[0] : (args[0] as Request).url;
//             const isQueryData =
//               url.includes("querydata") ||
//               url.includes("QueryData") ||
//               url.includes("conceptualschema") ||
//               url.includes("explore");

//             if (isQueryData) {
//               console.group("🌐 DEBUG: PBI Network Request");
//               console.log("URL:", url);
//               console.log("Method:", (args[1] as RequestInit)?.method || "GET");
//             }

//             try {
//               const response = await originalFetch.apply(this, args);

//               if (isQueryData) {
//                 console.log("Status:", response.status, response.statusText);
//                 response.headers.forEach((value, key) => {
//                   if (
//                     key.toLowerCase().includes("requestid") ||
//                     key.toLowerCase().includes("activityid") ||
//                     key.toLowerCase().includes("x-powerbi") ||
//                     key.toLowerCase().includes("cluster")
//                   ) {
//                     console.log(`  Header ${key}: ${value}`);
//                   }
//                 });

//                 if (!response.ok) {
//                   console.error("⚠️ QUERY DATA FAILURE!");
//                   console.error("HTTP Status:", response.status);
//                   try {
//                     const cloned = response.clone();
//                     const errorBody = await cloned.text();
//                     console.error("Response Body:", errorBody);
//                   } catch (readErr) {
//                     console.error("Could not read error body:", readErr);
//                   }
//                 }
//                 console.groupEnd();
//               }

//               return response;
//             } catch (err) {
//               if (isQueryData) {
//                 console.error("❌ NETWORK ERROR on querydata:", err);
//                 console.groupEnd();
//               }
//               throw err;
//             }
//           };
//         }
//       } catch (e: any) {
//         console.error("❌ DEBUG: Init failed:", e);
//         console.error("Stack:", e.stack);
//         setStatus("Init failed: " + e.message);
//         setStatusType("error");
//       }
//     }
//     init();
//   }, [workspaceId, reportId, datasetId, metadataBlobUrl, rawReportName, userToken]);

//   return (
//     <AppLayout>
//       <div className="flex flex-col gap-4 p-6 h-full">
//         {/* Header Section */}
//         <div className="flex items-center gap-3">
//           <Button variant="ghost" size="icon" onClick={() => navigate("/migration")}>
//             <ArrowLeft />
//           </Button>
//           <h1 className="text-2xl font-bold">Report Preview</h1>
//         </div>

//         {/* Status Bar */}
//         <div
//           className={`flex items-center gap-3 p-4 rounded-lg border shadow-sm transition-all duration-300 ${
//             statusType === "error"
//               ? "bg-red-50 border-red-200 text-red-700"
//               : statusType === "success"
//                 ? "bg-green-50 border-green-200 text-green-700"
//                 : statusType === "warning"
//                   ? "bg-amber-50 border-amber-200 text-amber-700"
//                   : "bg-white border-blue-100 text-slate-700"
//           }`}
//         >
//           {statusType === "loading" && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
//           {statusType === "success" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
//           {statusType === "error" && <XCircle className="h-5 w-5 text-red-600" />}
//           {statusType === "warning" && <AlertTriangle className="h-5 w-5 text-amber-600" />}

//           <div className="flex flex-col flex-1">
//             <span className="text-sm font-semibold uppercase tracking-wider opacity-70">System Status</span>
//             <span className="font-medium">{status}</span>
//           </div>
//           <div className="flex items-center gap-2 px-3 py-1 bg-white/50 rounded-full border border-black/5 text-xs font-medium">
//             <Globe className="h-3 w-3" />
//             Config Source: {source}
//           </div>
//         </div>

//         {/* Refresh Buttons - shown after success */}
//         {statusType === "success" && (
//           <div className="flex justify-end gap-2">
//             <Button onClick={handleRefreshNow} variant="outline" className="gap-2">
//               <RefreshCw className="h-4 w-4" />
//               Refresh Now
//             </Button>
//             <Button onClick={() => setScheduleOpen(true)} className="gap-2">
//               <Clock className="h-4 w-4" />
//               Schedule Refresh
//             </Button>
//           </div>
//         )}

//         {/* Power BI Container */}
//         <div className="relative flex-1 w-full min-h-[600px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
//           <div ref={containerRef} className="h-full w-full" />
//         </div>
//       </div>

//       {/* Schedule Refresh Dialog */}
//       <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
//         <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Schedule Refresh</DialogTitle>
//             <DialogDescription>
//               Configure refresh schedules for <strong>{rawReportName}</strong>
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-6 py-2">
//             {/* ─── Single Toggle for Both ─── */}
//             <div className="flex items-center justify-between rounded-lg border p-4">
//               <div className="space-y-1">
//                 <span className="text-sm font-semibold">Enable Scheduled Refresh</span>
//                 <p className="text-xs text-muted-foreground">
//                   {scheduleEnabled
//                     ? "Both Lakehouse and Semantic Model refresh are active"
//                     : "Scheduled refresh is off"}
//                 </p>
//               </div>
//               <Switch checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
//             </div>

//             {scheduleEnabled && (
//               <>
//                 {/* ─── Lakehouse Interval ─── */}
//                 <div className="space-y-3 rounded-lg border p-4">
//                   <span className="text-sm font-semibold">Lakehouse Refresh Interval</span>
//                   <Select value={lakehouseInterval} onValueChange={setLakehouseInterval}>
//                     <SelectTrigger>
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="5">Every 5 minutes</SelectItem>
//                       <SelectItem value="10">Every 10 minutes</SelectItem>
//                       <SelectItem value="30">Every 30 minutes</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 {/* ─── Semantic Model Schedule ─── */}
//                 <div className="space-y-4 rounded-lg border p-4">
//                   <span className="text-sm font-semibold">Semantic Model Schedule</span>

//                   {/* Days selection */}
//                   <div className="space-y-2">
//                     <label className="text-sm font-medium">Days</label>
//                     <div className="flex flex-wrap gap-2">
//                       {ALL_DAYS.map((day) => (
//                         <label key={day} className="flex items-center gap-1.5 cursor-pointer">
//                           <Checkbox checked={selectedDays.includes(day)} onCheckedChange={() => toggleDay(day)} />
//                           <span className="text-sm">{day.slice(0, 3)}</span>
//                         </label>
//                       ))}
//                     </div>
//                   </div>

//                   {/* Time selection via dropdowns */}
//                   <div className="space-y-2">
//                     <label className="text-sm font-medium">Add Time Slot (UTC)</label>
//                     <div className="flex items-center gap-2">
//                       <Select value={selectedHour} onValueChange={setSelectedHour}>
//                         <SelectTrigger className="w-24">
//                           <SelectValue placeholder="Hour" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map((h) => (
//                             <SelectItem key={h} value={h}>
//                               {h}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                       <span className="text-sm font-medium">:</span>
//                       <Select value={selectedMinute} onValueChange={setSelectedMinute}>
//                         <SelectTrigger className="w-24">
//                           <SelectValue placeholder="Min" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="00">00</SelectItem>
//                           <SelectItem value="30">30</SelectItem>
//                         </SelectContent>
//                       </Select>
//                       <Button
//                         type="button"
//                         size="sm"
//                         variant="outline"
//                         onClick={() => {
//                           const time = `${selectedHour}:${selectedMinute}`;
//                           if (!selectedTimes.includes(time)) {
//                             setSelectedTimes((prev) => [...prev, time].sort());
//                           }
//                         }}
//                       >
//                         Add
//                       </Button>
//                     </div>
//                   </div>

//                   {/* Selected time slots */}
//                   {selectedTimes.length > 0 && (
//                     <div className="space-y-2">
//                       <label className="text-sm font-medium">Selected Time Slots</label>
//                       <div className="flex flex-wrap gap-2">
//                         {selectedTimes.map((time) => (
//                           <span
//                             key={time}
//                             className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
//                           >
//                             {time}
//                             <button
//                               type="button"
//                               onClick={() => setSelectedTimes((prev) => prev.filter((t) => t !== time))}
//                               className="ml-1 rounded-full hover:bg-primary/20 p-0.5"
//                             >
//                               <XCircle className="h-3 w-3" />
//                             </button>
//                           </span>
//                         ))}
//                       </div>
//                       <p className="text-xs text-muted-foreground">{selectedTimes.length} time slot(s) selected</p>
//                     </div>
//                   )}
//                 </div>
//               </>
//             )}
//           </div>

//           <DialogFooter>
//             <Button variant="outline" onClick={() => setScheduleOpen(false)}>
//               Cancel
//             </Button>
//             <Button onClick={handleScheduleRefresh} disabled={scheduling}>
//               {scheduling && <Loader2 className="h-4 w-4 animate-spin" />}
//               {scheduling ? "Scheduling..." : "Set Schedule"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </AppLayout>
//   );
// }

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
const API_URL = "https://frame-pbir-test-eqhpdtf4bag0aecw.eastus-01.azurewebsites.net/runtime-visuals";

const pbiService = new service.Service(factories.hpmFactory, factories.wpmpFactory, factories.routerFactory);

interface ApiBinding {
  table: string;
  column: string;
}

interface ApiVisual {
  visualType: string;
  title: string;
  layout: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  bindings: Record<string, ApiBinding | ApiBinding[]>;
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

  const mapRoleName = (visualType: string, semanticRole: string): string => {
    const type = visualType.toLowerCase();
    const role = semanticRole.toLowerCase();

    if (type.includes("table") || type.includes("matrix")) return "Values";

    if (
      type.includes("bar") ||
      type.includes("column") ||
      type.includes("line") ||
      type.includes("area") ||
      type.includes("scatter")
    ) {
      if (role === "category" || role === "axis") return "Category";
      if (role === "values" || role === "y") return "Y";
      if (role === "legend" || role === "series") return "Series";
      if (type.includes("scatter") && role === "x") return "X";
    }

    if (type.includes("pie") || type.includes("donut")) {
      if (role === "legend" || role === "category") return "Category";
      if (role === "values") return "Y";
    }

    return semanticRole;
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

  async function createStaticVisuals(report: any) {
    if (executed.current) return;
    executed.current = true;
    console.group("🚀 Creating Visuals from API");

    const currentJobId = sessionStorage.getItem("current_migration_job_id");

    try {
      setStatus("Fetching visual configuration...");

      let visualsToCreate: ApiVisual[] = [];
      let dashboards: any[] = [];

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
            if (visualsToCreate.length > 0) {
              setSource("API");
            }
          }
        } catch (e) {
          /* ignore */
        }
      }

      if (visualsToCreate.length === 0) {
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

      const visualMap = new Map<string, ApiVisual>();
      visualsToCreate.forEach((v) => visualMap.set(v.title, v));

      const assignedVisuals = new Set<string>();
      dashboards.forEach((d) => {
        d.worksheets.forEach((w: string) => assignedVisuals.add(w));
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

      const cleanReportName = rawReportName.replace(/[^a-zA-Z0-9]/g, "");
      const FALLBACK_TABLES = [rawReportName, cleanReportName, "Sheet1", "Table1", "Extract", "Data", "MainTable"];
      const uniqueFallbacks = [...new Set(FALLBACK_TABLES)];

      let pages = await report.getPages();

      const failedVisuals: string[] = [];
      let createdCount = 0;
      let totalToCreate = 0;

      const rectsOverlap = (
        a: { x: number; y: number; width: number; height: number },
        b: { x: number; y: number; width: number; height: number },
      ) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

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

        // Page bounds, so visuals aren't placed (and clipped/hidden) off-canvas.
        const pageSize = (page as any).defaultSize?.width ? (page as any).defaultSize : { width: 1280, height: 720 };

        let currentOrphanY = 40;
        const placedRects: { x: number; y: number; width: number; height: number }[] = [];

        for (const sheetName of config.worksheets) {
          const v = visualMap.get(sheetName);
          if (!v) continue;
          totalToCreate++;

          let finalX = v.layout.x;
          let finalY = v.layout.y;
          const finalWidth = Math.min(v.layout.width, pageSize.width - 10);
          const finalHeight = Math.min(v.layout.height, pageSize.height - 10);

          if (config.isOrphan) {
            finalX = 40;
            finalY = currentOrphanY;
            currentOrphanY += finalHeight + 20;
          } else {
            // Clamp to the page so a visual isn't pushed off-canvas.
            finalX = Math.max(0, Math.min(finalX, pageSize.width - finalWidth));
            finalY = Math.max(0, Math.min(finalY, pageSize.height - finalHeight));

            // If this rect overlaps one already placed on this page (common when the
            // migrated metadata has duplicate/approximate coordinates), the new visual
            // would be drawn directly on top of the old one and effectively hide it.
            // Push it down below the lowest overlapping visual instead of stacking.
            let candidate = { x: finalX, y: finalY, width: finalWidth, height: finalHeight };
            let guard = 0;
            while (placedRects.some((r) => rectsOverlap(r, candidate)) && guard < 50) {
              const overlapping = placedRects.filter((r) => rectsOverlap(r, candidate));
              const lowestBottom = Math.max(...overlapping.map((r) => r.y + r.height));
              candidate = { ...candidate, y: lowestBottom + 10 };
              guard++;
            }
            finalX = candidate.x;
            finalY = candidate.y;
          }

          placedRects.push({ x: finalX, y: finalY, width: finalWidth, height: finalHeight });

          setStatus(`Creating ${v.visualType} on ${expectedPageName}...`);
          try {
            const { visual } = await page.createVisual(normalizeType(v.visualType), {
              x: finalX,
              y: finalY,
              width: finalWidth,
              height: finalHeight,
              displayState: { mode: models.VisualContainerDisplayMode.Visible },
            });

            if (v.title) {
              try {
                await visual.setProperty({ objectName: "title", propertyName: "text" }, { value: v.title });
                await visual.setProperty({ objectName: "title", propertyName: "visible" }, { value: true });
              } catch (e) {
                /* ignore */
              }
            }
            await sleep(200);

            const bindingEntries = Object.entries(v.bindings);
            for (const [semanticRole, data] of bindingEntries) {
              const technicalRole = mapRoleName(v.visualType, semanticRole);
              const bindArray = Array.isArray(data) ? data : [data];

              for (const b of bindArray) {
                const rawCol = b?.column || "";
                const sanitizedCol = cleanColumnName(rawCol);

                if (b && b.table && sanitizedCol) {
                  let bound = false;
                  console.log(`🔗 Binding: role="${technicalRole}", table="${b.table}", column="${sanitizedCol}"`);
                  try {
                    await visual.addDataField(technicalRole, {
                      $schema: "http://powerbi.com/product/schema#column",
                      table: b.table,
                      column: sanitizedCol,
                    });
                    bound = true;
                    console.log(`✅ Bound successfully: ${b.table}.${sanitizedCol} → ${technicalRole}`);
                  } catch (e: any) {
                    console.warn(`⚠️ Binding failed for ${b.table}.${sanitizedCol} → ${technicalRole}:`, e?.message || e);
                  }

                  if (!bound) {
                    for (const fallbackTable of uniqueFallbacks) {
                      if (fallbackTable === b.table) continue;
                      try {
                        await visual.addDataField(technicalRole, {
                          $schema: "http://powerbi.com/product/schema#column",
                          table: fallbackTable,
                          column: sanitizedCol,
                        });
                        bound = true;
                        console.log(`✅ Fallback bound: ${fallbackTable}.${sanitizedCol} → ${technicalRole}`);
                        break;
                      } catch (e: any) {
                        console.warn(`⚠️ Fallback failed for ${fallbackTable}.${sanitizedCol}:`, e?.message || e);
                      }
                    }
                  }

                  if (!bound) {
                    console.error(`❌ FAILED to bind column "${sanitizedCol}" (original: "${rawCol}") to any table. Tried: [${b.table}, ${uniqueFallbacks.join(', ')}]`);
                  }
                }
              }
            }

            createdCount++;
          } catch (e: any) {
            console.error(`❌ Create failed for ${sheetName}:`, e);
            failedVisuals.push(`${sheetName} (${expectedPageName})`);
          }
        }
      }

      await report.save();

      if (failedVisuals.length > 0) {
        setStatus(
          `Created ${createdCount} of ${totalToCreate} visuals. Failed: ${failedVisuals.join(", ")}`,
        );
        setStatusType("warning");
        toast({
          title: "Some visuals could not be created",
          description: `${failedVisuals.length} visual(s) failed: ${failedVisuals.join(", ")}. Check the console for details.`,
          variant: "destructive",
        });
      } else {
        setStatus("Dashboards and Visuals generated successfully!");
        setStatusType("success");
      }

      if (currentJobId) {
        try {
          await fetch(`https://databasemanagement-e0e0d7bqhdg3gec7.eastus-01.azurewebsites.net/jobs/${currentJobId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              MigrationStatus: failedVisuals.length > 0 ? "CompletedWithErrors" : "Completed",
              ...(failedVisuals.length > 0 && {
                ErrorMessage: `${failedVisuals.length} of ${totalToCreate} visual(s) failed: ${failedVisuals.join(", ")}`,
              }),
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
