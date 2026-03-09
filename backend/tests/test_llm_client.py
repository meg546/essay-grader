"""Tests for LLM client factory and provider initialization."""

from unittest.mock import MagicMock

import pytest

from app.config import Settings
from app.llm.client import get_llm_client
from app.llm.anthropic import AnthropicClient
from app.llm.ollama import OllamaClient
from app.llm.openai import OpenAIClient


def _make_settings(**overrides) -> Settings:
    """Create a Settings instance with overrides, bypassing env file."""
    defaults = {
        "database_url": "sqlite+aiosqlite:///test.db",
        "model_provider": "ollama",
        "model_name": "llama3.2:3b",
        "model_endpoint": "http://localhost:11434",
        "anthropic_api_key": "test-key",
        "openai_api_key": "test-key",
    }
    defaults.update(overrides)
    return Settings(**defaults)


class TestProviderFactory:
    """Test get_llm_client returns the correct adapter."""

    def test_provider_factory_ollama(self):
        settings = _make_settings(model_provider="ollama")
        client = get_llm_client(settings)
        assert isinstance(client, OllamaClient)

    def test_provider_factory_anthropic(self):
        settings = _make_settings(model_provider="anthropic")
        client = get_llm_client(settings)
        assert isinstance(client, AnthropicClient)

    def test_provider_factory_openai(self):
        settings = _make_settings(model_provider="openai")
        client = get_llm_client(settings)
        assert isinstance(client, OpenAIClient)

    def test_provider_factory_invalid(self):
        # Use a mock to bypass Pydantic Literal validation
        settings = MagicMock()
        settings.model_provider = "invalid"
        with pytest.raises(ValueError, match="Unknown model provider"):
            get_llm_client(settings)


class TestOllamaClient:
    """Test OllamaClient initialization."""

    def test_ollama_client_uses_correct_endpoint(self):
        settings = _make_settings(
            model_provider="ollama",
            model_endpoint="http://my-ollama:11434",
        )
        client = OllamaClient(settings)
        assert str(client._client.base_url) == "http://my-ollama:11434/v1/"

    def test_ollama_client_stores_model_name(self):
        settings = _make_settings(model_name="mistral:7b")
        client = OllamaClient(settings)
        assert client.model == "mistral:7b"


class TestSettingsDefaults:
    """Test that LLM settings have correct defaults."""

    def test_settings_defaults(self):
        settings = _make_settings()
        assert settings.model_provider == "ollama"
        assert settings.model_name == "llama3.2:3b"
        assert settings.model_endpoint == "http://localhost:11434"
        assert settings.anthropic_api_key == "test-key"
        assert settings.openai_api_key == "test-key"
