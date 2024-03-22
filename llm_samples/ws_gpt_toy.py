#!/usr/bin/env python
import asyncio
from ws_gpt_handler import GPTHandler
from config import SERVER_ADDRESS, OPENAI_API_KEY
from system_messages import SYSTEM_MSG_DICT

if __name__ == '__main__':
    toy_name = "toy_simple"
    handler = GPTHandler(SYSTEM_MSG_DICT["toys"][toy_name], SERVER_ADDRESS)
    asyncio.run(handler.start_handler())