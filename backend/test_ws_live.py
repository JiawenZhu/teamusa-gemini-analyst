import asyncio
import websockets
import json
import time

async def test_live():
    uri = "ws://localhost:8000/api/voice-chat-live"
    try:
        async with websockets.connect(uri) as ws:
            response = await ws.recv()
            print(f"Received: {response}")
            
            async def send_audio():
                for _ in range(50):
                    await ws.send(b"\x00" * 3200) # send silence
                    await asyncio.sleep(0.1)
            
            async def receive_msgs():
                while True:
                    msg = await ws.recv()
                    if isinstance(msg, bytes):
                        pass
                    else:
                        print(msg)
            
            await asyncio.gather(send_audio(), receive_msgs())
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test_live())
