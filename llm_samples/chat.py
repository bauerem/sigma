from llm_utils import perform_basic_search, call_gpt4_api


start_utterances = {
    "en-gb": "Hello, This is the Canton of Saint Gallen Telephone Exchange. How may I help you?",
    "de-ch": "Hallo, hier ist Telefonzentrale des Kantons Sankt Gallen. Wie kann ich Ihnen helfen?",
}
end_utterances = {
    "en-gb": "If that is all, I shall now disconnect the call.",
    "de-ch": "Wenn das alles ist, werde ich jetzt das Telefongespräch beenden."
}
last_utterances = {
    "en-gb": "Have a nice day",
    "de-ch": "Schönen Tag"
}
clarify={
    "en-gb": "Could you please repeat yourself?",
    "de-ch": "Koennen Sie Das bitte Wiederhoelen?"
}
end_prompt = "A caller was asked if they are okay fine with disconnecting the call. They replied thir(they speak <language>):<utterance>. Did they agree to disconnect? only say 'yes' or 'no'"
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
"""


class chatBot:
    def __init__(self):
        self.history = []
        self.state = "INIT"
        self.lang = "de-ch"
        self.next_utterance = ""
        self.last_utterance = ""

    def run_conversation(self, last_utterance):
        self.last_utterance = last_utterance
        if self.state != "INIT":
            self.history.append(("Citizen", self.last_utterance))
        state_map = {"INIT": self.init, "RAG": self.rag, "RULE": self.rule, "OUTRO":self.outro, "CONFIRM":self.confirm}
        state_map[self.state]()
        self.history.append(("Official", self.next_utterance))
        return self.next_utterance

    def init(self):
        self.next_utterance = start_utterances[self.lang]
        self.state="RULE"

    def rule(self):
        # Not Implemented
        self.rag()
    def outro(self):
        self.next_utterance=end_utterances[self.lang]
        self.state="CONFIRM"
    def confirm(self):
        reply=call_gpt4_api(
            [],end_prompt.replace("<utterance>",self.last_utterance).replace("<language>", "Swiss Standard German")
        )[0]["message"]["content"]
        if "yes" in reply.lower():
            self.state="TERMINATE"
            self.next_utterance=last_utterances[self.lang]
        else:
            self.rag()
    def rag(self):
        history = "\n".join(b + ": " + t for b, t in self.history)
        query=call_gpt4_api(
            [],retrieve_prompt.replace("<conversation>", history).replace("<language>", "Swiss Standard German")
        )[0]["message"]["content"]
        # if "<Clarify>" in query and self.next_utterance!=clarify[self.lang]:
        #     self.next_utterance=clarify[self.lang]
        #     return
        print('\033[93m Query to Retriever:'+query+'\033[0m')
        retrieved_corpus = perform_basic_search(self.last_utterance)
        
        ret = "\n\n".join(str(i) + ". " + r for i, r in enumerate(retrieved_corpus))
        res = call_gpt4_api(
            [],rag_prompt.replace("<conversation>", history).replace("<snippets>", ret).replace("<language>", self.lang)
        )
        reply = res[0]["message"]["content"]
        if "<EOC>" in reply and len(self.history)>6:
            self.state="OUTRO"
            reply=reply.replace("<EOC>","")
        self.next_utterance = reply