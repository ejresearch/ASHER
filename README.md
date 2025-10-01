# ASHER - AI Provider A/B/C/D Testing Platform

**AI Simultaneous Heuristic Evaluation & Response**

ASHER is a powerful web-based tool for simultaneously testing and comparing multiple AI providers side-by-side. Send the same prompt to OpenAI, Claude, Gemini, and Grok at once and compare their responses in real-time.

## Features

- 🚀 **Simultaneous Testing** - Send prompts to 4 AI providers at once
- 🔄 **Real-time Comparison** - See responses side-by-side in a 2x2 grid
- 📊 **Performance Metrics** - Track tokens used and response time for each provider
- 📎 **Document Upload** - Upload reference documents (PDF, DOCX, MD, TXT, CSV, HTML, JSON) for context
- 🎨 **Modern UI** - Clean interface with light/dark mode toggle
- 💾 **Export Results** - Export conversations as JSON, Markdown, or Plain Text
- ⚙️ **Model Switching** - Choose between different models from each provider
- 🔒 **Privacy First** - API keys stored locally in your browser

## Supported Providers & Models

### OpenAI
- GPT-4.1
- GPT-4o
- o3
- o4-mini

### Anthropic Claude
- Claude Sonnet 4.5
- Claude Opus 4.1
- Claude Sonnet 4

### Google Gemini
- Gemini 2.5 Pro
- Gemini 2.5 Flash

### xAI Grok
- Grok 4
- Grok 3

## Quick Start

### Prerequisites

- Python 3.8 or higher
- API keys for the providers you want to test:
  - [OpenAI API key](https://platform.openai.com/api-keys)
  - [Anthropic API key](https://console.anthropic.com/)
  - [Google API key](https://makersuite.google.com/app/apikey)
  - [xAI API key](https://console.x.ai/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ASHER.git
   cd ASHER
   ```

2. **Create a virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**

   Create a `.env` file in the `backend` directory:
   ```bash
   cd backend
   touch .env
   ```

   Add your API keys to `.env`:
   ```
   OPENAI_API_KEY=sk-your-openai-key-here
   ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
   GOOGLE_API_KEY=your-google-api-key-here
   XAI_API_KEY=your-xai-api-key-here
   ```

5. **Start the backend server**
   ```bash
   cd backend
   python server.py
   ```

   The server will start on `http://localhost:8080`

6. **Open the frontend**

   Simply open `index.html` in your web browser, or use a local server:
   ```bash
   # Navigate to project root
   cd ..

   # Option 1: Python's built-in server
   python3 -m http.server 8000

   # Option 2: Node.js http-server (if installed)
   npx http-server -p 8000
   ```

   Then visit `http://localhost:8000` in your browser.

## Usage

### Basic Testing

1. **Configure API Keys** (first time only)
   - Click the gear icon (⚙️) next to each provider
   - Enter your API key
   - Select your preferred model
   - Click "Save"

2. **Set System Prompt** (optional)
   - Enter instructions that apply to all providers
   - Example: "You are a helpful assistant specializing in technical writing"

3. **Add Reference Documents** (optional)
   - Click "📎 Upload" to upload files
   - Or click "+ Text" to paste text directly
   - Documents are included in context for all providers

4. **Send Test Messages**
   - Type your prompt in the input box at the bottom
   - Click "Send to All Providers"
   - Watch responses appear in real-time across all panels

5. **Compare Results**
   - Review each provider's response
   - Check token usage and response time
   - Use the expand button (⛶) to focus on one panel

### Advanced Features

- **Panel Expansion** - Click ⛶ next to any provider name to expand that panel to fullscreen
- **Export Results** - Use the export buttons to save conversations in different formats
- **Clear Chats** - Reset all conversations with the "Clear All Chats" button
- **Theme Toggle** - Switch between light and dark mode using the toggle in the header

## Project Structure

```
ASHER/
├── index.html              # Main HTML file
├── css/
│   └── styles.css         # Application styles
├── js/
│   └── app_new.js         # Frontend JavaScript
├── backend/
│   ├── server.py          # FastAPI backend server
│   ├── ai_providers.py    # AI provider integrations
│   └── document_parser.py # Document parsing utilities
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

## API Endpoints

The backend provides the following REST API:

- `GET /providers` - List all available providers and their status
- `POST /chat` - Send a chat message to a specific provider
- `POST /upload/document` - Upload and parse a reference document

## Environment Variables

Required environment variables in `backend/.env`:

```bash
OPENAI_API_KEY=         # Your OpenAI API key
ANTHROPIC_API_KEY=      # Your Anthropic API key
GOOGLE_API_KEY=         # Your Google API key
XAI_API_KEY=            # Your xAI API key
```

## Troubleshooting

### Providers showing as unavailable

- Check that your API keys are correctly set in the `.env` file
- Verify the keys don't have `your-` prefix (placeholder values)
- Restart the backend server after adding/updating keys

### CORS errors

- Ensure the backend is running on port 8080
- Check that you're accessing the frontend from a proper HTTP server (not `file://`)

### Document upload fails

- Verify all document parsing dependencies are installed
- Check file format is supported (PDF, DOCX, MD, TXT, CSV, HTML, JSON)
- Ensure file size is reasonable (< 10MB recommended)

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## License

MIT License - feel free to use this project for any purpose.

## Credits

Built with:
- FastAPI for the backend
- Vanilla JavaScript for the frontend
- OpenAI, Anthropic, Google, and xAI SDKs
