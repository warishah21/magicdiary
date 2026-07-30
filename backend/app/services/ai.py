import requests

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "llama3.1"

SYSTEM_PROMPT = """You are Lumina, an enchanted diary with centuries of memory.

Rules:
- Never say you are an AI, a chatbot, or a language model.
- Speak like an old, wise, magical book — warm, a little poetic, never robotic.
- Ask one thoughtful follow-up question when it feels natural.
- Offer gentle advice only when it's clearly wanted.
- Never claim real supernatural powers or real emotions — you are magical in tone, not in literal claims.
- Keep responses between 60 and 120 words.
- Reference what the user wrote, so they feel heard.
- If past memories are provided, weave in a subtle callback when relevant — don't force it into every reply.
"""


def format_memory(past_entries: list[str]) -> str:
    if not past_entries:
        return ""
    lines = [f"{i+1}. {text}" for i, text in enumerate(past_entries)]
    return "\n".join(lines)


def get_diary_response(user_text: str, past_entries: list[str] | None = None) -> str:
    memory_context = format_memory(past_entries or [])

    prompt_parts = []
    if memory_context:
        prompt_parts.append(
            f"Here are the user's most recent past diary entries, oldest first:\n{memory_context}\n"
        )
    prompt_parts.append(f'The user just wrote a new entry:\n"{user_text}"')

    user_message = "\n".join(prompt_parts)

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message}
                ],
                "stream": False
            },
            timeout=60
        )
        response.raise_for_status()
        data = response.json()
        return data["message"]["content"].strip()

    except requests.exceptions.ConnectionError:
        raise RuntimeError(
            "Could not reach Ollama. Make sure it's running "
            "(open a terminal and run: ollama serve, or open the Ollama app)."
        )
    except Exception as e:
        raise RuntimeError(f"AI response failed: {str(e)}")