from collections.abc import AsyncIterator
import json
from typing import Protocol

from .config import Settings
from .schemas import DiscussionRound, ExpertPreset, ModeratorSummary, ResponseMode


class RunnerAdapter(Protocol):
    async def run_expert_turn(
        self,
        *,
        expert: ExpertPreset,
        question: str,
        round_id: int,
        response_mode: ResponseMode,
        responds_to: ExpertPreset | None,
        prior_rounds: list[DiscussionRound],
    ) -> AsyncIterator[str]:
        ...

    async def run_moderator_summary(
        self,
        *,
        question: str,
        experts: list[ExpertPreset],
        rounds: list[DiscussionRound],
    ) -> AsyncIterator[str]:
        ...


def build_expert_instructions(expert: ExpertPreset) -> str:
    tags = ", ".join(expert.domainTags)
    return "\n".join(
        [
            f"You are the expert agent named {expert.name}.",
            f"Skill id metadata: {expert.skillId}.",
            f"Domain tags: {tags}.",
            f"Short description: {expert.shortDescription}.",
            f"Thinking style: {expert.thinkingStyle}.",
            f"Response style: {expert.responseStyle}.",
            "Use only the ExpertPreset fields provided in this request.",
            "Do not execute installCommand, fetch sourceRepo, parse GitHub, use persistent memory, or claim external skill contents were verified.",
            "Return direct discussion content only, without markdown fences.",
        ]
    )


def build_expert_prompt(
    *,
    question: str,
    round_id: int,
    response_mode: ResponseMode,
    responds_to: ExpertPreset | None,
    prior_rounds: list[DiscussionRound],
) -> str:
    prior = "\n".join(
        f"Round {round_item.id} / {turn.expertName}: {turn.content}"
        for round_item in prior_rounds
        for turn in round_item.turns
    )
    response_target = f"Respond specifically to {responds_to.name} ({responds_to.id})." if responds_to else "State your opening position."
    return "\n".join(
        [
            f"User question: {question}",
            f"Round: {round_id}",
            f"Response mode: {response_mode}",
            response_target,
            "Prior discussion:",
            prior or "(none)",
            "Write one concise expert turn in Chinese.",
        ]
    )


def build_moderator_instructions() -> str:
    return "\n".join(
        [
            "You are the moderator agent for a multi-expert roundtable.",
            "Summarize the discussion into strict JSON with keys consensus, disagreements, insights, actions.",
            "Each key must contain an array of Chinese strings.",
            "Do not output markdown fences or extra commentary.",
        ]
    )


def build_moderator_prompt(question: str, experts: list[ExpertPreset], rounds: list[DiscussionRound]) -> str:
    expert_names = ", ".join(expert.name for expert in experts)
    turns = "\n".join(
        f"Round {round_item.id} / {turn.expertName}: {turn.content}"
        for round_item in rounds
        for turn in round_item.turns
    )
    return "\n".join(
        [
            f"Question: {question}",
            f"Experts: {expert_names}",
            "Discussion turns:",
            turns,
            "Return JSON only.",
        ]
    )


def parse_moderator_summary(text: str) -> ModeratorSummary:
    stripped = text.strip()
    if stripped.startswith("```"):
        stripped = stripped.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    payload = json.loads(stripped)
    return ModeratorSummary.model_validate(payload)


class AgentsSdkRunner:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def _stream_agent(self, *, name: str, instructions: str, prompt: str) -> AsyncIterator[str]:
        if not self.settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is not set")

        from agents import Agent, ModelSettings, Runner, set_default_openai_api, set_default_openai_client, set_tracing_disabled
        from openai import AsyncOpenAI

        set_tracing_disabled(True)
        set_default_openai_api("responses")
        set_default_openai_client(
            AsyncOpenAI(api_key=self.settings.openai_api_key, base_url=self.settings.responses_base_url),
            use_for_tracing=False,
        )
        agent = Agent(
            name=name,
            instructions=instructions,
            model=self.settings.openai_model,
            model_settings=ModelSettings(reasoning={"effort": self.settings.openai_reasoning_effort}),
        )
        result = Runner.run_streamed(agent, input=prompt)
        async for event in result.stream_events():
            data = getattr(event, "data", None)
            delta = getattr(data, "delta", None)
            if event.type == "raw_response_event" and isinstance(delta, str):
                yield delta

    async def run_expert_turn(
        self,
        *,
        expert: ExpertPreset,
        question: str,
        round_id: int,
        response_mode: ResponseMode,
        responds_to: ExpertPreset | None,
        prior_rounds: list[DiscussionRound],
    ) -> AsyncIterator[str]:
        async for delta in self._stream_agent(
            name=expert.name,
            instructions=build_expert_instructions(expert),
            prompt=build_expert_prompt(
                question=question,
                round_id=round_id,
                response_mode=response_mode,
                responds_to=responds_to,
                prior_rounds=prior_rounds,
            ),
        ):
            yield delta

    async def run_moderator_summary(
        self,
        *,
        question: str,
        experts: list[ExpertPreset],
        rounds: list[DiscussionRound],
    ) -> AsyncIterator[str]:
        async for delta in self._stream_agent(
            name="Moderator",
            instructions=build_moderator_instructions(),
            prompt=build_moderator_prompt(question, experts, rounds),
        ):
            yield delta
