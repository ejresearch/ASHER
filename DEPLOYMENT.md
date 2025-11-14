# ASHER Deployment Guide — Render

## Overview

ASHER is a unified FastAPI application that serves both the backend API and frontend static assets. This makes deployment straightforward - everything runs as a single service.

## Architecture

**Backend** (`backend/server.py`):
- FastAPI application
- Serves API endpoints (`/providers`, `/asher/test`, `/upload/document`, etc.)
- Mounts and serves frontend static assets
- Includes health check endpoint at `/health`

**Frontend**:
- Vanilla JavaScript, HTML, CSS
- Automatically detects API base URL (same origin in production)
- No build step required

## Quick Deploy to Render

### Option 1: Using render.yaml (Recommended)

The repository includes a `render.yaml` file for automated deployment.

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Render**
   - Go to [render.com](https://render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub account
   - Select the `ejresearch/ASHER` repository
   - Render will automatically detect `render.yaml`

3. **Add Environment Variables**

   In the Render dashboard, add these environment variables:

   ```
   OPENAI_API_KEY=sk-proj-...
   ANTHROPIC_API_KEY=sk-ant-...
   GOOGLE_API_KEY=AIza...
   XAI_API_KEY=...
   ```

   (Only add keys for providers you want to enable)

4. **Deploy**

   Render will automatically:
   - Install dependencies from `backend/requirements.txt`
   - Start the server with `uvicorn`
   - Assign a public URL like: `https://asher-demo.onrender.com`

### Option 2: Manual Setup

1. **Create New Web Service**
   - Dashboard → "New" → "Web Service"
   - Select "Build and deploy from Git repository"
   - Choose `ejresearch/ASHER`

2. **Configure Build Settings**
   ```
   Name: asher-demo
   Environment: Python
   Region: Oregon (or closest)
   Branch: main

   Build Command:
   cd backend && pip install -r requirements.txt

   Start Command:
   cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT
   ```

3. **Add Environment Variables** (same as Option 1)

4. **Deploy**

## Accessing Your Deployment

Once deployed, your ASHER instance will be available at:

```
https://YOUR-SERVICE-NAME.onrender.com/index.html
```

### Key URLs

- **Main App**: `https://YOUR-SERVICE-NAME.onrender.com/index.html`
- **API Docs**: `https://YOUR-SERVICE-NAME.onrender.com/docs`
- **Health Check**: `https://YOUR-SERVICE-NAME.onrender.com/health`

## Testing Your Deployment

1. **Open the app**: Navigate to `/index.html`

2. **Check browser console**:
   - No CORS errors
   - API calls should succeed

3. **Test providers**:
   - Configure a provider with your API key
   - Send a test prompt
   - Verify response appears

4. **Test document upload**:
   - Upload a PDF/DOCX file
   - Verify it's processed correctly

## Subdomain Setup (Optional)

To use a custom subdomain like `asher.ellejansick.com`:

1. **Add Custom Domain in Render**
   - Service Settings → "Custom Domains"
   - Add `asher.ellejansick.com`

2. **Update DNS**

   Add a CNAME record in your domain registrar:
   ```
   Type: CNAME
   Name: asher
   Value: YOUR-SERVICE-NAME.onrender.com
   ```

3. **SSL Certificate**

   Render automatically provisions SSL certificates for custom domains.

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Optional | OpenAI API key for GPT models |
| `ANTHROPIC_API_KEY` | Optional | Anthropic API key for Claude models |
| `GOOGLE_API_KEY` | Optional | Google API key for Gemini models |
| `XAI_API_KEY` | Optional | xAI API key for Grok models |
| `PORT` | Auto | Render provides this automatically |

**Note**: You only need to provide keys for the AI providers you want to test. ASHER gracefully handles missing providers.

## Free Tier vs Paid

### Free Tier
- **Pros**: No cost, perfect for demos
- **Cons**:
  - Sleeps after 15 min of inactivity
  - ~30 second cold start on first request
  - 750 hours/month free (enough for most demos)

### Paid Tier ($7/month)
- **Pros**:
  - Always online (no cold starts)
  - Better performance
  - More resources

**Recommendation**: Start with free tier. Upgrade if you need always-on availability.

## Monitoring

### View Logs
- Render Dashboard → Your Service → "Logs"
- Real-time log streaming available

### Health Checks
Render automatically monitors `/health` endpoint and restarts if unhealthy.

### Metrics
Available in Render dashboard:
- Request rate
- Response times
- Memory usage
- CPU usage

## Linking to Your Website

Update your sandbox page at `ellejansick.com/sandbox`:

```html
<a
  class="demo-link"
  href="https://asher-demo.onrender.com/index.html"
  target="_blank"
  rel="noopener noreferrer"
>
  Launch ASHER Demo
</a>
```

## Troubleshooting

### Deployment Fails

**Check build logs**:
- Ensure all dependencies in `requirements.txt` are valid
- Verify Python version compatibility

**Common fixes**:
```bash
# Update requirements if needed
pip freeze > backend/requirements.txt
```

### Cold Starts Too Slow

**Solutions**:
1. Upgrade to paid tier (removes cold starts)
2. Use a service like UptimeRobot to ping every 10 min
3. Accept the tradeoff for free hosting

### Provider Not Working

**Check**:
1. Environment variable is set correctly
2. API key is valid and has credits
3. No quotes or extra spaces in the key
4. Check service logs for error messages

### CORS Errors

**Should not happen** if:
- Frontend is served from same origin as API
- API is accessed via `window.location.origin`

**If it happens**:
- Check browser console for exact error
- Verify frontend is using correct API_BASE

## Updating Your Deployment

Render auto-deploys on every push to `main`:

```bash
# Make changes locally
git add .
git commit -m "Update ASHER"
git push origin main

# Render automatically deploys
```

**Manual Deploy**:
- Render Dashboard → Service → "Manual Deploy" → "Deploy latest commit"

## Security Notes

1. **Never commit API keys** - Use environment variables only
2. **Rate limiting** - Consider adding rate limits for public demos
3. **CORS** - Currently allows all origins; restrict in production if needed
4. **File uploads** - Already restricted to specific file types
5. **Authentication** - Consider adding auth for private demos

## Next Steps

1. ✅ Deploy ASHER to Render
2. ✅ Test thoroughly
3. ✅ Update ellejansick.com/sandbox with link
4. 📝 Monitor usage and performance
5. 🔄 Deploy LIZZY using similar process

## Support

- **Render Docs**: https://render.com/docs
- **ASHER Issues**: https://github.com/ejresearch/ASHER/issues
- **Email**: ellejansickresearch@gmail.com
