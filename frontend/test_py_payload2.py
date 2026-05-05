import asyncio
from google import genai
from google.genai import types
import json

async def main():
    client = genai.Client(http_options={'api_version': 'v1alpha'})
    # Create a LiveClientRealtimeInput using the SDK helper
    rt_input = types.LiveClientRealtimeInput(
        media_chunks=[types.Blob(data=b"abcd", mime_type="audio/pcm")]
    )
    print("Python SDK payload schema for media_chunks:")
    print(rt_input.model_dump(exclude_none=True))

if __name__ == "__main__":
    asyncio.run(main())
