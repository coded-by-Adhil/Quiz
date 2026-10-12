import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createQuestion,
  deleteQuestion,
  getQuestion,
  listQuestions,
  updateQuestion,
} from "@/api/questions";
import type { QuestionPayload } from "@/features/questions/types";

export const questionKeys = {
  all: ["questions"] as const,
  detail: (id: number) => ["questions", id] as const,
};

export function useQuestionsQuery() {
  return useQuery({
    queryKey: questionKeys.all,
    queryFn: listQuestions,
  });
}

export function useQuestionQuery(id: number | null) {
  return useQuery({
    enabled: id !== null,
    queryKey: id === null ? questionKeys.all : questionKeys.detail(id),
    queryFn: () => getQuestion(id as number),
  });
}

export function useCreateQuestionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: QuestionPayload) => createQuestion(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: questionKeys.all });
    },
  });
}

export function useUpdateQuestionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: QuestionPayload }) =>
      updateQuestion(id, payload),
    onSuccess: async (_question, variables) => {
      await queryClient.invalidateQueries({ queryKey: questionKeys.all });
      await queryClient.invalidateQueries({ queryKey: questionKeys.detail(variables.id) });
    },
  });
}

export function useDeleteQuestionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteQuestion(id),
    onSuccess: async (_response, id) => {
      await queryClient.invalidateQueries({ queryKey: questionKeys.all });
      queryClient.removeQueries({ queryKey: questionKeys.detail(id) });
    },
  });
}
