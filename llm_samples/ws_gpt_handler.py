#!/usr/bin/env python
import asyncio
import websockets
import json
from litellm import acompletion
import os
import sys

# Add the parent directory to sys.path to allow importing from there
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)

from config import SERVER_ADDRESS, OPENAI_API_KEY

from system_messages import SYSTEM_MSG_DICT

# Assume OPENAI_API_KEY is set in environment variables
class GPTHandler:
    def __init__(self, system_message, server_address=SERVER_ADDRESS):
        self.server_address = server_address
        self.system_message = system_message
        self.messages = {}

    async def run_gpt(self, message, chatId):
        try:
            if chatId not in self.messages:
                self.messages[chatId] = [{"role": "system", "content": self.system_message}]
            self.messages[chatId].append({"role": "user", "content": message})
            response = await acompletion(model="gpt-3.5-turbo-1106", messages=self.messages[chatId])  # Adjust model as needed
            print("response", response)
            text = response.choices[0].message['content'].strip()
            self.messages[chatId].append({"role": "assistant", "content": text})
            return text
        except Exception as e:
            print(f"Error running GPT: {str(e)}")
            return "An error occurred while generating a response."

    async def websocket_handler(self, uri):
        async with websockets.connect(uri) as websocket:
            # Register for GPT
            await websocket.send(json.dumps({'type': 'registerGPT', 'data': {'foo': 'bar'}}))
            print("Registered GPT via Websockets")

            async for message in websocket:
                data = json.loads(message)
                print('I received a message for GPT!', data)

                response_text = await self.run_gpt(data['text'], data['chatId'])
                
                await websocket.send(json.dumps({
                    'type': 'GPT', 
                    'text': response_text, 
                    'userId': data['userId'], 
                    'chatId': data['chatId'] 
                    }))

    async def start_handler(self):
        uri = self.server_address  # Ensure this is a ws:// or wss:// URL
        await self.websocket_handler(uri)

if __name__ == '__main__':
    handler = GPTHandler(SYSTEM_MSG_DICT["default"], SERVER_ADDRESS)
    asyncio.run(handler.start_handler())