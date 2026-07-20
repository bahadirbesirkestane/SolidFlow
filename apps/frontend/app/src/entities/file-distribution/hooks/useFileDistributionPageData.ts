import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  executeFileDistribution,
  executeFileDistributionRename,
  getFileDistributionConfig,
  previewFileDistribution,
  previewFileDistributionRename,
  saveFileDistributionConfig,
  type FileDistributionCategoryRule,
  type FileDistributionConfig,
  type FileDistributionExecuteResponse,
  type FileDistributionPlanRow,
  type FileDistributionPreviewResponse,
  type FileDistributionRenameExecuteResponse,
  type FileDistributionRenamePreviewResponse,
} from "@/entities/file-distribution/api/file-distribution-api";
import { selectFolder } from "@/entities/workflow-builder/api/workflow-builder-api";
import { useFrontendShellConfig } from "@/entities/system/hooks/useFrontendShellConfig";

export type FileTreeNode = {
  path: string;
  name: string;
  kind: "folder" | "file";
  depth: number;
  row?: FileDistributionPlanRow;
  children: FileTreeNode[];
  directFilePaths: string[];
  allFilePaths: string[];
};

type RenameSelectionState = {
  selectedFilePaths: string[];
  selectedFolderPaths: string[];
  includeSubfolders: boolean;
};

type FolderSelectionState = {
  checked: boolean;
  indeterminate: boolean;
  affectedFileCount: number;
};

