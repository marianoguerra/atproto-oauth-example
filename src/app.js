import { BrowserOAuthClient } from '@atproto/oauth-client-browser'
// import { Agent } from '@atproto/api'  // Uncomment for production with full scopes

// DOM elements
const loadingDiv = document.getElementById('loading')
const loginSection = document.getElementById('login-section')
const profileSection = document.getElementById('profile-section')
const loginForm = document.getElementById('login-form')
const handleInput = document.getElementById('handle')
const profileDiv = document.getElementById('profile')
const errorP = document.getElementById('error')
const logoutBtn = document.getElementById('logout-btn')

// Initialize OAuth client
// For localhost dev: clientMetadata: undefined enables loopback mode
// For production: provide your hosted oauth-client-metadata.json URL
const client = new BrowserOAuthClient({
  handleResolver: 'https://bsky.social',
  // Loopback mode (localhost only) - comment out for production
  // clientMetadata: undefined, // Disabled for production
  // Production mode - uncomment and update domain:
  clientMetadata: {
    client_id: 'https://marianoguerra.github.io/atproto-oauth-example/oauth-client-metadata.json',
    client_name: 'AT Protocol OAuth Demo',
    redirect_uris: ['https://marianoguerra.github.io/atproto-oauth-example/', 'https://marianoguerra.github.io/atproto-oauth-example/callback.html'],
    scope: 'atproto',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
    dpop_bound_access_tokens: true,
  }
})

const API = 'https://public.api.bsky.app/xrpc'

// Fetch from public API
async function fetchApi(endpoint, params = {}) {
  const url = new URL(`${API}/${endpoint}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url)
  return res.json()
}

// Fetch with pagination until we have desired count
async function fetchPaginated(endpoint, params, itemsKey, targetCount) {
  const items = []
  let cursor = undefined

  while (items.length < targetCount) {
    const response = await fetchApi(endpoint, { ...params, cursor })
    const newItems = response[itemsKey] || []
    items.push(...newItems)

    // No more pages available
    if (!response.cursor || newItems.length === 0) break
    cursor = response.cursor
  }

  return items.slice(0, targetCount)
}

// Show authenticated UI
async function showProfile(session) {
  loadingDiv.classList.add('hidden')
  loginSection.classList.add('hidden')
  profileSection.classList.remove('hidden')

  // Fetch all data in parallel
  const [profile, feed, followersList, followingList] = await Promise.all([
    fetchApi('app.bsky.actor.getProfile', { actor: session.did }),
    fetchApi('app.bsky.feed.getAuthorFeed', { actor: session.did, limit: 5 }),
    fetchPaginated('app.bsky.graph.getFollowers', { actor: session.did, limit: 10 }, 'followers', 10),
    fetchPaginated('app.bsky.graph.getFollows', { actor: session.did, limit: 10 }, 'follows', 10),
  ])

  const avatarHtml = profile.avatar
    ? `<img src="${profile.avatar}" alt="Avatar" class="avatar">`
    : ''

  const postsHtml = feed.feed?.map(item => {
    const post = item.post
    const text = post.record?.text || ''
    const date = new Date(post.indexedAt).toLocaleString()
    return `<div class="post"><div>${text}</div><div class="post-date">${date}</div></div>`
  }).join('') || '<p>No posts</p>'

  const followersHtml = followersList.length > 0
    ? followersList.map(f => `<span class="follow-item">@${f.handle}</span>`).join('')
    : '<p>None</p>'

  const followingHtml = followingList.length > 0
    ? followingList.map(f => `<span class="follow-item">@${f.handle}</span>`).join('')
    : '<p>None</p>'

  profileDiv.innerHTML = `
    ${avatarHtml}
    <p><strong>Authenticated!</strong></p>
    <p><strong>Handle:</strong> @${profile.handle}</p>
    <p><strong>Display Name:</strong> ${profile.displayName || '(none)'}</p>
    <p><strong>Bio:</strong> ${profile.description || '(none)'}</p>
    <p><strong>DID:</strong> <code>${session.did}</code></p>
    <p><strong>Posts:</strong> ${profile.postsCount} | <strong>Followers:</strong> ${profile.followersCount} | <strong>Following:</strong> ${profile.followsCount}</p>

    <div class="section">
      <h3>Recent Posts</h3>
      ${postsHtml}
    </div>

    <div class="section">
      <h3>Followers (showing ${followersList.length} of ${profile.followersCount})</h3>
      ${followersHtml}
    </div>

    <div class="section">
      <h3>Following (showing ${followingList.length} of ${profile.followsCount})</h3>
      ${followingHtml}
    </div>
  `
}

// Show login UI
function showLogin() {
  loadingDiv.classList.add('hidden')
  loginSection.classList.remove('hidden')
  profileSection.classList.add('hidden')
  errorP.classList.add('hidden')
}

// Check for existing session on page load
async function init() {
  try {
    const result = await client.init()
    if (result?.session) {
      await showProfile(result.session)
    } else {
      showLogin()
    }
  } catch (err) {
    console.error('Init error:', err)
    showLogin()
  }
}

// Handle login form
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  errorP.classList.add('hidden')

  let handle = handleInput.value.trim()
  if (!handle.includes('.')) {
    handle += '.bsky.social'
  }

  try {
    await client.signIn(handle, {
      signal: new AbortController().signal,
    })
    // Will redirect to auth server...
  } catch (err) {
    errorP.textContent = err.message || 'Sign in failed'
    errorP.classList.remove('hidden')
  }
})

// Handle logout
logoutBtn.addEventListener('click', async () => {
  // Clear IndexedDB session
  const databases = await indexedDB.databases?.() || []
  for (const db of databases) {
    if (db.name?.includes('atproto')) {
      indexedDB.deleteDatabase(db.name)
    }
  }
  localStorage.clear()
  showLogin()
})

// Listen for session deletion (token revoked, etc)
client.addEventListener('deleted', (event) => {
  console.log('Session deleted:', event.detail.sub)
  showLogin()
})

init()
