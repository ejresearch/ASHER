# ASHER
## LLM Testing Platform Developed by YT Research

**Compare AI providers side-by-side in real-time.**

Test OpenAI, Claude, Gemini, and Grok simultaneously with the same prompt and see how they compare.

---

## Quick Start

**3 commands to get started:**

```bash
git clone https://github.com/yourusername/ASHER.git
cd ASHER
pip install -r requirements.txt
```

**Add your API keys:**
```bash
# Copy the template and edit it
cp backend/.env.example backend/.env
# Then add your actual API keys to backend/.env
```

**Start ASHER:**
```bash
# Terminal 1 - Backend
cd backend && python server.py

# Terminal 2 - Frontend
python -m http.server 8080
```

**Open:** http://localhost:8080

**Detailed instructions:** See [INSTALL.md](INSTALL.md)

---

## Features

### Core
- **Simultaneous Testing** - Send to 4 providers at once
- **Real-time Comparison** - Side-by-side quad or column layout
- **Token Tracking** - Monitor usage per provider
- **Conversation History** - Save and reload past conversations
- **Reference Documents** - Upload PDFs, DOCX, Markdown, TXT, CSV, HTML, JSON
- **Context Change Tracking** - Visual indicators when prompts/docs change mid-conversation

### Export & Data
- **Multiple Export Formats** - JSON, Plain Text, Markdown, PDF
- **Conversation Management** - Save, load, and manage conversation history
- **Document Control** - Enable/disable specific reference documents
- **Privacy First** - All data stored locally in browser (never shared)

### Interface
- **Modern Design** - Clean, professional UI
- **Light/Dark Mode** - Apple-style theme toggle
- **Responsive Layout** - Works on desktop and tablets
- **Panel Expansion** - Focus on one provider's response
- **Sync Scroll** - Scroll all panels together

---

## Supported Models

| Provider | Models |
|----------|--------|
| **OpenAI** | GPT-4.1, GPT-4o, o3, o4-mini |
| **Anthropic** | Claude Sonnet 4.5, Opus 4.1, Sonnet 4 |
| **Google** | Gemini 2.5 Pro, Gemini 2.5 Flash |
| **xAI** | Grok 4, Grok 3 |

**Mix and match models** - Configure each provider independently

---

## Requirements

- **Python 3.8+**
- **API Keys** (for providers you want to use):
  - [OpenAI](https://platform.openai.com/api-keys)
  - [Anthropic](https://console.anthropic.com/)
  - [Google](https://makersuite.google.com/app/apikey)
  - [xAI](https://console.x.ai/)

---

## How to Use

### First Time Setup

1. Click the hamburger menu on the left
2. Click the gear icon next to each provider you want to use
3. Enter your API key and select a model
4. Click "Save"

### Testing AI Models

1. **Optional:** Add a system prompt (e.g., "You are a helpful coding assistant")
2. **Optional:** Upload reference documents or paste text
3. Type your prompt in the input box
4. Click "Send to All Providers"
5. Compare responses side-by-side

### Pro Tips

- **Save conversations** - Click "Save Current" to keep your chat history
- **Load conversations** - Click the folder icon to restore a saved conversation
- **Expand panels** - Focus on one provider's response
- **Sync scroll** - Enable to scroll all panels together
- **Track changes** - Context changes are marked with indicators
- **Theme** - Toggle light/dark mode in the header

## Project Structure

```
ASHER/
├── index.html              # Main app
├── css/styles.css          # Styling
├── js/app_new.js           # Frontend logic
├── backend/
│   ├── server.py           # FastAPI server
│   ├── ai_providers.py     # AI integrations
│   └── document_parser.py  # File processing
├── requirements.txt        # Dependencies
├── INSTALL.md             # Step-by-step setup
└── DATA_STORAGE.md        # Privacy & data info
```

## Configuration

### API Keys (`backend/.env`)

**Key Format Reference:**

| Provider | Key Format | Example Prefix |
|----------|-----------|----------------|
| OpenAI | `sk-proj-...` or `sk-...` | Modern keys start with `sk-proj-` |
| Anthropic | `sk-ant-api03-...` | Always starts with `sk-ant-` |
| Google | `AIza...` | Always starts with `AIza` |
| xAI | Varies | Check xAI console |

**Important:**
- No quotes around keys
- No spaces before/after the `=`
- Copy the entire key including prefix
- Only add keys for providers you want to use

### Server Ports

- Backend: `http://localhost:8001` (default)
- Frontend: `http://localhost:8080` (configurable)

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Provider shows "unavailable" | Check API keys in `backend/.env`, restart backend |
| "Module not found" | Run `pip install -r requirements.txt` |
| Port already in use | Use different port: `python -m http.server 8081` |
| CORS errors | Make sure backend is running, use HTTP server (not file://) |
| Upload fails | Check file format (PDF, DOCX, MD, TXT, CSV, HTML, JSON) |

**Still stuck?** Open an issue: [GitHub Issues](https://github.com/yourusername/ASHER/issues)

---

## Privacy & Security

- All data stored locally in your browser
- API keys never leave your machine
- Conversations saved in localStorage only
- No data shared between users
- .gitignore prevents accidental data commits

See [DATA_STORAGE.md](DATA_STORAGE.md) for details.

---

## Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

## License

MIT License - Free to use for any purpose

---

## Credits

**Built with:**
- [FastAPI](https://fastapi.tiangolo.com/) - Backend framework
- [jsPDF](https://github.com/parallax/jsPDF) - PDF export
- OpenAI, Anthropic, Google, and xAI SDKs

**Developed by YT Research**
