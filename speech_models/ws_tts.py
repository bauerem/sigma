#!/usr/bin/env python

import asyncio
import json
from pydub import AudioSegment
import torch
import os
import sys
import websockets

# Add the parent directory to sys.path to allow importing from there
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)

from config import SERVER_ADDRESS, OPENAI_API_KEY

from TTS.api import TTS
import jieba
import base64

# Get device
device = "cuda" if torch.cuda.is_available() else "cpu"

# Instantiate the TTS class
tts_api = TTS()

# Determine language
language = os.environ.get('APP_LANGUAGE', "en")

tts = None
tts_dict = {}
tts_dict["en"] = TTS("tts_models/en/ljspeech/glow-tts").to(device)
tts_dict["de"] = TTS("tts_models/de/thorsten/tacotron2-DDC").to(device)
tts_dict["zh"] = TTS("tts_models/zh-CN/baker/tacotron2-DDC-GST").to(device)

def set_language(language):
    global tts

    # Choose a TTS model based on language
    if language == "en":
        tts = tts_dict["en"]
    elif language == "de":
        tts = tts_dict["de"]
    elif language == "zh-cn" or language == "zh":
        tts = tts_dict["zh"]

set_language(language)

async def tts_to_file(sentence, language):
    # This function encapsulates TTS processing and file handling

    tts.tts_to_file(text=sentence, file_path=f"speech.wav")

async def emit_websocket(websocket, message_data):
    await websocket.send(json.dumps(message_data))

async def run_tts(sentence, data, websocket):

    await tts_to_file(sentence, language)

    with open(f"speech.wav", 'rb') as f:
        audio_data = f.read()
    encoded_audio = base64.b64encode(audio_data).decode('utf-8')

    message_data = {
        'chatId': data["chatId"], 
        'userId': data["userId"], 
        'audio': encoded_audio,
        'text': sentence
        }
    
    await emit_websocket(websocket, message_data)
    await asyncio.sleep(1)

async def websocket_handler(uri):
    global language
    async with websockets.connect(uri) as websocket:
        await websocket.send(json.dumps({ 'type': 'registerTTS' }))
        print("Registered TTS via Websockets")

        async for message in websocket:
            data = json.loads(message)
            print("received message ", data)

            # J: update tts based on language 
            if 'language' in data: 
                lang = data["language"]
                if(lang != language):
                    language = lang
                    set_language(language)
                    print(f"switched language to {language}")

            if 'text' in data:
                from nltk import tokenize
                sentences = tokenize.sent_tokenize(data["text"])

                for sentence in sentences:
                    # J: not parallel
                    await run_tts(sentence, data, websocket)

async def main():
    uri = SERVER_ADDRESS
    await websocket_handler(uri)

if __name__ == '__main__':
    asyncio.run(main())
