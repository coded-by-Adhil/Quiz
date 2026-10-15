import { useQuery } from "@tanstack/react-query";
import { listQuizzes } from "@/api/quizzes";
import type { AllQuizzesData } from "@/features/links/types";
import type { QuizListItem } from "@/features/quizzes/types";

const allQuizzesKey = ["quizzes", "all"] as const;
const maxPages = 20;

async function fetchAllQuizzes(): Promise<AllQuizzesData> {
  const quizzes: QuizListItem[] = [];
  let page = 1;
  let lastPage = 1;

  while (page <= lastPage && page <= maxPages) {
    const response = await listQuizzes({
      direction: "asc",
      page,
      sort: "title",
    });
    quizzes.push(...response.data);
    lastPage = response.last_page;
    page += 1;
  }

  return {
    capHit: lastPage > maxPages,
    quizzes,
  };
}

export function useAllQuizzes() {
  return useQuery({
    queryKey: allQuizzesKey,
    queryFn: fetchAllQuizzes,
  });
}
