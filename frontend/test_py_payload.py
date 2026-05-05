import asyncio
from google import genai
from google.genai import types
import os

async def main():
    client = genai.Client(http_options={'api_version': 'v1alpha'})
    # We can't easily spy on the websocket from the SDK, but we can look at the schema
    # The SDK maps `LiveClientRealtimeInput.media_chunks` to `mediaChunks`.
    pass

if __name__ == "__main__":
    asyncio.run(main())
