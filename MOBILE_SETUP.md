# ASHER Mobile Setup Guide

ASHER now supports Progressive Web App (PWA) installation on iPhone, iPad, and Android devices!

## 📱 Installing ASHER on Your iPhone/iPad

### Step 1: Set Up Your Backend Server

Your iPhone needs to connect to your Mac running the ASHER backend:

1. **Start the ASHER server on your Mac:**
   ```bash
   cd /Users/elle_jansick/ASHER
   python3 backend/server.py
   ```

2. **Find your Mac's local IP address:**
   ```bash
   # On Mac, run:
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   Look for something like: `192.168.1.xxx`

3. **Make sure your iPhone and Mac are on the same WiFi network**

### Step 2: Access ASHER from Your iPhone

1. Open **Safari** on your iPhone (must be Safari, not Chrome)
2. Go to: `http://YOUR_MAC_IP:8001/index.html`
   - Example: `http://192.168.1.123:8001/index.html`

### Step 3: Install as App

1. Tap the **Share** button (square with arrow pointing up) in Safari
2. Scroll down and tap **"Add to Home Screen"**
3. Name it **"ASHER"**
4. Tap **"Add"**

That's it! ASHER now appears on your home screen like a native app.

## 🎨 App Icons (Optional)

To display a custom icon, you need to add app icons:

1. Create or download two PNG icons:
   - `icon-192.png` (192x192 pixels)
   - `icon-512.png` (512x512 pixels)

2. Place them in: `/Users/elle_jansick/ASHER/icons/`

3. Suggested design:
   - Text "ASHER" on dark background
   - Or use an icon generator: https://www.pwabuilder.com/imageGenerator

Without custom icons, iOS will use a screenshot of your page.

## 🌐 Access from Anywhere (Optional)

To use ASHER when you're not on the same WiFi:

### Option 1: Use Ngrok (Easiest for Testing)
```bash
# Install ngrok
brew install ngrok

# Run ngrok to tunnel to your local server
ngrok http 8001

# Use the ngrok URL (like https://abc123.ngrok.io) on your phone
```

### Option 2: Deploy to Cloud (Production)

Deploy ASHER backend to a cloud service:
- **Railway**: https://railway.app (easiest)
- **Heroku**: https://heroku.com
- **AWS/Google Cloud**: More complex but scalable

Then update `API_BASE` in `/js/app_new.js` to your cloud URL.

## 📋 Features on Mobile

### ✅ What Works:
- All AI provider testing
- Side-by-side comparison
- System prompts & reference docs
- Save/load conversations
- Export results
- Dark/Light theme
- Responsive layout

### ⚠️ iOS Limitations:
- No push notifications (iOS PWA restriction)
- Must use Safari to install
- Limited offline mode
- Need network connection to backend

### 💡 Best Experience:
- **iPad**: Perfect for quad-split view comparing 4 AI responses
- **iPhone (Landscape)**: Good for 2x2 grid
- **iPhone (Portrait)**: Stacked vertical view

## 🔧 Troubleshooting

**"Can't connect to server"**
- Make sure backend is running: `python3 backend/server.py`
- Check your Mac's IP hasn't changed
- Confirm same WiFi network
- Try accessing in regular Safari first

**"Add to Home Screen" not appearing**
- Must use Safari browser (not Chrome)
- Try opening in a new tab
- Check you're on the index.html page

**App not loading after install**
- Check backend server is still running
- Verify network connection
- Try force-closing and reopening the app

**Icons not showing**
- Add icon files to `/icons/` folder
- Reinstall the app (delete and re-add to home screen)

## 🎯 Quick Start Checklist

- [ ] Start backend server on Mac
- [ ] Get Mac's IP address
- [ ] Connect iPhone/iPad to same WiFi
- [ ] Open Safari on device
- [ ] Navigate to `http://YOUR_IP:8001/index.html`
- [ ] Tap Share → Add to Home Screen
- [ ] Configure API keys (OpenAI, Claude, etc.)
- [ ] Start testing!

## 📞 Support

For issues or questions:
- Check console logs in Safari Web Inspector
- Verify CORS settings in `backend/server.py`
- Ensure all API keys are configured

Enjoy using ASHER on your mobile devices! 🚀
