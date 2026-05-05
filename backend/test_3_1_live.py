import asyncio
from google import genai
from google.genai import types

async def test_live(location, api_version, model_name):
    client = genai.Client(
        vertexai=True, project="teamusa-8b1ba", location=location,
        http_options={"api_version": api_version},
    )
    config = types.LiveConnectConfig(response_modalities=["AUDIO"])
    try:
        async with client.aio.live.connect(model=model_name, config=config) as session:
            print(f"SUCCESS: {model_name} in {location} using {api_version}")
    except Exception as e:
        print(f"FAILED: {model_name} in {location} using {api_version} -> {e}")

async def main():
    await test_live("us-central1", "v1beta1", "gemini-3.1-flash-live-preview")
    await test_live("us-central1", "v1alpha", "gemini-3.1-flash-live-preview")
    await test_live("global", "v1beta1", "gemini-3.1-flash-live-preview")
    await test_live("global", "v1alpha", "gemini-3.1-flash-live-preview")

asyncio.run(main())
