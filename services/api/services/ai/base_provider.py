from abc import ABC, abstractmethod


class AIProvider(ABC):
    @abstractmethod
    async def generate_text(self, prompt: str) -> str: ...

    @abstractmethod
    async def generate_structured_json(self, prompt: str, schema: dict) -> dict: ...

    @abstractmethod
    async def classify_safety(self, prompt: str) -> dict: ...
