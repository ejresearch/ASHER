# Quick Install Guide - ASHER

**Get up and running in 5 minutes!**

## Step 1: Download ASHER

```bash
git clone https://github.com/yourusername/ASHER.git
cd ASHER
```

## Step 2: Install Python Dependencies

```bash
pip install -r requirements.txt
```

That's it! All dependencies are installed.

## Step 3: Add Your API Keys

**Option 1: Copy the template**
```bash
cp backend/.env.example backend/.env
```
Then edit `backend/.env` with your actual keys.

**Option 2: Create from scratch**

Create a file called `.env` in the `backend` folder:

```bash
# On Mac/Linux:
touch backend/.env

# On Windows:
type nul > backend\.env
```

Open `backend/.env` and add your API keys:

```bash
# OpenAI - Starts with "sk-proj-" or "sk-"
OPENAI_API_KEY=sk-proj-Ab3dEfGhIjKlMnOpQrStUvWxYz1234567890

# Anthropic Claude - Starts with "sk-ant-"
ANTHROPIC_API_KEY=sk-ant-api03-Ab3dEfGhIjKlMnOpQrStUvWxYz1234567890

# Google Gemini - Starts with "AIza"
GOOGLE_API_KEY=AIzaSyAb3dEfGhIjKlMnOpQrStUvWxYz123456

# xAI Grok - Format varies
XAI_API_KEY=xai-Ab3dEfGhIjKlMnOpQrStUvWxYz1234567890
```

### Get Your API Keys:

| Provider | Get Key Here | Key Format |
|----------|-------------|------------|
| **OpenAI** | https://platform.openai.com/api-keys | `sk-proj-...` or `sk-...` |
| **Anthropic** | https://console.anthropic.com/ | `sk-ant-api03-...` |
| **Google** | https://makersuite.google.com/app/apikey | `AIza...` |
| **xAI** | https://console.x.ai/ | Format varies |

### Important Notes:

✅ **Do this:** Copy the entire key including the prefix (sk-, AIza, etc.)
❌ **Don't do this:** Add quotes around the key
❌ **Don't do this:** Add spaces before or after the key

**Example - Correct:**
```
OPENAI_API_KEY=sk-proj-abc123def456
```

**Example - Wrong:**
```
OPENAI_API_KEY="sk-proj-abc123def456"  ❌ No quotes
OPENAI_API_KEY= sk-proj-abc123def456   ❌ No space before key
```

💡 **Tip:** You only need keys for the providers you want to use!

## Step 4: Start ASHER

**Terminal 1** - Start the backend:
```bash
cd backend
python server.py
```

You should see: `✅ Server running on http://localhost:8001`

**Terminal 2** - Start the frontend:
```bash
# From the ASHER root directory
python -m http.server 8080
```

## Step 5: Open ASHER

Open your browser and go to: **http://localhost:8080**

🎉 **Done!** You should see the ASHER interface.

---

## First Time Setup

1. Click the gear icon ⚙️ next to each AI provider
2. Enter your API key
3. Click "Save"
4. Start chatting!

---

## Having Issues?

### "Module not found" error
```bash
# Make sure you're in the ASHER directory, then:
pip install -r requirements.txt
```

### "Port already in use"
```bash
# Backend (try port 8002 instead):
cd backend
python server.py --port 8002

# Frontend (try port 8081 instead):
python -m http.server 8081
```

### "Provider unavailable"
- Check your API keys in `backend/.env`
- Make sure there are no spaces or quotes around the keys
- Restart the backend server

### Still stuck?
Open an issue: https://github.com/yourusername/ASHER/issues

---

## One-Line Install (Advanced Users)

```bash
git clone https://github.com/yourusername/ASHER.git && cd ASHER && pip install -r requirements.txt && echo "Now add your API keys to backend/.env"
```
