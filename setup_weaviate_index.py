from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import CharacterTextSplitter
from langchain.retrievers.weaviate_hybrid_search import WeaviateHybridSearchRetriever
import weaviate
from weaviate.embedded import EmbeddedOptions
import dotenv

dotenv.load_dotenv()

client = weaviate.Client(embedded_options=EmbeddedOptions())

retriever = WeaviateHybridSearchRetriever(
    alpha=0.5,  # Weighting between keyword and semantic search
    client=client,
    index_name="starthack-1noigzvf",  #  Sandbox index
    text_key="text",
    attributes=[],  # No additional attributes for now
)


text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
docs = text_splitter.split_documents(texts)

embeddings = OpenAIEmbeddings()
