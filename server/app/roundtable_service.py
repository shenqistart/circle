from collections.abc import AsyncIterator
import json
from uuid import uuid4

from .agents import RunnerAdapter, parse_moderator_summary
from .schemas import (
    DiscussionRound,
    ErrorEvent,
    ExpertPreset,
    ExpertSummary,
    ExpertTurn,
    ExpertTurnCompletedEvent,
    ExpertTurnDeltaEvent,
    ExpertTurnStartedEvent,
    FinalResultEvent,
    ModeratorSummaryCompletedEvent,
    ModeratorSummaryDeltaEvent,
    ModeratorSummaryStartedEvent,
    RoundStartedEvent,
    RoundtableRequest,
    RoundtableResult,
    RunStartedEvent,
    ResponseMode,
    event_payload,
)


def sse_frame(event: object) -> str:
    if hasattr(event, "model_dump"):
        payload = event.model_dump()
    else:
        payload = event
    return f"event: roundtable\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"


class RoundtableService:
    def __init__(self, runner: RunnerAdapter) -> None:
        self.runner = runner

    async def stream_roundtable(self, request: RoundtableRequest) -> AsyncIterator[str]:
        try:
            async for event in self._events(request):
                yield sse_frame(event_payload(event))
        except Exception as error:
            yield sse_frame(ErrorEvent(message=str(error), retryable=True))

    async def _events(self, request: RoundtableRequest):
        run_id = str(uuid4())
        experts = request.experts
        yield RunStartedEvent(
            runId=run_id,
            question=request.question,
            experts=[ExpertSummary(id=expert.id, name=expert.name, domainTags=expert.domainTags) for expert in experts],
        )

        rounds: list[DiscussionRound] = []
        round_one = DiscussionRound(id=1, title="Round 1 · 初始立场", turns=[])
        yield RoundStartedEvent(roundId=round_one.id, title=round_one.title)
        for expert in experts:
            async for event in self._run_turn_events(
                expert=expert,
                question=request.question,
                round_id=1,
                response_mode="opening",
                responds_to=None,
                prior_rounds=rounds,
            ):
                if isinstance(event, ExpertTurnCompletedEvent):
                    round_one.turns.append(event.turn)
                yield event
        rounds.append(round_one)

        round_two = DiscussionRound(id=2, title="Round 2 · 点名回应", turns=[])
        yield RoundStartedEvent(roundId=round_two.id, title=round_two.title)
        modes: list[ResponseMode] = ["challenge", "build", "reframe"]
        for index, expert in enumerate(experts):
            target = experts[(index + len(experts) - 1) % len(experts)]
            async for event in self._run_turn_events(
                expert=expert,
                question=request.question,
                round_id=2,
                response_mode=modes[index % len(modes)],
                responds_to=target,
                prior_rounds=rounds,
            ):
                if isinstance(event, ExpertTurnCompletedEvent):
                    round_two.turns.append(event.turn)
                yield event
        rounds.append(round_two)

        yield ModeratorSummaryStartedEvent()
        summary_text = ""
        async for delta in self.runner.run_moderator_summary(question=request.question, experts=experts, rounds=rounds):
            summary_text += delta
            yield ModeratorSummaryDeltaEvent(delta=delta)
        summary = parse_moderator_summary(summary_text)
        yield ModeratorSummaryCompletedEvent(summary=summary)

        result = RoundtableResult(question=request.question, experts=experts, rounds=rounds, moderatorSummary=summary)
        yield FinalResultEvent(result=result)

    async def _run_turn_events(
        self,
        *,
        expert: ExpertPreset,
        question: str,
        round_id: int,
        response_mode: ResponseMode,
        responds_to: ExpertPreset | None,
        prior_rounds: list[DiscussionRound],
    ) -> AsyncIterator[object]:
        yield ExpertTurnStartedEvent(
            roundId=round_id,
            expertId=expert.id,
            expertName=expert.name,
            responseMode=response_mode,
            respondsToExpertId=responds_to.id if responds_to else None,
        )
        content = ""
        async for delta in self.runner.run_expert_turn(
            expert=expert,
            question=question,
            round_id=round_id,
            response_mode=response_mode,
            responds_to=responds_to,
            prior_rounds=prior_rounds,
        ):
            content += delta
            yield ExpertTurnDeltaEvent(roundId=round_id, expertId=expert.id, delta=delta)
        turn = ExpertTurn(
            expertId=expert.id,
            expertName=expert.name,
            roundId=round_id,
            responseMode=response_mode,
            respondsToExpertId=responds_to.id if responds_to else None,
            content=content.strip(),
        )
        yield ExpertTurnCompletedEvent(turn=turn)
