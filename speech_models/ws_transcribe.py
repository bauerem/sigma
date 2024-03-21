import asyncio
import websockets
import json
import whisper
import torch
import os
import sys
import base64

# Add the parent directory to sys.path to allow importing from there
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)

from config import SERVER_ADDRESS, OPENAI_API_KEY

# Get device
device = "cuda" if torch.cuda.is_available() else "cpu"

# Determine the Whisper model to load
# J: use whisper to detect - language = os.environ.get('APP_LANGUAGE', "en")
model_name = "tiny" if True else "large-v3"
model = whisper.load_model(model_name).to(device)


async def transcribe_audio(audio_data):
    # Save the received audio data to a file
    with open("./transcript.wav", "wb") as f:
        f.write(audio_data)

    # Load, process, and transcribe the audio
    audio = whisper.load_audio("./transcript.wav")
    audio = whisper.pad_or_trim(audio)
    mel = whisper.log_mel_spectrogram(
        audio, n_mels=128 if model_name == "large-v3" else 80
    ).to(device)

    # detect the spoken language
    _, probs = model.detect_language(mel)
    lang = max(probs, key=probs.get)
    print(f"Detected language: {lang}")

    # TODO: Don't hardcode the language
    lang = "de"

    options = whisper.DecodingOptions(fp16=device == "cuda", language=lang)
    result = whisper.decode(model, mel, options)
    return (result.text, lang)


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
