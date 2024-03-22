import asyncio
import websockets
import json
import os
import sys
import base64

# Add the parent directory to sys.path to allow importing from there
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)

from config import SERVER_ADDRESS, OPENAI_API_KEY

# Import the requests library for making HTTP requests
import requests

# Function to transcribe audio using OpenAI's Whisper API
async def transcribe_audio(audio_data: bytes) -> tuple[str, str]:
    # Encode the audio data to base64
    audio_base64 = base64.b64encode(audio_data).decode('utf-8')

    # Prepare the request payload
    payload = {
        "audio": {
            "data_b64": audio_base64
        },
        "model": "whisper-1",  # Specify the Whisper model to use
        "language": None  # Let the API automatically detect the language
    }

    # Prepare the headers for the request
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }

    # Make the request to the Whisper API
    response = requests.post(
        "https://api.openai.com/v1/audio/transcriptions",
        headers=headers,
        json=payload
    )

    # Parse the response
    response_data = response.json()
    transcription = response_data['text']  # Extract the transcription text
    language = response_data.get('language', 'unknown')  # Extract the detected language, default to 'unknown' if not provided

    # Return the transcription and the detected language
    return (transcription, language)


async def handle_websocket(uri):
    max_size_limit = 50 * 2**20  # 50 MB in bytes
    async with websockets.connect(uri, max_size=max_size_limit) as websocket:
        # Register for speech recognition
        await websocket.send(json.dumps({"type": "registerSR"}))
        print("Registered SR via Websockets")

        # Listen for messages
        async for message in websocket:
            data = json.loads(message)
            # print('I received a message for SR!', data)
            print("I received a message for SR! - data too big")

            try:
                audio_data = base64.b64decode(data["audio"])
                (text, lang) = await transcribe_audio(audio_data)
                print(text)

                # Send back the transcribed text
                await websocket.send(
                    json.dumps(
                        {
                            "chatId": data["chatId"],
                            "userId": data["userId"],
                            "text": text,
                            "language": lang,
                        }
                    )
                )
            except Exception as e:
                print(e)


async def main():
    uri = SERVER_ADDRESS  # Ensure this is a ws:// or wss:// URL
    await handle_websocket(uri)


if __name__ == "__main__":
    asyncio.run(main())
