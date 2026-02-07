# Vanguard-Core Deployment Guide

## Alchemy API Key (NFT Vault Scanning)

The NFT Vault uses the [Alchemy NFT API](https://docs.alchemy.com/reference/getnfts) to scan wallet assets. A valid API key is required for production use.

### 1. Get a Free Key

1. Sign up at [dashboard.alchemy.com](https://dashboard.alchemy.com/)
2. Create an app on **Ethereum Mainnet**
3. Copy the API key from the app dashboard

### 2. Local Development

```bash
cp .env.example .env
# Edit .env and replace your_key_here with your actual key
```

Then inject the key into the page before the closing `</head>` tag:

```html
<meta name="alchemy-key" content="YOUR_KEY_HERE">
```

Or set it via JavaScript before the app initializes:

```html
<script>
  window.VNGRD_CONFIG = { ALCHEMY_KEY: 'YOUR_KEY_HERE' };
</script>
```

### 3. GitHub Pages Deployment

GitHub Pages serves static files — it cannot read server-side environment variables. There are two approaches:

#### Option A: GitHub Actions Build Injection (Recommended)

1. Go to **Settings > Secrets and variables > Actions** in your GitHub repo
2. Click **New repository secret**
3. Name: `ALCHEMY_KEY`, Value: your Alchemy API key
4. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Inject Alchemy Key
        run: |
          sed -i "s|<head>|<head>\n<script>window.VNGRD_CONFIG={ALCHEMY_KEY:\"${{ secrets.ALCHEMY_KEY }}\"};</script>|" index.html

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'

      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
```

5. In **Settings > Pages**, set Source to **GitHub Actions**

The workflow injects the key at build time so it never appears in the repo.

#### Option B: Meta Tag (Simple, Less Secure)

Add this line directly to `index.html` inside `<head>`:

```html
<meta name="alchemy-key" content="YOUR_KEY_HERE">
```

**Warning:** This exposes the key in your repository. Only use this for free-tier keys where rate-limiting is acceptable.

### How the Key is Read

The NFT Vault scanning code looks up the key at runtime in this priority order:

1. `window.VNGRD_CONFIG.ALCHEMY_KEY` (injected by CI/CD or inline script)
2. `<meta name="alchemy-key">` content attribute
3. Falls back to `'demo'` (Alchemy demo key, heavily rate-limited)
