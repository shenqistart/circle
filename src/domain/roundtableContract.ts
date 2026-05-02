import type { RoundtableResult } from "./types";

export const validateRoundtableResult = (result: RoundtableResult): string[] => {
  const errors: string[] = [];
  if (result.experts.length < 2) {
    errors.push("至少需要 2 个专家");
  }
  if (result.rounds.length < 2) {
    errors.push("至少需要 2 轮讨论");
  }
  const selectedIds = new Set(result.experts.map((expert) => expert.id));
  const speakingIds = new Set(result.rounds.flatMap((round) => round.turns.map((turn) => turn.expertId)));
  selectedIds.forEach((id) => {
    if (!speakingIds.has(id)) {
      errors.push(`专家 ${id} 没有发言`);
    }
  });
  const hasResponse = result.rounds.some((round) =>
    round.turns.some((turn) => turn.roundId >= 2 && Boolean(turn.respondsToExpertId))
  );
  if (!hasResponse) {
    errors.push("后续轮次缺少点名回应");
  }
  if (
    result.moderatorSummary.consensus.length === 0 ||
    result.moderatorSummary.disagreements.length === 0 ||
    result.moderatorSummary.actions.length === 0
  ) {
    errors.push("主持人总结不完整");
  }
  return errors;
};
