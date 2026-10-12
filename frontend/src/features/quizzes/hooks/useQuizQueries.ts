import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createQuiz,
  deleteQuiz,
  getQuiz,
  listQuizzes,
  setQuizQuestions,
  updateQuiz,
} from "@/api/quizzes";
import type {
  Quiz,
  QuizListParams,
  QuizPayload,
} from "@/features/quizzes/types";

export const quizKeys = {
  all: ["quizzes"] as const,
  detail: (id: number) => ["quizzes", id] as const,
  list: (params: QuizListParams) => ["quizzes", params] as const,
};

export function useQuizzesQuery(params: QuizListParams) {
  return useQuery({
    placeholderData: keepPreviousData,
    queryKey: quizKeys.list(params),
    queryFn: () => listQuizzes(params),
  });
}

export function useQuizQuery(id: number | null) {
  return useQuery({
    enabled: id !== null,
    queryKey: id === null ? quizKeys.all : quizKeys.detail(id),
    queryFn: () => getQuiz(id as number),
  });
}

export function useCreateQuizMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: QuizPayload) => createQuiz(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: quizKeys.all });
    },
  });
}

export function useUpdateQuizMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: QuizPayload }) =>
      updateQuiz(id, payload),
    onSuccess: async (quiz, variables) => {
      queryClient.setQueryData(quizKeys.detail(variables.id), quiz);
      await queryClient.invalidateQueries({ queryKey: quizKeys.all });
    },
  });
}

export function useDeleteQuizMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteQuiz(id),
    onSuccess: async (_response, id) => {
      await queryClient.invalidateQueries({ queryKey: quizKeys.all });
      queryClient.removeQueries({ queryKey: quizKeys.detail(id) });
    },
  });
}

export function useSetQuizQuestionsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, questionIds }: { id: number; questionIds: number[] }) =>
      setQuizQuestions(id, questionIds),
    onSuccess: async (quiz: Quiz, variables) => {
      queryClient.setQueryData(quizKeys.detail(variables.id), quiz);
      await queryClient.invalidateQueries({ queryKey: quizKeys.all });
    },
  });
}
