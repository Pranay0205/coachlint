import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
# Configure the client using an environment variable

client = genai.Client(api_key=api_key)

def generate_explanation(prompt: str) -> str | None:
  try: 
      response = client.models.generate_content(model="gemini-1.5-flash", contents=prompt)

      if response == None:
        return None
      
      return response.text
  except Exception as e:
      print(f"Error generating explanation: {e}")
