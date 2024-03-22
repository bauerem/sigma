import os

server_address = "wss://sigma.jonathanlehner.com"
# server_address = "ws://localhost:3000"

# Replace 'YOUR_ENV_VARIABLE_NAME' with the actual name of your environment variable
env_variable_value = os.environ.get("SERVER_ADDRESS")

if env_variable_value is not None:
    print(f"The value of MY_ENV_VARIABLE is: {env_variable_value}")
    server_address = env_variable_value
else:
    print("The environment variable is not set.")

SERVER_ADDRESS = server_address
import dotenv

dotenv.load_dotenv()
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
