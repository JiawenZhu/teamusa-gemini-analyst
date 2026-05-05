import asyncio
from google import genai
from google.genai import types

async def test():
    client = genai.Client(
        vertexai=True, project="teamusa-8b1ba", location="us-central1",
        http_options={"api_version": "v1beta1"},
    )
    
    config = types.LiveConnectConfig(
        system_instruction=types.Content(parts=[types.Part.from_text(text="Hello")]),
        response_modalities=["AUDIO"],
        input_audio_transcription=types.AudioTranscriptionConfig()
    )

    try:
        async with client.aio.live.connect(model="gemini-3.1-flash-live-preview", config=config) as session:
            print("Connected with transcription enabled!")
    except Exception as e:
        print(f"Error 2.5: {e}")

asyncio.run(test())
