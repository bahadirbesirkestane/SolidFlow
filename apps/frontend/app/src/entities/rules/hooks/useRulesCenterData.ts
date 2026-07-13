import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type FileNameRule,
  type FileTypeRule,
  type KeywordRule,
  type PartOverride,
  getRuleResolverConfig,
  listFileNameRules,
  listFileTypeRules,
  listKeywordRules,
  listPartOverrides,
  saveFileNameRules,
  saveFileTypeRules,
  saveKeywordRules,
  savePartOverrides,
} from "@/entities/rules/api/rules-api";

export function useRulesCenterData() {
  const queryClient = useQueryClient();

  const fileTypeRulesQuery = useQuery({
    queryKey: ["rules", "fileTypes"],
    queryFn: listFileTypeRules,
  });
  const keywordRulesQuery = useQuery({
    queryKey: ["rules", "keywords"],
    queryFn: listKeywordRules,
  });
  const fileNameRulesQuery = useQuery({
    queryKey: ["rules", "fileNames"],
    queryFn: listFileNameRules,
  });
  const partOverridesQuery = useQuery({
    queryKey: ["rules", "overrides"],
    queryFn: listPartOverrides,
  });
  const resolverConfigQuery = useQuery({
    queryKey: ["rules", "resolver"],
    queryFn: getRuleResolverConfig,
  });

  async function refreshAll() {
    await Promise.all([
      fileTypeRulesQuery.refetch(),
      keywordRulesQuery.refetch(),
      fileNameRulesQuery.refetch(),
      partOverridesQuery.refetch(),
      resolverConfigQuery.refetch(),
    ]);
  }

  const saveFileTypeRulesMutation = useMutation({
    mutationFn: (payload: FileTypeRule[]) => saveFileTypeRules(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["rules", "fileTypes"] }),
        queryClient.invalidateQueries({ queryKey: ["rules", "resolver"] }),
      ]);
    },
  });

  const saveKeywordRulesMutation = useMutation({
    mutationFn: (payload: KeywordRule[]) => saveKeywordRules(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["rules", "keywords"] }),
        queryClient.invalidateQueries({ queryKey: ["rules", "resolver"] }),
      ]);
    },
  });

  const saveFileNameRulesMutation = useMutation({
    mutationFn: (payload: FileNameRule[]) => saveFileNameRules(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["rules", "fileNames"] }),
        queryClient.invalidateQueries({ queryKey: ["rules", "resolver"] }),
      ]);
    },
  });

  const savePartOverridesMutation = useMutation({
    mutationFn: (payload: PartOverride[]) => savePartOverrides(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["rules", "overrides"] }),
        queryClient.invalidateQueries({ queryKey: ["rules", "resolver"] }),
      ]);
    },
  });

  return {
    fileTypeRulesQuery,
    keywordRulesQuery,
    fileNameRulesQuery,
    partOverridesQuery,
    resolverConfigQuery,
    refreshAll,
    saveFileTypeRulesMutation,
    saveKeywordRulesMutation,
    saveFileNameRulesMutation,
    savePartOverridesMutation,
  };
}
