import { useSearchParams } from "react-router-dom";

function parseQuizId(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function useLinkUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawQuizId = searchParams.get("quiz");
  const selectedQuizId = parseQuizId(rawQuizId);

  const setSelectedQuizId = (quizId: number | null) => {
    const next = new URLSearchParams(searchParams);
    if (quizId === null) {
      next.delete("quiz");
    } else {
      next.set("quiz", String(quizId));
    }
    setSearchParams(next);
  };

  return {
    hasInvalidQuizParam: rawQuizId !== null && selectedQuizId === null,
    selectedQuizId,
    setSelectedQuizId,
  };
}
