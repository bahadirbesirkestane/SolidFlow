import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type ScanPartListItem,
  type ScanProjectResponse,
  type ScanRow,
  createBulkWorkOrders,
  scanProject,
  selectFolder,
} from "@/entities/workflow-builder/api/workflow-builder-api";
import { useFrontendShellConfig } from "@/entities/system/hooks/useFrontendShellConfig";

type BulkFormState = {
  code: string;
  name: string;
  description: string;
};

const LAST_SCAN_FOLDER_KEY = "solidflow:last-scan-folder";

export type EditablePartListItem = ScanPartListItem & {
  sourceIndex: number;
};

export function useWorkflowBuilderPageData() {
  const queryClient = useQueryClient();
  const shellConfigQuery = useFrontendShellConfig();
  const [folderPath, setFolderPath] = useState(() => readStoredPath(LAST_SCAN_FOLDER_KEY));
  const [scanResult, setScanResult] = useState<ScanProjectResponse | null>(null);
  const [partList, setPartList] = useState<ScanPartListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [partListSearchTerm, setPartListSearchTerm] = useState("");
  const [activeView, setActiveView] = useState<"workflow" | "parts">("workflow");
  const [bulkForm, setBulkForm] = useState<BulkFormState>({
    code: "",
    name: "",
    description: "",
  });

  useEffect(() => {
    if (!folderPath && shellConfigQuery.data?.defaultScanDir) {
      setFolderPath(shellConfigQuery.data.defaultScanDir);
    }
  }, [folderPath, shellConfigQuery.data?.defaultScanDir]);

  useEffect(() => {
    if (folderPath.trim()) {
      storePath(LAST_SCAN_FOLDER_KEY, folderPath);
    }
  }, [folderPath]);

  const scanMutation = useMutation({
    mutationFn: (nextFolderPath: string) => scanProject(nextFolderPath),
    onSuccess: (result) => {
      setScanResult(result);
      setPartList(clonePartList(result.partList));

      if (!bulkForm.code || !bulkForm.name) {
        const nextForm = buildBulkFormFromFolder(result.scannedFolder);
        setBulkForm((current) => ({
          code: current.code || nextForm.code,
          name: current.name || nextForm.name,
          description: current.description || nextForm.description,
        }));
      }
    },
  });

  const folderPickerMutation = useMutation({
    mutationFn: () =>
      selectFolder({
        initialPath: folderPath,
        description: "Tarama yapilacak klasoru sec",
      }),
    onSuccess: (result) => {
      if (result.selectedPath) {
        setFolderPath(result.selectedPath);
        storePath(LAST_SCAN_FOLDER_KEY, result.selectedPath);
      }
    },
  });

  const createBulkWorkOrdersMutation = useMutation({
    mutationFn: () =>
      createBulkWorkOrders({
        code: bulkForm.code.trim(),
        name: bulkForm.name.trim(),
        description: bulkForm.description.trim(),
        folderPath: folderPath.trim(),
        partList: creatablePartList,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["operations"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["userWorkspace"] }),
      ]);
    },
  });

  const filteredRows = useMemo(() => {
    const rows = scanResult?.rows || [];
    if (!searchTerm.trim()) {
      return rows;
    }

    const normalized = searchTerm.trim().toLocaleLowerCase("tr");
    return rows.filter((row) =>
      [
        row.partCode,
        row.fileName,
        row.fileType,
        row.mainGroup,
        row.suggestedProcess,
        row.serviceType,
        row.folder,
      ]
        .join(" ")
        .toLocaleLowerCase("tr")
        .includes(normalized),
    );
  }, [scanResult?.rows, searchTerm]);

  const filteredPartList = useMemo<EditablePartListItem[]>(() => {
    if (!partListSearchTerm.trim()) {
      return partList.map((item, index) => ({ ...item, sourceIndex: index }));
    }

    const normalized = partListSearchTerm.trim().toLocaleLowerCase("tr");
    return partList.flatMap((item, index) => {
      const matches = [
        item.partCode,
        item.fileName,
        item.mainGroup,
        item.suggestedProcess,
        item.serviceType,
        item.note,
      ]
        .join(" ")
        .toLocaleLowerCase("tr")
        .includes(normalized);

      return matches ? [{ ...item, sourceIndex: index }] : [];
    });
  }, [partList, partListSearchTerm]);

  const partListStats = useMemo(() => {
    return {
      totalQuantity: partList.reduce((total, item) => total + Number(item.quantity || 0), 0),
      distinctGroups: new Set(partList.map((item) => item.mainGroup).filter(Boolean)).size,
      notedCount: partList.filter((item) => String(item.note || "").trim()).length,
    };
  }, [partList]);

  const creatablePartList = useMemo(() => partList.filter(canCreateWorkflowFromPart), [partList]);

  function updatePartListItem(index: number, field: keyof ScanPartListItem, value: string | number) {
    setPartList((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    );
  }

  async function runScan() {
    await scanMutation.mutateAsync(folderPath.trim());
  }

  function resetPartListEdits() {
    setPartList(clonePartList(scanResult?.partList || []));
    setPartListSearchTerm("");
  }

  function prefillBulkForm() {
    setBulkForm(buildBulkFormFromFolder(folderPath));
  }

  async function downloadWorkflowReport() {
    const response = await fetch(`/api/reports/workflow.xlsx?folder=${encodeURIComponent(folderPath.trim())}`);
    if (!response.ok) {
      throw new Error(await response.text());
    }
    triggerBrowserDownload(await response.blob(), "solid-workflow-report.xlsx");
  }

  async function downloadPartListReport() {
    const response = await fetch("/api/reports/workflow.xlsx", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scannedFolder: folderPath.trim(),
        summary: buildSummaryFromRows(scanResult?.rows || []),
        rows: scanResult?.rows || [],
        partList,
      }),
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    triggerBrowserDownload(await response.blob(), "solid-workflow-ve-parca-listesi.xlsx");
  }

  function downloadCsv() {
    const rows = filteredRows;
    const headers = [
      "Parca Kodu",
      "Dosya Adi",
      "Dosya Tipi",
      "Ana Grup",
      "Surec",
      "Hizmet",
      "Guven",
      "Eslesme",
      "Klasor",
      "Goreli Yol",
    ];
    const csvLines = [
      headers.join(";"),
      ...rows.map((row) =>
        [
          row.partCode,
          row.fileName,
          row.fileType,
          row.mainGroup,
          row.suggestedProcess,
          row.serviceType,
          row.confidence,
          row.matchedBy,
          row.folder,
          row.relativePath,
        ]
          .map(escapeCsvCell)
          .join(";"),
      ),
    ];
    const blob = new Blob([`\uFEFF${csvLines.join("\n")}`], { type: "text/csv;charset=utf-8;" });
    triggerBrowserDownload(blob, "solid-workflow-raporu.csv");
  }

  return {
    shellConfigQuery,
    folderPath,
    setFolderPath,
    scanResult,
    partList,
    filteredRows,
    filteredPartList,
    partListStats,
    searchTerm,
    setSearchTerm,
    partListSearchTerm,
    setPartListSearchTerm,
    activeView,
    setActiveView,
    bulkForm,
    setBulkForm,
    creatablePartList,
    scanMutation,
    folderPickerMutation,
    createBulkWorkOrdersMutation,
    updatePartListItem,
    runScan,
    resetPartListEdits,
    prefillBulkForm,
    downloadWorkflowReport,
    downloadPartListReport,
    downloadCsv,
  };
}

