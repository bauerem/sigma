from python.llm_utils import perform_basic_search


start_utterances = {
    "en-gb": "Hello, This is the Canton of Saint Gallen Exchange. How may I help you?",
    "de-ch": "Hallo, hier ist die Börse des Kantons St. Gallen. Wie kann ich Ihnen helfen?",
}
rag_prompt = """A citizen is having a phone conversation with a state official. The conversation so far has gone as follows:
<conversation>
You need to provide the next utterance of the Official. You can refer to the following snippets of information in order to construct your reply
<snippets>
Be precise. Please only answer in <language>
"""


class chatBot:
    def __init__(self, retriever):
        self.history = []
        self.state = "INIT"
        self.lang = "de-ch"
        self.retriever = retriever
        self.next_utterance = ""
        self.last_utterance = ""

    def run_conversation(self, last_utterance):
        self.last_utterance = last_utterance
        state_map = {"INIT": self.init, "RAG": self.rag, "RULE": self.rule}
        state_map[self.state]()
        if self.state != "INIT":
            self.history.append(("Citizen", self.last_utterance))
        self.history.append(("Official", self.next_utterance))
        return self.last_utterance

    def init(self):
        self.next_utterance = start_utterances[self.lang]

    def rule(self):
        # Not Implemented
        self.rag()

    def rag(self):
        perform_basic_search("Immigration Dokument beantragen St. Gallen")
        retrieved_corpus = self.retriever(
            last=self.last_utterance, history=self.history
        )
        history = "\n".join(b + ": " + t for b, t in self.history)
        ret = "\n\n".join(str(i) + ". " + r for i, r in enumerate(retrieved_corpus))
        res = call_gpt4_api(
            rag_prompt.replace("<conversation>", history)
            .replace("<snippets>", ret)
            .replace("<language>", self.language)
        )
        reply = res[0]["message"]["content"]
        self.next_utterance = reply
