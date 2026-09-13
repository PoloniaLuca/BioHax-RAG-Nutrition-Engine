# BioHax RAG Engine

A mobile application utilizing a custom RAG (Retrieval-Augmented Generation) pipeline. It embeds biohacking and scientific literature into a Vector Database to ground LLM generation, avoiding hallucinations and delivering personalized, constraint-based outputs.

## 🛠 Technology Stack

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white" alt="LangChain" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase Vector DB" />
  <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI" />
</p>

<!-- ## 📱 Demo

*Querying the RAG engine and receiving grounded, personalized outputs based on the ingested scientific literature.*

<p align="center">
  <!-- Replace the `src` paths with your actual screenshots or a GIF -->
  <!-- <img src="docs/assets/query-screenshot.png" alt="User Query Screenshot" width="300" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="docs/assets/response-screenshot.png" alt="RAG Response Screenshot" width="300" />
</p> -->

<!-- > **Note for the developer**: You can replace the two screenshot `<img>` tags above with a single GIF like this:
> `<img src="docs/assets/demo.gif" alt="App Demo" width="300" />` -->

## 🏗 System Architecture

- **Client Application**: Built with React Native and Expo, providing a seamless mobile interface.
- **Orchestration Layer**: A FastAPI backend that coordinates the custom RAG pipeline.
- **LLM & Agent Logic**: LangChain is used to orchestrate interactions with OpenAI and Ollama, utilizing structured outputs (via Instructor) for constraint-based generation.
- **Knowledge Base**: Supabase (`pgvector`) operates as the Vector Database. It stores dense embeddings of biohacking literature and scientific research papers.
- **Document Ingestion**: Custom scripts using PyPDF process, chunk, and embed raw scientific literature into the vector space.

## 🚀 Getting Started

### Prerequisites

- Node.js & npm
- Python 3.10+
- A Supabase Project (with the pgvector extension enabled)
- OpenAI API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd BioHax-RAG-Nutrition-Engine
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
   *Create a `.env` file in the `backend` directory and add your API keys (e.g., `OPENAI_API_KEY`, Supabase credentials).*

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```
   *Create a `.env` file in the `frontend` directory and add your Expo/Supabase public keys.*

4. **Run the Infrastructure**
   - **Backend**: `uvicorn app.main:app --reload` (or your specific start script)
   - **Frontend**: `npm start`
