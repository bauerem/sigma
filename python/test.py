from chat import chatBot
import warnings
warnings.filterwarnings("ignore")
chatbot=chatBot()
last=""
while(True):
    out=chatbot.run_conversation(last)
    print("Official:",out)
    if chatbot.state=="TERMINATE":
        break
    last=input()

