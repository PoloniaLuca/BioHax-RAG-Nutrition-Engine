import openai
import instructor
from pydantic import BaseModel

client = instructor.from_openai(openai.OpenAI(base_url='http://localhost:11434/v1', api_key='ollama'), mode=instructor.Mode.JSON)

class Test(BaseModel):
    name: str

print('Calling...')
try:
    res = client.chat.completions.create(model='llama3', response_model=Test, messages=[{'role': 'user', 'content': 'Say your name is Bob'}], max_retries=1)
    print("Success:", res)
except Exception as e:
    print("Failed!")
    import traceback
    traceback.print_exc()