export function useFileDistributionPageData() {
  const shellConfigQuery = useFrontendShellConfig();
  const renamePreviewRequestIdRef = useRef(0);
  const [sourceFolder, setSourceFolder] = useState("");
  const [targetRootPath, setTargetRootPath] = useState("");
  const [conflictPolicy, setConflictPolicy] = useState<"skip" | "suffix">("suffix");
  const [previewResult, setPreviewResult] = useState<FileDistributionPreviewResponse | null>(null);
  const [renamePreviewResult, setRenamePreviewResult] = useState<FileDistributionRenamePreviewResponse | null>(null);
  const [executeResult, setExecuteResult] = useState<FileDistributionExecuteResponse | null>(null);
  const [renameExecuteResult, setRenameExecuteResult] = useState<FileDistributionRenameExecuteResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [configDraft, setConfigDraft] = useState<FileDistributionConfig>({
    segmentPriority: [],
    unresolvedFolderName: "_BELIRSIZ",
    categoryRules: [],
  });
  const [expandedFolderPaths, setExpandedFolderPaths] = useState<string[]>([]);
  const [renameMode, setRenameMode] = useState<"prefix" | "suffix">("prefix");
  const [renameText, setRenameText] = useState("");
  const [selectionState, setSelectionState] = useState<RenameSelectionState>({
    selectedFilePaths: [],
    selectedFolderPaths: [],
    includeSubfolders: false,
  });

  const configQuery = useQuery({
    queryKey: ["fileDistribution", "config"],
    queryFn: getFileDistributionConfig,
  });

  useEffect(() => {
    if (configQuery.data) {
      setConfigDraft(configQuery.data);
    }
  }, [configQuery.data]);

  useEffect(() => {
    if (!sourceFolder.trim()) {
      setPreviewResult(null);
      setRenamePreviewResult(null);
      setRenameExecuteResult(null);
      setExecuteResult(null);
      setSelectionState({
        selectedFilePaths: [],
        selectedFolderPaths: [],
        includeSubfolders: false,
      });
    }
  }, [sourceFolder]);

  async function refreshPreviewSnapshot() {
    const result = await previewFileDistribution({
      sourceFolder: sourceFolder.trim(),
      targetRootPath: targetRootPath.trim(),
    });
    setPreviewResult(result);
    setExpandedFolderPaths(getDefaultExpandedFolders(result.rows));
    return result;
  }

  const previewMutation = useMutation({
    mutationFn: refreshPreviewSnapshot,
    onSuccess: (result) => {
      setExecuteResult(null);
      setRenamePreviewResult(null);
      setRenameExecuteResult(null);
      setSelectionState({
        selectedFilePaths: [],
        selectedFolderPaths: [],
        includeSubfolders: false,
      });
    },
  });

  const renamePreviewMutation = useMutation({
    mutationFn: async () =>
      previewFileDistributionRename({
        sourceFolder: sourceFolder.trim(),
        targetRootPath: targetRootPath.trim(),
        operation: {
          mode: renameMode,
          text: renameText,
        },
        selection: selectionState,
      }),
  });

  const executeMutation = useMutation({
    mutationFn: (dryRun: boolean) =>
      executeFileDistribution({
        sourceFolder: sourceFolder.trim(),
        targetRootPath: targetRootPath.trim() || undefined,
        dryRun,
        conflictPolicy,
      }),
    onSuccess: (result) => {
      setExecuteResult(result);
    },
  });

  const saveConfigMutation = useMutation({
    mutationFn: (payload: FileDistributionConfig) => saveFileDistributionConfig(payload),
    onSuccess: (result) => {
      setConfigDraft(result);
    },
  });

  const sourceFolderPickerMutation = useMutation({
    mutationFn: () =>
      selectFolder({
        initialPath: sourceFolder || shellConfigQuery.data?.defaultScanDir,
        description: "Yeniden adlandirilacak kaynak klasoru sec",
      }),
    onSuccess: (result) => {
      if (result.selectedPath) {
        setSourceFolder(result.selectedPath);
        setPreviewResult(null);
        setRenamePreviewResult(null);
        setRenameExecuteResult(null);
      }
    },
  });

  const targetFolderPickerMutation = useMutation({
    mutationFn: () =>
      selectFolder({
        initialPath: targetRootPath || shellConfigQuery.data?.defaultScanDir,
        description: "Dagitim cikti klasorunu sec",
      }),
    onSuccess: (result) => {
      if (result.selectedPath) {
        setTargetRootPath(result.selectedPath);
      }
    },
  });

  const renameExecuteMutation = useMutation({
    mutationFn: async () =>
      executeFileDistributionRename({
        sourceFolder: sourceFolder.trim(),
        targetRootPath: targetRootPath.trim(),
        conflictPolicy,
        operation: {
          mode: renameMode,
          text: renameText,
        },
        selection: selectionState,
      }),
    onSuccess: async (result) => {
      setRenameExecuteResult(result);
      setRenamePreviewResult(null);
      setSelectionState({
        selectedFilePaths: [],
        selectedFolderPaths: [],
        includeSubfolders: false,
      });
      await refreshPreviewSnapshot();
    },
  });

  const treeData = useMemo(() => buildFileTree(previewResult?.rows || []), [previewResult?.rows]);
  const folderNodeMap = useMemo(() => createFolderNodeMap(treeData), [treeData]);
  const effectiveSelectedFilePaths = useMemo(
    () => deriveEffectiveSelectedFilePaths(selectionState, folderNodeMap),
    [folderNodeMap, selectionState],
  );
  const effectiveSelectedFilePathSet = useMemo(
    () => new Set(effectiveSelectedFilePaths),
    [effectiveSelectedFilePaths],
  );

  const filteredTreeData = useMemo(
    () => filterTree(treeData, searchTerm),
    [searchTerm, treeData],
  );

  const folderSelectionStateMap = useMemo(
    () => createFolderSelectionStateMap({
      treeData,
      folderNodeMap,
      selectionState,
      effectiveSelectedFilePathSet,
    }),
    [effectiveSelectedFilePathSet, folderNodeMap, selectionState, treeData],
  );

  const selectionSummary = useMemo(
    () => ({
      selectedFileCount: selectionState.selectedFilePaths.length,
      selectedFolderCount: selectionState.selectedFolderPaths.length,
      affectedFileCount: effectiveSelectedFilePaths.length,
    }),
    [effectiveSelectedFilePaths.length, selectionState.selectedFilePaths.length, selectionState.selectedFolderPaths.length],
  );

  const renamePreviewItems = renamePreviewResult?.items || [];
  const renameValidationSummary = renamePreviewResult?.summary || null;
  const canRunRenamePreview = Boolean(previewResult && sourceFolder.trim() && selectionSummary.affectedFileCount > 0 && renameText.trim());
  const hasRenameBlockingIssues = Boolean(renameValidationSummary && renameValidationSummary.invalidFileCount > 0);

  useEffect(() => {
    if (!previewResult || !sourceFolder.trim() || selectionSummary.affectedFileCount === 0) {
      setRenamePreviewResult(null);
      renamePreviewRequestIdRef.current += 1;
      return;
    }

    if (!renameText.trim()) {
      setRenamePreviewResult(null);
      renamePreviewRequestIdRef.current += 1;
      return;
    }

    const requestId = renamePreviewRequestIdRef.current + 1;
    renamePreviewRequestIdRef.current = requestId;
    const timeoutId = window.setTimeout(() => {
      void renamePreviewMutation.mutateAsync().then((result) => {
        if (renamePreviewRequestIdRef.current === requestId) {
          setRenamePreviewResult(result);
        }
      }).catch(() => {});
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    previewResult,
    renameMode,
    renamePreviewMutation,
    renameText,
    selectionState,
    selectionSummary.affectedFileCount,
    sourceFolder,
    targetRootPath,
  ]);

  return {
    configQuery,
    configDraft,
    setConfigDraft,
    sourceFolder,
    setSourceFolder,
    targetRootPath,
    setTargetRootPath,
    conflictPolicy,
    setConflictPolicy,
    previewResult,
    renamePreviewResult,
    executeResult,
    renameExecuteResult,
    searchTerm,
    setSearchTerm,
    expandedFolderPaths,
    sourceFolderPickerMutation,
    targetFolderPickerMutation,
    previewMutation,
    renamePreviewMutation,
    executeMutation,
    runDistributionDryRun: async () => {
      if (!previewResult) {
        await refreshPreviewSnapshot();
      }

      return executeMutation.mutateAsync(true);
    },
    runDistributionCopy: async () => {
      if (!previewResult) {
        await refreshPreviewSnapshot();
      }

      return executeMutation.mutateAsync(false);
    },
    saveConfigMutation,
    renameExecuteMutation,
    treeData: filteredTreeData,
    selectionState,
    selectionSummary,
    folderSelectionStateMap,
    effectiveSelectedFilePathSet,
    renameMode,
    setRenameMode,
    renameText,
    setRenameText,
    renamePreviewItems,
    renameValidationSummary,
    canRunRenamePreview,
    hasRenameBlockingIssues,
    setSelectionIncludeSubfolders: (value: boolean) =>
      setSelectionState((current) => ({ ...current, includeSubfolders: value })),
    toggleFolderExpanded: (folderPath: string) =>
      setExpandedFolderPaths((current) =>
        current.includes(folderPath)
          ? current.filter((item) => item !== folderPath)
          : [...current, folderPath]
      ),
    clearSelection: () => {
      setSelectionState((current) => ({
        ...current,
        selectedFilePaths: [],
        selectedFolderPaths: [],
      }));
      setRenamePreviewResult(null);
    },
    selectAllVisible: () => {
      const nextFolders = collectVisibleFolderSelections(filteredTreeData, selectionState.includeSubfolders);
      const nextFiles = collectVisibleFileSelections(filteredTreeData, selectionState.includeSubfolders);
      setSelectionState({
        selectedFolderPaths: nextFolders,
        selectedFilePaths: nextFiles,
        includeSubfolders: selectionState.includeSubfolders,
      });
    },
    removePreviewItem: (relativePath: string) =>
      setSelectionState((current) => ({
        ...current,
        selectedFilePaths: current.selectedFilePaths.filter((item) => item !== relativePath),
        selectedFolderPaths: current.selectedFolderPaths.filter((folderPath) => !isPathInsideFolder(relativePath, folderPath, true)),
      })),
    isFileSelected: (relativePath: string) => effectiveSelectedFilePathSet.has(relativePath),
    toggleFileSelection: (relativePath: string) =>
      setSelectionState((current) => toggleFileSelectionState(current, folderNodeMap, relativePath)),
    toggleFolderSelection: (folderPath: string) =>
      setSelectionState((current) => toggleFolderSelectionState(current, folderNodeMap, folderPath)),
  };
}

export function createEmptyDistributionRule(): FileDistributionCategoryRule {
  return {
    id: `distribution-rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "Yeni Dagitim Kurali",
    matchMode: "any",
    keywords: [],
    segmentMatchers: [],
    category: "",
    subcategory: "",
    renamePrefix: "",
    isCopyCandidate: true,
    confidence: "Orta",
    priority: 0,
    note: "",
    isActive: true,
  };
}

function buildFileTree(rows: FileDistributionPlanRow[]) {
  const rootChildren = new Map<string, InternalTreeNode>();

  for (const row of rows) {
    const segments = row.relativePath.split(/[/\\]+/).filter(Boolean);
    let currentChildren = rootChildren;
    let currentPath = "";

    for (let index = 0; index < segments.length - 1; index += 1) {
      const segment = segments[index];
      currentPath = currentPath ? `${currentPath}\\${segment}` : segment;
      if (!currentChildren.has(segment)) {
        currentChildren.set(segment, createInternalFolderNode(segment, currentPath, index));
      }

      const folderNode = currentChildren.get(segment);
      if (folderNode) {
        currentChildren = folderNode.childrenMap;
      }
    }

    const fileName = segments[segments.length - 1] || row.fileName;
    currentChildren.set(fileName, {
      path: row.relativePath,
      name: fileName,
      kind: "file",
      depth: segments.length - 1,
      row,
      childrenMap: new Map(),
    });
  }

  return finalizeTree(Array.from(rootChildren.values()));
}

function createInternalFolderNode(name: string, folderPath: string, depth: number): InternalTreeNode {
  return {
    path: folderPath,
    name,
    kind: "folder",
    depth,
    childrenMap: new Map(),
  };
}

function finalizeTree(nodes: InternalTreeNode[]): FileTreeNode[] {
  return nodes
    .sort(compareTreeNodes)
    .map((node) => {
      const children = finalizeTree(Array.from(node.childrenMap.values()));
      if (node.kind === "file") {
        return {
          path: node.path,
          name: node.name,
          kind: "file",
          depth: node.depth,
          row: node.row,
          children: [],
          directFilePaths: [node.path],
          allFilePaths: [node.path],
        };
      }

      const directFilePaths = children.filter((child) => child.kind === "file").map((child) => child.path);
      const allFilePaths = children.flatMap((child) => child.allFilePaths);
      return {
        path: node.path,
        name: node.name,
        kind: "folder",
        depth: node.depth,
        children,
        directFilePaths,
        allFilePaths,
      };
    });
}

function compareTreeNodes(left: InternalTreeNode, right: InternalTreeNode) {
  if (left.kind !== right.kind) {
    return left.kind === "folder" ? -1 : 1;
  }

  return left.name.localeCompare(right.name, "tr");
}

function createFolderNodeMap(nodes: FileTreeNode[]) {
  const map = new Map<string, FileTreeNode>();

  const walk = (items: FileTreeNode[]) => {
    for (const item of items) {
      if (item.kind === "folder") {
        map.set(item.path, item);
        walk(item.children);
      }
    }
  };

  walk(nodes);
  return map;
}

function deriveEffectiveSelectedFilePaths(selectionState: RenameSelectionState, folderNodeMap: Map<string, FileTreeNode>) {
  const selected = new Set(selectionState.selectedFilePaths);
  for (const folderPath of selectionState.selectedFolderPaths) {
    const node = folderNodeMap.get(folderPath);
    if (!node) {
      continue;
    }

    const filePaths = selectionState.includeSubfolders ? node.allFilePaths : node.directFilePaths;
    for (const filePath of filePaths) {
      selected.add(filePath);
    }
  }

  return Array.from(selected).sort((left, right) => left.localeCompare(right, "tr"));
}

function createFolderSelectionStateMap({
  treeData,
  folderNodeMap,
  selectionState,
  effectiveSelectedFilePathSet,
}: {
  treeData: FileTreeNode[];
  folderNodeMap: Map<string, FileTreeNode>;
  selectionState: RenameSelectionState;
  effectiveSelectedFilePathSet: Set<string>;
}) {
  const map = new Map<string, FolderSelectionState>();

  const walk = (nodes: FileTreeNode[]) => {
    for (const node of nodes) {
      if (node.kind !== "folder") {
        continue;
      }

      const scopedFilePaths = selectionState.includeSubfolders ? node.allFilePaths : node.directFilePaths;
      const scopedSelectedCount = scopedFilePaths.filter((filePath) => effectiveSelectedFilePathSet.has(filePath)).length;
      const descendantSelectedCount = node.allFilePaths.filter((filePath) => effectiveSelectedFilePathSet.has(filePath)).length;
      const explicitSelection = selectionState.selectedFolderPaths.includes(node.path);

      map.set(node.path, {
        checked: explicitSelection || (scopedFilePaths.length > 0 && scopedSelectedCount === scopedFilePaths.length),
        indeterminate: descendantSelectedCount > 0 && !explicitSelection && scopedSelectedCount !== scopedFilePaths.length,
        affectedFileCount: scopedFilePaths.length,
      });

      walk(node.children);
    }
  };

  walk(treeData);
  return map;
}

function filterTree(nodes: FileTreeNode[], searchTerm: string) {
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase("tr");
  if (!normalizedSearch) {
    return nodes;
  }

  return nodes.flatMap((node) => {
    if (node.kind === "file") {
      const haystack = `${node.name} ${node.path}`.toLocaleLowerCase("tr");
      return haystack.includes(normalizedSearch) ? [node] : [];
    }

    const filteredChildren = filterTree(node.children, normalizedSearch);
    const matchesSelf = `${node.name} ${node.path}`.toLocaleLowerCase("tr").includes(normalizedSearch);
    if (!matchesSelf && filteredChildren.length === 0) {
      return [];
    }

    return [
      {
        ...node,
        children: filteredChildren,
      },
    ];
  });
}

function getDefaultExpandedFolders(rows: FileDistributionPlanRow[]) {
  const expanded = new Set<string>();
  for (const row of rows) {
    const segments = row.relativePath.split(/[/\\]+/).filter(Boolean);
    let currentPath = "";
    for (let index = 0; index < Math.max(0, segments.length - 2); index += 1) {
      currentPath = currentPath ? `${currentPath}\\${segments[index]}` : segments[index];
      if (index < 2) {
        expanded.add(currentPath);
      }
    }
  }

  return Array.from(expanded);
}

function collectVisibleFolderSelections(nodes: FileTreeNode[], includeSubfolders: boolean) {
  return nodes
    .filter((node) => node.kind === "folder")
    .filter((node) => (includeSubfolders ? node.allFilePaths.length > 0 : node.directFilePaths.length > 0))
    .map((node) => node.path);
}

function collectVisibleFileSelections(nodes: FileTreeNode[], includeSubfolders: boolean) {
  const selected = new Set<string>();
  const walk = (items: FileTreeNode[]) => {
    for (const item of items) {
      if (item.kind === "file") {
        if (!includeSubfolders) {
          selected.add(item.path);
        }
        continue;
      }

      walk(item.children);
    }
  };

  walk(nodes);
  return Array.from(selected);
}

function toggleFileSelectionState(
  selectionState: RenameSelectionState,
  folderNodeMap: Map<string, FileTreeNode>,
  relativePath: string,
) {
  const next = materializeFolderSelections(selectionState, folderNodeMap, [relativePath]);
  const selectedFiles = new Set(next.selectedFilePaths);
  if (selectedFiles.has(relativePath)) {
    selectedFiles.delete(relativePath);
  } else {
    selectedFiles.add(relativePath);
  }

  return {
    ...next,
    selectedFilePaths: Array.from(selectedFiles).sort((left, right) => left.localeCompare(right, "tr")),
  };
}

function toggleFolderSelectionState(
  selectionState: RenameSelectionState,
  folderNodeMap: Map<string, FileTreeNode>,
  folderPath: string,
) {
  const node = folderNodeMap.get(folderPath);
  if (!node) {
    return selectionState;
  }

  const scopedFilePaths = selectionState.includeSubfolders ? node.allFilePaths : node.directFilePaths;
  const next = materializeFolderSelections(selectionState, folderNodeMap, scopedFilePaths);
  const selectedFolders = new Set(next.selectedFolderPaths);
  const selectedFiles = new Set(next.selectedFilePaths);

  if (selectedFolders.has(folderPath)) {
    selectedFolders.delete(folderPath);
    for (const filePath of node.allFilePaths) {
      selectedFiles.delete(filePath);
    }
  } else {
    for (const filePath of scopedFilePaths) {
      selectedFiles.delete(filePath);
    }

    for (const selectedFolderPath of Array.from(selectedFolders)) {
      if (selectedFolderPath === folderPath || selectedFolderPath.startsWith(`${folderPath}\\`)) {
        selectedFolders.delete(selectedFolderPath);
      }
    }

    selectedFolders.add(folderPath);
  }

  return {
    ...next,
    selectedFolderPaths: Array.from(selectedFolders).sort((left, right) => left.localeCompare(right, "tr")),
    selectedFilePaths: Array.from(selectedFiles).sort((left, right) => left.localeCompare(right, "tr")),
  };
}

function materializeFolderSelections(
  selectionState: RenameSelectionState,
  folderNodeMap: Map<string, FileTreeNode>,
  scopeFilePaths: string[],
) {
  const selectedFolders = new Set(selectionState.selectedFolderPaths);
  const selectedFiles = new Set(selectionState.selectedFilePaths);

  for (const folderPath of selectionState.selectedFolderPaths) {
    const node = folderNodeMap.get(folderPath);
    if (!node) {
      continue;
    }

    const folderFilePaths = selectionState.includeSubfolders ? node.allFilePaths : node.directFilePaths;
    if (!folderFilePaths.some((filePath) => scopeFilePaths.includes(filePath))) {
      continue;
    }

    selectedFolders.delete(folderPath);
    for (const filePath of folderFilePaths) {
      selectedFiles.add(filePath);
    }
  }

  return {
    ...selectionState,
    selectedFolderPaths: Array.from(selectedFolders),
    selectedFilePaths: Array.from(selectedFiles),
  };
}

function isPathInsideFolder(relativePath: string, folderPath: string, includeSubfolders: boolean) {
  const fileFolder = extractFolderPath(relativePath);
  if (folderPath === ".") {
    return includeSubfolders ? true : fileFolder === ".";
  }

  if (fileFolder === folderPath) {
    return true;
  }

  return includeSubfolders ? fileFolder.startsWith(`${folderPath}\\`) : false;
}

function extractFolderPath(relativePath: string) {
  const parts = relativePath.split(/[/\\]+/).filter(Boolean);
  if (parts.length <= 1) {
    return ".";
  }

  parts.pop();
  return parts.join("\\");
}

type InternalTreeNode = {
  path: string;
  name: string;
  kind: "folder" | "file";
  depth: number;
  row?: FileDistributionPlanRow;
  childrenMap: Map<string, InternalTreeNode>;
};
