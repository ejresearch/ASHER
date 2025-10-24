# ASHER v1.2.0
## AI Provider A/B/C/D Testing Platform

**Easily customize prompts and test four LLMs to see what works best.**

Test OpenAI, Claude, Gemini, and Grok simultaneously with full per-provider configuration, temperature control, and the latest 2025 models.

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

## ✨ Features

### 🎯 NEW in v1.2.0
- **Accordion Provider Configuration** - Expandable/collapsible menus for each provider
- **Per-Provider Model Selection** - Choose specific models for each AI (GPT-5, Claude Sonnet 4.5, etc.)
- **Temperature Sliders** - Visual control over creativity/randomness (0-2 scale)
- **Per-Provider API Keys** - Override global keys or configure on-the-fly
- **Latest 2025 Models** - All providers updated with newest API models
- **Enhanced Editorial Design** - Warm color palette, smooth animations, micro-interactions

### Core Testing
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
- **Editorial Design** - Warm terracotta, cream, and sage color palette
- **Light/Dark Mode** - Eye-friendly theme toggle
- **Responsive Layout** - Works on desktop, tablets, and mobile
- **PWA Support** - Install as native app
- **Panel Expansion** - Focus on one provider's response
- **Keyboard Shortcuts** - Fast navigation (Esc, Cmd+K, Cmd+Enter)

---

## 🎭 Supported Models (2025 Latest)

| Provider | Models Available |
|----------|-----------------|
| **OpenAI** | GPT-5, GPT-5 Mini, GPT-4.1, GPT-4.1 Nano, o3-mini (Reasoning), GPT-4o, GPT-4o Mini |
| **Anthropic** | Claude Sonnet 4.5, Claude Haiku 4.5, Claude Opus 4.1/4, Claude Sonnet 4, Claude 3.5 Sonnet, Claude 3 Opus/Haiku |
| **Google** | Gemini 2.5 Pro, Gemini 2.5 Flash/Flash-Lite, Gemini 2.0 Flash/Flash-Lite |
| **xAI** | Grok 4, Grok 4 Fast/Heavy, Grok 3/3 Mini, Grok 2, Grok Code Fast (Reasoning) |

**Total: 27 Models** - Configure each provider independently with specific models and temperature settings

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

## 📝 Changelog

### v1.2.0 (2025-10-24) - "Accordion Edition"

**New Features:**
- ✨ Accordion-style provider configuration with expand/collapse
- ✨ Per-provider model selection from dropdown menus
- ✨ Visual temperature sliders with live value display
- ✨ Per-provider API key input fields
- ✨ Auto-save configuration to localStorage

**Model Updates:**
- 📦 Updated OpenAI models: GPT-5, GPT-5 Mini, GPT-4.1, o3-mini
- 📦 Updated Claude models: Sonnet 4.5, Haiku 4.5, Opus 4.1
- 📦 Updated Gemini models: 2.5 Pro, 2.5 Flash/Flash-Lite
- 📦 Updated Grok models: Grok 4, 4 Fast, 4 Heavy, Code Fast
- 📦 Total: 27 latest 2025 models

**Design Improvements:**
- 🎨 Enhanced editorial design with warm color palette
- 🎨 Smooth accordion animations and transitions
- 🎨 Improved hover effects and micro-interactions
- 🎨 Better visual hierarchy and spacing
- 🎨 Enhanced focus states with glowing rings

**Bug Fixes:**
- 🐛 Fixed configuration panel spacing and overflow
- 🐛 Fixed provider checkbox functionality
- 🐛 Improved mobile responsiveness

### v1.0.0 (2025-10-23) - "Initial Release"

**Core Features:**
- 🎉 A/B/C/D testing for 4 major AI providers
- 🎉 System prompts and reference document upload
- 🎉 Conversation history and export
- 🎉 Dark/light mode toggle
- 🎉 Responsive design

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

---

**Made with ❤️ for the AI community**
