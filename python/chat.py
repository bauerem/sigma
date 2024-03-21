from llm_utils import perform_basic_search, call_gpt4_api


start_utterances = {
    "en-gb": "Hello, This is the Canton of Saint Gallen Telephone Exchange. How may I help you?",
    "de-ch": "Hallo, hier ist Telefonzentrale des Kantons St. Gallen. Wie kann ich Ihnen helfen?",
}
rag_prompt = """A citizen is having a phone conversation with a state official. The conversation so far has gone as follows:
<conversation>
You need to provide the next utterance of the Official. The official knows the following pieces of information:
<snippets>
Be precise. Please only answer in <language>
If you want to redirect the user, try to give a phone number where possible, not an address.
If you want to disconnect the call, say <EOC>
"""
retrieve_prompt="""A citizen is having a phone conversation with a state official. The conversation so far has gone as follows:
<conversation>
Summarize the conversation so far, focussing on what the citizen wants to know in their last utterance. Your response will be used to retrieve documents relevant to the question.
Be precise. Please only answer in <language>
If there is no query from the speaker, say <EOC>
"""


class chatBot:
    def __init__(self):
        self.history = []
        self.state = "INIT"
        self.lang = "en-gb"
        self.next_utterance = ""
        self.last_utterance = ""

    def run_conversation(self, last_utterance):
        self.last_utterance = last_utterance
        if self.state != "INIT":
            self.history.append(("Citizen", self.last_utterance))
        state_map = {"INIT": self.init, "RAG": self.rag, "RULE": self.rule}
        state_map[self.state]()
        self.history.append(("Official", self.next_utterance))
        return self.next_utterance

    def init(self):
        self.next_utterance = start_utterances[self.lang]
        self.state="RULE"

    def rule(self):
        # Not Implemented
        self.rag()

    def rag(self):
        history = "\n".join(b + ": " + t for b, t in self.history)
        query=call_gpt4_api(
            [],retrieve_prompt.replace("<conversation>", history).replace("<language>", "Swiss Standard German")
        )[0]["message"]["content"]
        if "<EOC>" in query:
            self.state="TERMINATE"
            self.next_utterance=""
            return
        print('\033[93m Query to Retriever:'+query+'\033[0m')
        retrieved_corpus = perform_basic_search(self.last_utterance)
        
        ret = "\n\n".join(str(i) + ". " + r for i, r in enumerate(retrieved_corpus))
        res = call_gpt4_api(
            [],rag_prompt.replace("<conversation>", history).replace("<snippets>", ret).replace("<language>", self.lang)
        )
        reply = res[0]["message"]["content"]
        if "<EOC>" in reply:
            self.state="TERMINATE"
            reply=reply.replace("<EOC>","")
        self.next_utterance = reply
