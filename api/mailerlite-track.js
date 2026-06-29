// Vercel serverless function: tracks quiz starts and completions in MailerLite
// API key is stored as an environment variable in Vercel (MAILERLITE_API_KEY)

const GROUP_STARTED   = '191604992428213915';
const GROUP_COMPLETED = '191605017051924033';

export default async function handler(req, res) {
  // CORS headers (allow your own domain to call this)
  res.setHeader('Access-Control-Allow-Origin', 'https://reeceai.ai');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }

  const { email, firstName, lastName, business, status } = body || {};

  if (!email || !status) {
    return res.status(400).json({ error: 'Missing required fields: email, status' });
  }

  const groupId = status === 'completed' ? GROUP_COMPLETED : GROUP_STARTED;

  try {
    const mlResponse = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        fields: {
          name: firstName || '',
          last_name: lastName || '',
          company: business || ''
        },
        groups: [groupId]
      })
    });

    const data = await mlResponse.json();

    if (!mlResponse.ok) {
      return res.status(500).json({ error: 'MailerLite API error', details: data });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
