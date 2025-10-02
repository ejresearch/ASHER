# ASHER Data Storage

## User Data Privacy

ASHER is designed to be **user-agnostic** and **privacy-focused**. Each user's data is stored locally in their browser and is never shared with others or pushed to git.

## How Data is Stored

### Browser LocalStorage (Current Implementation)
All user data is stored in the browser's localStorage:

- **Reference Documents** - Saved locally per browser
- **Saved Conversations** - Stored in browser only
- **System Prompts** - Browser-specific
- **Layout Preferences** - User's browser settings
- **API Keys** - Encrypted and stored locally (never sent to our servers)

### Data Isolation
- Each browser instance has completely separate data
- Data is NOT shared between users
- Data is NOT synced to any server
- Data is NOT committed to git

### What Gets Committed to Git
The repository contains ONLY:
- Source code
- Configuration templates
- Documentation
- Static assets (CSS, images, etc.)

**NEVER committed:**
- User conversations
- Reference documents
- API keys
- Any personal data

## Data Persistence

### Between Sessions
✅ Data persists between browser sessions (refresh, close/reopen)
✅ Saved conversations remain available
✅ Reference documents stay loaded
✅ Preferences are remembered

### When Clearing Data
❌ Clearing browser cache/localStorage will delete all data
❌ Using incognito/private mode = no persistence
❌ Switching browsers = fresh start (data is per-browser)

## Security Notes

1. **API Keys** - Stored in browser localStorage only, never sent to ASHER servers
2. **Conversations** - Stay on your machine, never uploaded
3. **Documents** - Processed locally, content stays private
4. **Git Safety** - .gitignore prevents accidental commits of user data

## For Developers

If you clone this repository:
- You get a fresh ASHER instance
- No user data from others
- Your data stays on your machine
- Safe to develop and test without data leaks

## Future: Database Options

If we add database support, it will be:
- SQLite file-based (per user)
- Added to .gitignore automatically
- Optional (localStorage is default)
- Still completely local
