from collections.abc import AsyncIterator
import json

from fastapi.testclient import TestClient

from app.main import app, get_runner
from app.schemas import DiscussionRound, ExpertPreset, ResponseMode


class FakeRunner:
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
        target = f" 回应 {responds_to.name}" if responds_to else ""
        yield f"{expert.name}{target}："
        yield f"围绕 {question} 给出 {response_mode} 观点。"

    async def run_moderator_summary(
        self,
        *,
        question: str,
        experts: list[ExpertPreset],
        rounds: list[DiscussionRound],
    ) -> AsyncIterator[str]:
        yield json.dumps(
            {
                "consensus": ["先定义目标，再分配专家视角。"],
                "disagreements": ["分歧在速度、风险和体验权重。"],
                "insights": ["流式圆桌应保留每位专家的独立上下文。"],
                "actions": ["选择至少两位专家", "根据输出重试或调整问题"],
            },
            ensure_ascii=False,
        )


class FailingRunner(FakeRunner):
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
        raise RuntimeError("provider unavailable")
        yield ""


def override_runner():
    return FakeRunner()


def parse_events(body: str) -> list[dict]:
    events = []
    for frame in body.strip().split("\n\n"):
        data_line = next(line for line in frame.splitlines() if line.startswith("data: "))
        events.append(json.loads(data_line.removeprefix("data: ")))
    return events


def expert_payload(expert_id: str, name: str) -> dict:
    return {
        "id": expert_id,
        "name": name,
        "skillId": expert_id,
        "domainTags": ["AI", "产品"],
        "shortDescription": "测试专家",
        "thinkingStyle": "先拆问题再回答",
        "responseStyle": "简洁直接",
    }


def test_stream_roundtable_rejects_too_few_experts():
    app.dependency_overrides[get_runner] = override_runner
    client = TestClient(app)

    response = client.post(
        "/api/roundtable/stream",
        json={"question": "怎么做 AI 教育产品？", "experts": [expert_payload("a", "A")]},
    )

    assert response.status_code == 400
    app.dependency_overrides.clear()


def test_stream_roundtable_emits_ordered_events_and_final_result():
    app.dependency_overrides[get_runner] = override_runner
    client = TestClient(app)

    response = client.post(
        "/api/roundtable/stream",
        json={
            "question": "怎么做 AI 教育产品？",
            "experts": [expert_payload("a", "A"), expert_payload("b", "B")],
        },
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
    events = parse_events(response.text)
    event_types = [event["type"] for event in events]

    assert event_types[0] == "run_started"
    assert event_types.count("round_started") == 2
    assert event_types.count("expert_turn_started") == 4
    assert event_types.count("expert_turn_completed") == 4
    assert "moderator_summary_completed" in event_types
    assert event_types[-1] == "final_result"

    final = events[-1]["result"]
    assert final["question"] == "怎么做 AI 教育产品？"
    assert len(final["rounds"]) == 2
    assert {turn["expertId"] for round_item in final["rounds"] for turn in round_item["turns"]} == {"a", "b"}
    assert any(
        turn.get("respondsToExpertId")
        for round_item in final["rounds"]
        for turn in round_item["turns"]
        if turn["roundId"] == 2
    )
    app.dependency_overrides.clear()


def test_stream_roundtable_emits_error_event_on_runner_failure():
    app.dependency_overrides[get_runner] = lambda: FailingRunner()
    client = TestClient(app)

    response = client.post(
        "/api/roundtable/stream",
        json={
            "question": "怎么做 AI 教育产品？",
            "experts": [expert_payload("a", "A"), expert_payload("b", "B")],
        },
    )

    events = parse_events(response.text)
    assert events[-1] == {"type": "error", "message": "provider unavailable", "retryable": True}
    app.dependency_overrides.clear()
