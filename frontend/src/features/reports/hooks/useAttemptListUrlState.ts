import { usePaginatedListUrlState } from "@/lib/usePaginatedListUrlState";
import type { AttemptSort, QuizAttemptListParams } from "@/features/reports/types";

export function useAttemptListUrlState() {
  const state = usePaginatedListUrlState<AttemptSort>({
    defaultSort: "participant_name",
    isSort: (value): value is AttemptSort => value === "participant_name" || value === "score",
  });

  return { ...state, params: state.params as QuizAttemptListParams };
}
