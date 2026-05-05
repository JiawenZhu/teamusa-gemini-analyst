import asyncio
import os
import json
from google import genai
from google.genai import types

from agents.olympic_agent import SYSTEM_PROMPT, TOOLS

async def handle_live_session(websocket):
    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)
    
    config = types.LiveConnectConfig(
        system_instruction=types.Content(parts=[types.Part.from_text(text=SYSTEM_PROMPT)]),
        tools=TOOLS,
        response_modalities=["AUDIO"],
    )

    try:
        async with client.aio.live.connect(model="gemini-3.1-flash-live-preview", config=config) as session:
            print("Connected to Gemini Live API")
            
            async def receive_from_client():
                try:
                    while True:
                        # We expect binary PCM from client
                        message = await websocket.receive()
                        if "bytes" in message:
                            # send audio to gemini
                            await session.send(input={"data": message["bytes"], "mime_type": "audio/pcm;rate=16000"})
                        elif "text" in message:
                            # user could send text if needed, or json commands
                            data = json.loads(message["text"])
                            # e.g., initial context
                            if data.get("type") == "context":
                                ctx_msg = data.get("text", "")
                                if ctx_msg:
                                    await session.send(input=ctx_msg)
                except Exception as e:
                    print("Client disconnected:", e)

            async def receive_from_gemini():
                try:
                    async for response in session.receive():
                        server_content = response.server_content
                        if server_content is not None:
                            model_turn = server_content.model_turn
                            if model_turn is not None:
                                for part in model_turn.parts:
                                    # check for audio
                                    if part.inline_data:
                                        # send binary to client
                                        await websocket.send_bytes(part.inline_data.data)
                                    elif part.text:
                                        await websocket.send_json({"type": "text", "text": part.text})
                                        
                        # Handle tool calls
                        if response.tool_call is not None:
                            tool_responses = []
                            for func_call in response.tool_call.function_calls:
                                name = func_call.name
                                args = func_call.args
                                print(f"Executing tool {name} with args {args}")
                                
                                # Find tool in TOOLS
                                func = next((t for t in TOOLS if t.__name__ == name), None)
                                if func:
                                    # Execute tool
                                    try:
                                        result = func(**args) if args else func()
                                        tool_responses.append(
                                            types.LiveClientToolResponse(
                                                function_responses=[
                                                    types.FunctionResponse(
                                                        name=name,
                                                        id=func_call.id,
                                                        response={"result": result}
                                                    )
                                                ]
                                            )
                                        )
                                    except Exception as e:
                                        print(f"Tool {name} error: {e}")
                                        tool_responses.append(
                                            types.LiveClientToolResponse(
                                                function_responses=[
                                                    types.FunctionResponse(
                                                        name=name,
                                                        id=func_call.id,
                                                        response={"error": str(e)}
                                                    )
                                                ]
                                            )
                                        )
                            
                            # Send all tool responses back to Gemini
                            for tr in tool_responses:
                                await session.send(input=tr)
                                
                except Exception as e:
                    print("Gemini disconnected:", e)

            await asyncio.gather(receive_from_client(), receive_from_gemini())
            
    except Exception as e:
        print("Live API connection error:", e)

