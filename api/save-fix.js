/**
 * Vercel Serverless Function: Save Auto-Fixed HTML
 * 
 * Receives the fixed index.html content and commits it directly
 * to the GitHub repo, triggering an automatic Vercel redeploy.
 *
 * Required Vercel Environment Variables:
 *   GITHUB_TOKEN  – Personal access token with 'repo' scope
 *   GITHUB_REPO   – e.g., "jbw25/riseupbenefits"
 *   GITHUB_BRANCH – (optional) defaults to "main"
 *   BACKOFFICE_KEY – (optional) simple API key to protect this endpoint
 */

export default async function handler(req, res) {
  // CORS headers for backoffice
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Optional API key check
  const backofficeKey = process.env.BACKOFFICE_KEY;
  if (backofficeKey) {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${backofficeKey}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const { content, message } = req.body;

  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Missing "content" field with HTML string' });
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';

  if (!token || !repo) {
    return res.status(500).json({
      error: 'Server not configured. Set GITHUB_TOKEN and GITHUB_REPO environment variables in Vercel.'
    });
  }

  const filePath = 'index.html';
  const commitMessage = message || `SEO Auto-Fix: ${new Date().toISOString().split('T')[0]}`;

  try {
    // Step 1: Get the current file (need its SHA for update)
    const getRes = await fetch(
      `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'RiseUpBenefits-SEO-Backoffice'
        }
      }
    );

    let sha = null;
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    }
    // If 404, the file doesn't exist yet — that's fine, we'll create it

    // Step 2: Create or update the file
    const body = {
      message: commitMessage,
      content: Buffer.from(content, 'utf-8').toString('base64'),
      branch
    };

    if (sha) {
      body.sha = sha; // Required for updates
    }

    const putRes = await fetch(
      `https://api.github.com/repos/${repo}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'RiseUpBenefits-SEO-Backoffice'
        },
        body: JSON.stringify(body)
      }
    );

    if (!putRes.ok) {
      const errData = await putRes.json().catch(() => ({}));
      console.error('GitHub API error:', putRes.status, errData);
      return res.status(502).json({
        error: 'Failed to commit to GitHub',
        detail: errData.message || `HTTP ${putRes.status}`
      });
    }

    const result = await putRes.json();

    return res.status(200).json({
      success: true,
      commit: result.commit?.sha?.substring(0, 7),
      message: commitMessage,
      url: result.content?.html_url
    });

  } catch (err) {
    console.error('Save fix error:', err);
    return res.status(500).json({ error: 'Internal error: ' + err.message });
  }
}
