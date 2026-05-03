from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


ResponseMode = Literal["opening", "challenge", "build", "concede", "reframe", "closing"]
SummarySection = Literal["consensus", "disagreements", "insights", "actions"]


class ExpertPreset(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str
    name: str
    skillId: str = ""
    domainTags: list[str] = Field(default_factory=list)
    shortDescription: str = ""
    thinkingStyle: str
    responseStyle: str
    evidenceRefs: list[str] = Field(default_factory=list)
    provenanceStatus: str = ""
    evidenceStatus: str = ""
    evidenceNote: str | None = None


class RoundtableRequest(BaseModel):
    question: str
    experts: list[ExpertPreset]

    @field_validator("question")
    @classmethod
    def question_must_not_be_empty(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("question is required")
        return value

    @field_validator("experts")
    @classmethod
    def needs_at_least_two_experts(cls, value: list[ExpertPreset]) -> list[ExpertPreset]:
        if len(value) < 2:
            raise ValueError("at least 2 experts are required")
        return value


class ExpertSummary(BaseModel):
    id: str
    name: str
    domainTags: list[str] = Field(default_factory=list)


class ExpertTurn(BaseModel):
    expertId: str
    expertName: str
    roundId: int
    responseMode: ResponseMode
    respondsToExpertId: str | None = None
    content: str


class DiscussionRound(BaseModel):
    id: int
    title: str
    turns: list[ExpertTurn] = Field(default_factory=list)


class ModeratorSummary(BaseModel):
    consensus: list[str] = Field(default_factory=list)
    disagreements: list[str] = Field(default_factory=list)
    insights: list[str] = Field(default_factory=list)
    actions: list[str] = Field(default_factory=list)


class RoundtableResult(BaseModel):
    question: str
    experts: list[ExpertPreset]
    rounds: list[DiscussionRound]
    moderatorSummary: ModeratorSummary

    @model_validator(mode="after")
    def validate_contract(self) -> "RoundtableResult":
        if len(self.experts) < 2:
            raise ValueError("至少需要 2 个专家")
        if len(self.rounds) < 2:
            raise ValueError("至少需要 2 轮讨论")

        selected_ids = {expert.id for expert in self.experts}
        speaking_ids = {turn.expertId for round_item in self.rounds for turn in round_item.turns}
        missing = selected_ids - speaking_ids
        if missing:
            raise ValueError(f"专家 {', '.join(sorted(missing))} 没有发言")

        has_response = any(
            turn.roundId >= 2 and bool(turn.respondsToExpertId)
            for round_item in self.rounds
            for turn in round_item.turns
        )
        if not has_response:
            raise ValueError("后续轮次缺少点名回应")

        if not self.moderatorSummary.consensus or not self.moderatorSummary.disagreements or not self.moderatorSummary.actions:
            raise ValueError("主持人总结不完整")
        return self


class StreamEvent(BaseModel):
    type: str


class RunStartedEvent(StreamEvent):
    type: Literal["run_started"] = "run_started"
    runId: str
    question: str
    experts: list[ExpertSummary]


class RoundStartedEvent(StreamEvent):
    type: Literal["round_started"] = "round_started"
    roundId: int
    title: str


class ExpertTurnStartedEvent(StreamEvent):
    type: Literal["expert_turn_started"] = "expert_turn_started"
    roundId: int
    expertId: str
    expertName: str
    responseMode: ResponseMode
    respondsToExpertId: str | None = None


class ExpertTurnDeltaEvent(StreamEvent):
    type: Literal["expert_turn_delta"] = "expert_turn_delta"
    roundId: int
    expertId: str
    delta: str


class ExpertTurnCompletedEvent(StreamEvent):
    type: Literal["expert_turn_completed"] = "expert_turn_completed"
    turn: ExpertTurn


class ModeratorSummaryStartedEvent(StreamEvent):
    type: Literal["moderator_summary_started"] = "moderator_summary_started"


class ModeratorSummaryDeltaEvent(StreamEvent):
    type: Literal["moderator_summary_delta"] = "moderator_summary_delta"
    section: SummarySection | None = None
    delta: str


class ModeratorSummaryCompletedEvent(StreamEvent):
    type: Literal["moderator_summary_completed"] = "moderator_summary_completed"
    summary: ModeratorSummary


class FinalResultEvent(StreamEvent):
    type: Literal["final_result"] = "final_result"
    result: RoundtableResult


class ErrorEvent(StreamEvent):
    type: Literal["error"] = "error"
    message: str
    retryable: bool = True


RoundtableStreamEvent = (
    RunStartedEvent
    | RoundStartedEvent
    | ExpertTurnStartedEvent
    | ExpertTurnDeltaEvent
    | ExpertTurnCompletedEvent
    | ModeratorSummaryStartedEvent
    | ModeratorSummaryDeltaEvent
    | ModeratorSummaryCompletedEvent
    | FinalResultEvent
    | ErrorEvent
)


def event_payload(event: RoundtableStreamEvent) -> dict[str, Any]:
    return event.model_dump(by_alias=True)
