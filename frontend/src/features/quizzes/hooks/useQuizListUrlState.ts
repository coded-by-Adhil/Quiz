import { usePaginatedListUrlState } from "@/lib/usePaginatedListUrlState";
import type {
  QuizListParams,
  QuizSort,
} from "@/features/quizzes/types";

export function useQuizListUrlState() {
  const state = usePaginatedListUrlState<QuizSort>({
    defaultSort: "title",
    isSort: (value): value is QuizSort => value === "title" || value === "created_at",
  });

  return { ...state, params: state.params as QuizListParams };
}
