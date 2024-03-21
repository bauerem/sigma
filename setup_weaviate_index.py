import json
import os
import dotenv
import weaviate
from typing import List
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import CharacterTextSplitter
from langchain.retrievers.weaviate_hybrid_search import WeaviateHybridSearchRetriever
from langchain_core.documents.base import Document


dotenv.load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
WEAVIATE_URL_STARTHACK = os.getenv("WEAVIATE_URL_STARTHACK")


def load_jsonl_to_documents(file_path: str) -> List[Document]:
    documents = []
    with open(file_path, "r", encoding="utf-8") as file:
        for line in file:
            # Parse the JSON object from the line
            json_obj = json.loads(line)
            # Create a Document object with the 'content' field
            doc = Document(
                id=str(
                    json_obj.get("id", "")
                ),  # Assuming there's an 'id' field; generate or adjust as necessary
                page_content=json_obj["content"],
                text=json_obj["content"],
                # Optionally, handle any additional attributes here
            )
            documents.append(doc)
    return documents


# embeddings = OpenAIEmbeddings(api_key=OPENAI_API_KEY)

print("Connecting to Weaviate...")
# Connect to a WCS instance
client = weaviate.Client(
    url=WEAVIATE_URL_STARTHACK,
    additional_headers={
        "X-Openai-Api-Key": os.getenv("OPENAI_API_KEY"),
    },
)

print("Connected to Weaviate.")
retriever = WeaviateHybridSearchRetriever(
    alpha=0.5,  # Weighting between keyword and semantic search
    client=client,
    index_name="LangChain",
    text_key="text",
    attributes=[],  # No additional attributes for now
    create_schema_if_missing=True,
)

text_splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=250)

# Load the data
print("Loading data...")
data: List[Document] = load_jsonl_to_documents("preprocessed_data.jsonl")

# Split the text into chunks
print("Splitting text into chunks...")
chunks: List[Document] = text_splitter.split_documents(data)

# TODO: Delete all documents in the index
print("Uploading chunks...")
retriever.add_documents(chunks)
print("Upload completed.")
