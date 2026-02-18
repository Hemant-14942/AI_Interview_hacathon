import os
from openai import OpenAI

client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.environ["GROQ_API_KEY"],
)

completion = client.chat.completions.create(
    model=os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant"),
    messages=[
        {"role": "user", "content": "Say hello"}
    ],
)

print(completion.choices[0].message.content)
