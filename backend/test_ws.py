import asyncio
import websockets
import json

async def test_live():
    uri = "ws://localhost:8000/api/voice-chat-live"
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri) as ws:
            # Wait for the initial connection status
            response = await ws.recv()
            print(f"Received: {response}")
            
            # Keep open for a second
            await asyncio.sleep(2)
            print("Closing...")
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test_live())
