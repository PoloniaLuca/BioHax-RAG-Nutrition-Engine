import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Add the backend directory to python path
backend_dir = Path(__file__).parent.parent
sys.path.append(str(backend_dir))

from app.services.supabase_client import supabase
from app.services.rag_service import get_embedding

def ingest_documents(documents_dir: str):
    print(f"Starting ingestion from {documents_dir}...")
    doc_path = Path(documents_dir)
    
    if not doc_path.exists():
        print(f"Directory {documents_dir} does not exist.")
        return

    pdf_files = list(doc_path.glob("*.pdf"))
    if not pdf_files:
        print("No PDF files found.")
        return

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
    )

    for pdf_file in pdf_files:
        print(f"Processing {pdf_file.name}...")
        loader = PyPDFLoader(str(pdf_file))
        pages = loader.load()
        
        print(f"  Loaded {len(pages)} pages. Splitting text...")
        chunks = text_splitter.split_documents(pages)
        print(f"  Created {len(chunks)} chunks. Embedding and inserting to DB...")
        
        # Batch insert to Supabase
        batch_size = 50
        for i in range(0, len(chunks), batch_size):
            batch_chunks = chunks[i:i + batch_size]
            records = []
            
            for chunk in batch_chunks:
                embedding = get_embedding(chunk.page_content)
                records.append({
                    "content": chunk.page_content,
                    "metadata": chunk.metadata,
                    "embedding": embedding
                })
            
            try:
                response = supabase.table("bio_knowledge").insert(records).execute()
                print(f"  Inserted chunks {i} to {i + len(batch_chunks) - 1}")
            except Exception as e:
                print(f"  Error inserting batch {i}: {e}")

    print("Ingestion complete!")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Ingest PDFs into Supabase bio_knowledge")
    parser.add_argument("--dir", type=str, default="documents", help="Directory containing PDFs")
    args = parser.parse_args()
    
    docs_dir = str(backend_dir / args.dir)
    ingest_documents(docs_dir)
