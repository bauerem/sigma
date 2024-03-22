# Σ - The Full Voice ChatBot Solution

We built this The Full Voice ChatBot Solution for the municipality of St. Gallen in Switzerland as part of the Start Hack challenge.

## Build and deploy

    cd server
    docker build . -t jonathanlehner/sigma
    docker push jonathanlehner/sigma
    DOCKER_HOST="ssh://root@46.101.201.11" docker pull jonathanlehner/sigma
    DOCKER_HOST="ssh://root@46.101.201.11" docker-compose up -d

## Launch LLM

    cd llm_samples
    python ws_gpt_handler.py

## Launch TTS and transcription

    cd speech_models
    pip install -r requirements.txt
    python ws_transcribe.py
    python ws_tts.py
