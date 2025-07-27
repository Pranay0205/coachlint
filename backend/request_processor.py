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


def process_code_review_message(request, api_key):
    prompt = f"""Review this Python code. Give EXACTLY 3 short suggestions only if there are issues otherwise don't include 📍 in your reponse and just say Good Code. Use the following format:

📍 Line X: CATEGORY → Brief issue → Why it matters

Categories: NAMING, PERFORMANCE, DOCS, LOGIC, POTENTIAL BUG, SECURITY, STYLE

Code:
{request.code}"""
    
    ai_response = generate_explanation(prompt, api_key)
    
    if ai_response is None:
        return {"message": "Unable to generate code review suggestions"}
    
    count = ai_response.count('📍')
    if count == 0:
        message = "✅ GREAT CODE! No issues found."
    else:
        message = f"🔍 {count} SUGGESTIONS\n\n{ai_response}"
    
    return {"message": message}