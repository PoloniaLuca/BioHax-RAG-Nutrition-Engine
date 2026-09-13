from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "BioHax MVP"
    
    SUPABASE_URL: str
    SUPABASE_KEY: str
    
    # We will use OpenAI or Ollama depending on the setup. 
    # For Instructor, we might need OPENAI_API_KEY (can be a dummy if using Ollama)
    OPENAI_API_KEY: str = "dummy"
    
    class Config:
        env_file = ".env"

settings = Settings()
