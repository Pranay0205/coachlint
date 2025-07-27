from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Union, Dict, Any
from request_processor import process_current_error_message
from request_processor import process_hover_error_message
from request_processor import process_code_review_message
import os

app = FastAPI()

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Your existing models...
class ErrorCode(BaseModel):
    value: str
    target: Optional[Any] = None

class ErrorLine(BaseModel):
    number: int
    text: str
    startChar: int
    endChar: int
    highlightedText: str

class SurroundingCodeLine(BaseModel):
    number: int
    text: str
    isErrorLine: bool
    prefix: str

class ErrorRequest(BaseModel):
    errorMessage: str
    errorSource: Optional[str] = None
    errorCode: Optional[Union[ErrorCode, str, Dict[str, Any]]] = None
    errorSeverity: Optional[int] = None
    fileName: Optional[str] = None
    fileLanguage: Optional[str] = None
    lineNumber: Optional[int] = None
    columnNumber: Optional[int] = None
    errorLine: Optional[ErrorLine] = None
    surroundingCode: Optional[List[SurroundingCodeLine]] = None
    timestamp: Optional[str] = None
    projectRoot: Optional[str] = None
    
class CodeReviewRequest(BaseModel):
    code: str
    fileName: Optional[str] = None

def get_api_key(authorization: Optional[str] = Header(None)):
    """
    Get API key from either if provided with Authorization header (from VS Code extension) or Environment variable (backend default)
    """
    
    # If Authorization header is provided, extract the key
    if authorization and authorization.startswith("Bearer "):
        client_api_key = authorization.replace("Bearer ", "")
        print(f"Using API key from client: {client_api_key[:8]}...")
        return client_api_key
    
    # Fall back to environment variable
    env_api_key = os.getenv("GEMINI_API_KEY")
    if env_api_key:
        print("Using API key from environment variable")
        return env_api_key

    raise HTTPException(status_code=401, detail="No API key provided")

@app.post("/current-error")
def current_error(
    request: ErrorRequest, 
    authorization: Optional[str] = Header(None)
):
    try:
        api_key = get_api_key(authorization)
        
        ai_explanation = process_current_error_message(request, api_key)
        print("response from AI:", ai_explanation)
        return ai_explanation
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing request: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/hover-error") 
def hover_error(
    request: ErrorRequest,
    authorization: Optional[str] = Header(None)
):
    try:
        api_key = get_api_key(authorization)

        ai_explanation = process_hover_error_message(request, api_key)
        print("response from AI:", ai_explanation)
        return ai_explanation
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing request: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
    
@app.post("/code-review")
def review_code(request: CodeReviewRequest, authorization: Optional[str] = Header(None)):
    api_key = get_api_key(authorization)
    return process_code_review_message(request, api_key)