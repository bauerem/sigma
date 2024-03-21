from load_key import *
from litellm import completion
from time import sleep
def call_gpt4_api(history, prompt, retries: int = 3):
    try:
        response = completion(model="gpt-4-turbo-preview", messages=[{"role":"system", "content":prompt}]+history)
    except Exception as e:
        print(e)
        if retries==0:
            pass
        sleep(2**4-retries)
        return call_gpt4_api(history, prompt, repeat, retries-1)
    return response["choices"]
