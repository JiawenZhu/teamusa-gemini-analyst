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
    )

    try:
        async with client.aio.live.connect(model="gemini-3.1-flash-live-preview", config=config) as session:
            print("Connected.")
            
            await session.send_client_content(
                turns=types.Content(
                    role="user",
                    parts=[types.Part.from_text(text="Hello!")]
                ),
                turn_complete=True
            )
            
            print("Sent request. Receiving...")
            while True:
                try:
                    async for response in session.receive():
                        sc = response.server_content
                        if sc and sc.turn_complete:
                            print("Turn complete.")
                    print("Receive loop exited. Waiting 1 sec before trying again...")
                    await asyncio.sleep(1)
                except Exception as e:
                    print(f"Receive error: {e}")
                    break
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test())
