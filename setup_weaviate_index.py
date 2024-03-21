import os
import dotenv
import weaviate
from typing import List
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import CharacterTextSplitter
from langchain.retrievers.weaviate_hybrid_search import WeaviateHybridSearchRetriever
from langchain_core.documents.base import Document
from langchain_community.document_loaders import JSONLoader


dotenv.load_dotenv()
OPENAI_API_KEY_STARTHACK = os.getenv("OPENAI_API_KEY_STARTHACK")
WEAVIATE_URL_STARTHACK = os.getenv("WEAVIATE_URL_STARTHACK")

embeddings = OpenAIEmbeddings(api_key=OPENAI_API_KEY_STARTHACK)

# Connect to a WCS instance
client = weaviate.Client(url=WEAVIATE_URL_STARTHACK)

retriever = WeaviateHybridSearchRetriever(
    alpha=0.5,  # Weighting between keyword and semantic search
    client=client,
    index_name="Documents",
    text_key="text",
    attributes=[],  # No additional attributes for now
)

text_splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=250)

file_documents = []

if False:
    loader = JSONLoader(
        file_path="data.json",  # TODO set things like: jq_schema=".messages[].content", text_content=False
    )

    data: List[Document] = loader.load()

# Mock list of documents
data: List[Document] = [
    Document(
        id="1",
        page_content="This is a test document.",
        text="This is a test document.",
        # attributes={"title": "Test document"},
    ),
    Document(
        id="2",
        page_content="This is a test document.",
        text="This is another test document.",
        # attributes={"title": "Another test document"},
    ),
]

# Split the text into chunks
chunks: List[Document] = text_splitter.split_documents(data)

retriever.add_documents(chunks)
print("Upload completed.")
