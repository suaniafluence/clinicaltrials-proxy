export default async function handler(req, res) {
  const urlPath = req.url.replace(/^\/+/, ''); // Remove leading slash
  const targetUrl = `https://clinicaltrials.gov/${urlPath}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const text = await response.text();
      res.status(response.status).send(text);
    }
  } catch (error) {
    res.status(500).json({ error: 'Proxy error', details: error.message });
  }
}
