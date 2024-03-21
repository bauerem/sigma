import os
import dotenv
import weaviate
from langchain.retrievers.weaviate_hybrid_search import WeaviateHybridSearchRetriever

# Load environment variables
dotenv.load_dotenv()
WEAVIATE_URL = os.getenv("WEAVIATE_URL_STARTHACK")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def setup_retriever():
    client = weaviate.Client(
        url=WEAVIATE_URL,
        additional_headers={
            "X-Openai-Api-Key": OPENAI_API_KEY,
        },
    )
    retriever = WeaviateHybridSearchRetriever(
        client=client,
        index_name="LangChain",
        text_key="text",
        attributes=[],  # Adjust attributes as needed
        create_schema_if_missing=True,
    )
    return retriever


def perform_basic_search(retriever, query):
    print(f"\nPerforming basic search for: '{query}'")
    results = retriever.get_relevant_documents(
        "AI integration in society",
        score=True,
    )
    for result in results:
        print(
            f"- {result.page_content[:100]}..."
        )  # Prints the beginning of the page_content


retriever = setup_retriever()
perform_basic_search(retriever, "Immigration Dokument beantragen St. Gallen")
