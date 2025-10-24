"""
ASHER Standalone Backend
AI Provider A/B/C/D Testing Server
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
import json
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import AI providers
from ai_providers import AIProviderManager
from document_parser import DocumentParser

# In-memory document storage (persists for session)
uploaded_documents = {}

# Create FastAPI app
app = FastAPI(
    title="ASHER - AI Testing Lab",
    description="Standalone A/B/C/D Testing for Multiple AI Providers",
    version="1.0.0"
)

# CORS Configuration - Allow all origins for standalone tool
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files (frontend)
# Get the parent directory (ASHER root)
import pathlib
parent_dir = pathlib.Path(__file__).parent.parent
app.mount("/static", StaticFiles(directory=str(parent_dir)), name="static")

# Serve index.html at root and other routes
from fastapi.responses import FileResponse

@app.get("/index.html")
async def serve_index():
    return FileResponse(str(parent_dir / "index.html"))

@app.get("/manifest.json")
async def serve_manifest():
    return FileResponse(str(parent_dir / "manifest.json"))

@app.get("/service-worker.js")
async def serve_sw():
    return FileResponse(str(parent_dir / "service-worker.js"))

# Serve CSS files
@app.get("/css/{file_name}")
async def serve_css(file_name: str):
    return FileResponse(str(parent_dir / "css" / file_name))

# Serve JS files
@app.get("/js/{file_name}")
async def serve_js(file_name: str):
    return FileResponse(str(parent_dir / "js" / file_name))

# Serve icons
@app.get("/icons/{file_name}")
async def serve_icons(file_name: str):
    return FileResponse(str(parent_dir / "icons" / file_name))

# Request/Response Models
class AsherTestRequest(BaseModel):
    provider: str
    message: str
    system_prompt: str = ""
    conversation_history: Optional[List[Dict]] = []
    model: Optional[str] = None
    temperature: Optional[float] = None
    api_key: Optional[str] = None


class AsherTestResponse(BaseModel):
    provider: str
    reply: str
    success: bool
    error: Optional[str] = None


# Root endpoint
@app.get("/")
def root():
    return {
        "name": "ASHER - AI Testing Lab",
        "version": "1.0.0",
        "description": "Standalone A/B/C/D testing for AI providers",
        "providers": ["OpenAI", "Anthropic Claude", "Google Gemini", "xAI Grok"],
        "endpoints": {
            "/": "This info page",
            "/health": "Health check",
            "/providers": "List available providers",
            "/asher/test": "Test a single provider",
            "/asher/batch": "Test multiple providers simultaneously",
            "/upload/document": "Upload and parse a document"
        }
    }


# Health check
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ASHER Testing Lab",
        "version": "1.0.0"
    }


# List providers
@app.get("/providers")
def list_providers():
    """List all available AI providers and their status"""
    providers = AIProviderManager.list_providers()
    return {"providers": providers}


# Test single provider
@app.post("/asher/test", response_model=AsherTestResponse)
async def test_provider(request: AsherTestRequest):
    """
    Test a single AI provider with custom system prompt and reference documents
    """
    try:
        # Build messages list from conversation history
        messages = []

        # Add conversation history if exists
        if request.conversation_history:
            messages.extend(request.conversation_history)

        # Add current message (avoid duplicating if already in history)
        if not messages or messages[-1].get('content') != request.message:
            messages.append({
                "role": "user",
                "content": request.message
            })

        # Call the AI provider
        reply = AIProviderManager.chat(
            provider_id=request.provider,
            messages=messages,
            system_prompt=request.system_prompt
        )

        return AsherTestResponse(
            provider=request.provider,
            reply=reply,
            success=True,
            error=None
        )

    except ValueError as e:
        # Invalid provider ID
        raise HTTPException(
            status_code=400,
            detail=f"Invalid provider: {str(e)}"
        )

    except Exception as e:
        # Provider error (e.g., API key not configured, rate limit, etc.)
        error_message = str(e)

        # Check for common errors and provide helpful messages
        if "not available" in error_message.lower():
            if "OPENAI_API_KEY" in error_message:
                error_message = "OpenAI API key not configured. Set OPENAI_API_KEY in .env file."
            elif "ANTHROPIC_API_KEY" in error_message:
                error_message = "Anthropic API key not configured. Set ANTHROPIC_API_KEY in .env file."
            elif "GOOGLE_API_KEY" in error_message:
                error_message = "Google API key not configured. Set GOOGLE_API_KEY in .env file."
            elif "XAI_API_KEY" in error_message:
                error_message = "xAI API key not configured. Set XAI_API_KEY in .env file."

        return AsherTestResponse(
            provider=request.provider,
            reply="",
            success=False,
            error=error_message
        )


# Batch test multiple providers
@app.post("/asher/batch")
async def batch_test(
    message: str,
    system_prompt: str = "",
    providers: Optional[List[str]] = None
):
    """
    Send the same message to multiple providers simultaneously
    Returns all responses at once
    """
    # Default to all 4 main providers
    if not providers:
        providers = ['openai-gpt4', 'claude-sonnet', 'gemini-flash', 'grok']

    results = {}

    for provider_id in providers:
        try:
            reply = AIProviderManager.chat(
                provider_id=provider_id,
                messages=[{"role": "user", "content": message}],
                system_prompt=system_prompt
            )
            results[provider_id] = {
                "success": True,
                "reply": reply,
                "error": None
            }
        except Exception as e:
            results[provider_id] = {
                "success": False,
                "reply": "",
                "error": str(e)
            }

    return {
        "message": message,
        "system_prompt": system_prompt,
        "results": results
    }


# Status endpoint
@app.get("/asher/status")
async def asher_status():
    """Get ASHER testing environment status"""
    providers = AIProviderManager.list_providers()

    # Filter to main 4 providers
    main_providers = ['openai-gpt4', 'claude-sonnet', 'gemini-flash', 'grok']
    asher_providers = [p for p in providers if p['id'] in main_providers]

    return {
        "service": "ASHER Testing Lab",
        "version": "1.0.0",
        "available": True,
        "providers": asher_providers,
        "total_providers": len(asher_providers),
        "available_providers": sum(1 for p in asher_providers if p['available'])
    }


# Upload document endpoint
@app.post("/upload/document")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload and parse a document file
    Supports: TXT, DOCX, MD, PDF, CSV, HTML, JSON
    """
    try:
        # Get file extension
        filename = file.filename
        ext = filename.lower().split('.')[-1]

        # Check if file type is supported
        supported = DocumentParser.get_supported_extensions()
        if ext not in supported:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: .{ext}. Supported types: {', '.join(supported)}"
            )

        # Read file content
        file_content = await file.read()

        # Parse the document
        try:
            text_content = DocumentParser.parse_file(filename, file_content)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        # Store document in memory
        doc_id = str(datetime.now().timestamp())
        uploaded_documents[doc_id] = {
            "id": doc_id,
            "filename": filename,
            "content": text_content,
            "file_type": ext,
            "size": len(file_content),
            "uploaded_at": datetime.now().isoformat()
        }

        return {
            "success": True,
            "id": doc_id,
            "filename": filename,
            "content": text_content,
            "file_type": ext,
            "size": len(file_content)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing file: {str(e)}"
        )


# Get all uploaded documents
@app.get("/documents")
async def get_documents():
    """Get all uploaded documents"""
    return {
        "documents": list(uploaded_documents.values()),
        "count": len(uploaded_documents)
    }


# Delete a document
@app.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete an uploaded document"""
    if doc_id in uploaded_documents:
        deleted = uploaded_documents.pop(doc_id)
        return {
            "success": True,
            "message": f"Document '{deleted['filename']}' deleted"
        }
    else:
        raise HTTPException(status_code=404, detail="Document not found")


if __name__ == "__main__":
    import uvicorn
    print("🧪 Starting ASHER Testing Lab...")
    print("📡 Server will run at: http://localhost:8001")
    print("🌐 Open frontend at: file:///Users/elle_jansick/ASHER/index.html")
    uvicorn.run(app, host="0.0.0.0", port=8001)
