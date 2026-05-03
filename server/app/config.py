from functools import lru_cache
from pathlib import Path
import os

from pydantic import BaseModel


def _load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("\"'")
        if key and key not in os.environ:
            os.environ[key] = value


class Settings(BaseModel):
    openai_api_key: str | None
    openai_base_url: str
    openai_model: str
    openai_reasoning_effort: str
    port: int

    @property
    def has_api_key(self) -> bool:
        return bool(self.openai_api_key)

    @property
    def responses_base_url(self) -> str:
        return self.openai_base_url if self.openai_base_url.endswith("/v1") else f"{self.openai_base_url}/v1"


@lru_cache
def get_settings() -> Settings:
    root = Path(__file__).resolve().parents[2]
    _load_env_file(root / ".env")
    _load_env_file(root / ".env.local")
    return Settings(
        openai_api_key=os.environ.get("OPENAI_API_KEY") or None,
        openai_base_url=os.environ.get("OPENAI_BASE_URL", "https://wooj.abrdns.com").rstrip("/"),
        openai_model=os.environ.get("OPENAI_MODEL", "gpt-5.5"),
        openai_reasoning_effort=os.environ.get("OPENAI_REASONING_EFFORT", "high"),
        port=int(os.environ.get("PORT", "8787")),
    )
