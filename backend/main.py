from multiprocessing import process
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Union, Dict, Any
from request_processor import process_error_message

app = FastAPI()

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define nested models for complex objects
class ErrorCode(BaseModel):
    value: str
    target: Optional[Any] = None  # This could be various types

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
    errorCode: Optional[Union[ErrorCode, str, Dict[str, Any]]] = None  # Can be object or string
    errorSeverity: Optional[int] = None
    fileName: Optional[str] = None
    fileLanguage: Optional[str] = None
    lineNumber: Optional[int] = None
    columnNumber: Optional[int] = None
    errorLine: Optional[ErrorLine] = None  # Object
    surroundingCode: Optional[List[SurroundingCodeLine]] = None  # Array of objects
    timestamp: Optional[str] = None
    projectRoot: Optional[str] = None

@app.post("/explain-error")
def explain_error(request: ErrorRequest):
 
    message = process_error_message(request)
    print("🔍 Processed message:", message)
    return {
        "message": message,
        "status": "success"
    }