from collections.abc import AsyncIterator

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import ValidationError

from .agents import AgentsSdkRunner, RunnerAdapter
from .config import Settings, get_settings
from .roundtable_service import RoundtableService
from .schemas import RoundtableRequest


app = FastAPI(title="Roundtable Agent Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


def get_runner(settings: Settings = Depends(get_settings)) -> RunnerAdapter:
    return AgentsSdkRunner(settings)


@app.get("/api/health")
def health(settings: Settings = Depends(get_settings)):
    return {
        "ok": True,
        "hasApiKey": settings.has_api_key,
        "baseUrl": settings.openai_base_url,
        "model": settings.openai_model,
        "reasoningEffort": settings.openai_reasoning_effort,
    }


@app.post("/api/roundtable/stream")
async def stream_roundtable(payload: dict, runner: RunnerAdapter = Depends(get_runner)):
    try:
        request = RoundtableRequest.model_validate(payload)
    except ValidationError as error:
        raise HTTPException(status_code=400, detail="question and at least 2 experts are required") from error

    service = RoundtableService(runner)

    async def frames() -> AsyncIterator[str]:
        async for frame in service.stream_roundtable(request):
            yield frame

    return StreamingResponse(frames(), media_type="text/event-stream")
