# AT Protocol OAuth Example - Deployment Guide

This folder contains all files needed to deploy the AT Protocol OAuth example to static hosting.

## Files Included

```
dist/
├── index.html              # Main page
├── callback.html           # OAuth callback handler
├── oauth-client-metadata.json  # OAuth client configuration
├── src/
│   ├── app.js              # Application logic
│   └── styles.css          # Styles
└── lib/
    ├── oauth-client-browser.js  # Bundled OAuth library
    └── api.js                   # Bundled AT Protocol API
```

## Deployment Steps

### 1. Configure Your Domain

Edit `oauth-client-metadata.json` and replace `YOUR_DOMAIN` with your actual domain:

```json
{
  "client_id": "https://YOUR_DOMAIN/oauth-client-metadata.json",
  "client_name": "AT Protocol OAuth Demo",
  "client_uri": "https://YOUR_DOMAIN",
  "redirect_uris": [
    "https://YOUR_DOMAIN/",
    "https://YOUR_DOMAIN/callback.html"
  ],
  ...
}
```

### 2. Update Application Config

Edit `src/app.js` and find the `BrowserOAuthClient` initialization. Comment out loopback mode and enable production mode:

```javascript
const client = new BrowserOAuthClient({
  handleResolver: 'https://bsky.social',
  // Comment out loopback mode:
  // clientMetadata: undefined,
  // Enable production mode:
  clientMetadata: {
    client_id: 'https://YOUR_DOMAIN/oauth-client-metadata.json',
    client_name: 'AT Protocol OAuth Demo',
    redirect_uris: [
      'https://YOUR_DOMAIN/',
      'https://YOUR_DOMAIN/callback.html'
    ],
    scope: 'atproto',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
    dpop_bound_access_tokens: true,
  }
})
```

### 3. Deploy Files

Upload all files to your static hosting provider.

#### GitHub Pages

1. Create a new repository or use an existing one
2. Upload all files from this folder to the repository root
3. Go to Settings → Pages
4. Enable GitHub Pages from the main branch
5. Your site will be at `https://USERNAME.github.io/REPO/`

#### Netlify

1. Drag and drop this folder to [Netlify Drop](https://app.netlify.com/drop)
2. Or connect your Git repository in Netlify dashboard

#### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in this folder
3. Follow the prompts

#### Cloudflare Pages

1. Go to Cloudflare Dashboard → Pages
2. Create a project and upload this folder
3. Or connect your Git repository

### 4. Verify Deployment

1. Visit your deployed URL
2. Check that `oauth-client-metadata.json` is accessible at the URL specified in `client_id`
3. Try signing in with a Bluesky handle
4. You should be redirected to Bluesky's auth server and back

## Troubleshooting

### "Invalid client_id"
- Ensure `oauth-client-metadata.json` is accessible at the exact URL specified in `client_id`
- The URL must use HTTPS

### "Invalid redirect_uri"
- Ensure `redirect_uris` in both `oauth-client-metadata.json` and `src/app.js` match exactly
- Include both `/` and `/callback.html` variants
- Watch for trailing slash mismatches

### OAuth flow hangs or errors
- Make sure you updated both `oauth-client-metadata.json` AND `src/app.js`
- Check browser console for specific error messages
- Verify your hosting serves files with correct MIME types

### Works locally but not in production
- Did you switch from `clientMetadata: undefined` to the production config?
- Is your site served over HTTPS?

## Requirements

- **HTTPS** - Required for OAuth (most static hosts provide this automatically)
- **Correct MIME types** - `.js` files must be served as `application/javascript`

## Support

For issues with the AT Protocol or OAuth flow, see:
- [AT Protocol Documentation](https://atproto.com)
- [Bluesky OAuth Documentation](https://docs.bsky.app)
