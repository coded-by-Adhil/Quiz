import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  create,
  listForQuiz,
  setActive,
} from "@/api/links";
import type { QuizLink, QuizLinkPayload } from "@/features/links/types";

export const linkKeys = {
  forQuiz: (quizId: number) => ["links", quizId] as const,
};

export function useQuizLinksQuery(quizId: number | null) {
  return useQuery({
    enabled: quizId !== null,
    queryKey: quizId === null ? ["links"] : linkKeys.forQuiz(quizId),
    queryFn: () => listForQuiz(quizId as number),
  });
}

export function useCreateLinkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ quizId, payload }: { quizId: number; payload: QuizLinkPayload }) =>
      create(quizId, payload),
    onSuccess: async (_link, variables) => {
      await queryClient.invalidateQueries({ queryKey: linkKeys.forQuiz(variables.quizId) });
    },
  });
}

interface SetActiveContext {
  previous?: QuizLink[];
}

export function useSetLinkActiveMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    QuizLink,
    unknown,
    { linkId: number; quizId: number; is_active: boolean },
    SetActiveContext
  >({
    mutationFn: ({ linkId, is_active }) => setActive(linkId, { is_active }),
    onError: (_error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(linkKeys.forQuiz(variables.quizId), context.previous);
      }
    },
    onMutate: async (variables) => {
      const queryKey = linkKeys.forQuiz(variables.quizId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<QuizLink[]>(queryKey);

      queryClient.setQueryData<QuizLink[]>(queryKey, (current) =>
        current?.map((link) =>
          link.id === variables.linkId
            ? { ...link, is_active: variables.is_active }
            : link,
        ),
      );

      return { previous };
    },
    onSuccess: (updatedLink, variables) => {
      queryClient.setQueryData<QuizLink[]>(linkKeys.forQuiz(variables.quizId), (current) =>
        current?.map((link) =>
          link.id === updatedLink.id
            ? { ...link, is_active: updatedLink.is_active }
            : link,
        ),
      );
    },
  });
}
