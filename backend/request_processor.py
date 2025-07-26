import os
from dotenv import load_dotenv
from gemini_wrapper import generate_explanation

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

def process_error_message(request):
    
    prompt = f"Explain the following error in a very short manner should contain only two lines and shortly explain how to resolve it: {request}\n"
    message = generate_explanation(prompt)
    
    if message is None:
        return "Failed to generate explanation"
      
    return message


