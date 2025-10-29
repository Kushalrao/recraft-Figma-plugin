# Recraft API Proxy

Simple proxy server to bypass CORS for Figma plugin.

## Deploy to Vercel

1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Import this folder or connect GitHub repo
4. Add environment variable: `RECRAFT_API_KEY`
5. Deploy!

## Use in Plugin

After deployment, you'll get a URL like:
`https://your-project.vercel.app/api/recraft`

Use this URL instead of leaning the Recraft API directly.