function buildBulkFormFromFolder(folderPath: string): BulkFormState {
  const folderSegments = folderPath.split(/[/\\]+/).filter(Boolean);
  const folderName = folderSegments.at(-1) || "";
  const guessedCode = folderName.split(/\s+/)[0] || folderName;

  return {
    code: guessedCode,
    name: folderName,
    description: folderName ? `${folderName} tarama ciktisindan olusturuldu.` : "",
  };
}

function buildSummaryFromRows(rows: ScanRow[]) {
  return {
    totalFiles: rows.length,
    assignedFiles: rows.filter((row) => row.confidence !== "Belirsiz").length,
    uncertainFiles: rows.filter((row) => row.confidence === "Belirsiz").length,
    byProcess: rows.reduce<Record<string, number>>((collection, row) => {
      collection[row.suggestedProcess] = (collection[row.suggestedProcess] || 0) + 1;
      return collection;
    }, {}),
    byFileType: rows.reduce<Record<string, number>>((collection, row) => {
      collection[row.fileType] = (collection[row.fileType] || 0) + 1;
      return collection;
    }, {}),
    byServiceType: rows.reduce<Record<string, number>>((collection, row) => {
      collection[row.serviceType] = (collection[row.serviceType] || 0) + 1;
      return collection;
    }, {}),
  };
}

function canCreateWorkflowFromPart(item: ScanPartListItem) {
  const process = String(item?.suggestedProcess || "").trim();
  const serviceType = String(item?.serviceType || "").trim();

  if (!process || process === "Belirsiz") {
    return false;
  }

  if (process === "Satin Alma" || serviceType.includes("Tedarigi")) {
    return true;
  }

  if (process === "Dis Hizmet" || serviceType.includes("Dis Hizmet") || serviceType.includes("Kesim")) {
    return true;
  }

  return ["Imalat", "Bukum", "Profil", "Torna/Freze", "Montaj", "Elektrik"].includes(process);
}

function clonePartList(partList: ScanPartListItem[]) {
  return JSON.parse(JSON.stringify(Array.isArray(partList) ? partList : [])) as ScanPartListItem[];
}

function escapeCsvCell(value: unknown) {
  const stringValue = String(value ?? "");
  return `"${stringValue.replaceAll('"', '""')}"`;
}

function triggerBrowserDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function readStoredPath(key: string) {
  if (typeof window === "undefined") {
    return "";
  }

  return String(window.localStorage.getItem(key) || "");
}

function storePath(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, value);
}
