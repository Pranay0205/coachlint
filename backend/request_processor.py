import os
from dotenv import load_dotenv
from gemini_wrapper import generate_explanation

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

def process_current_error_message(request, api_key):
    prompt = f"Explain the error in a very short manner should contain only two lines and shortly explain how to resolve it: {request.errorMessage}\n"
    
    ai_explanation = generate_explanation(prompt, api_key)
    
    message = f"""{request.fileName}:{request.lineNumber}:{request.columnNumber} timestamp: {request.timestamp}\n\n{ai_explanation}"""
    
    return {"message": message}

def process_hover_error_message(request, api_key):
    prompt = f"Explain the error in a very short manner should contain only two lines and shortly explain how to resolve it: {request.errorMessage}\n"

    ai_explanation = generate_explanation(prompt, api_key)
    
    return {"message": ai_explanation}