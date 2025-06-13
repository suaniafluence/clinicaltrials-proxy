export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Récupère le chemin dynamique, ou utilise "studies" par défaut
    const rawPath = req.url.split("/proxy/")[1]?.split("?")[0] || "";
    const targetPath = rawPath === "" ? "studies" : rawPath;

    // Extraction et nettoyage de la query string
    const queryString = req.url.split("?")[1] || "";
    const cleanQueryString = queryString
      .replace(/(^|&)url=[^&]*/g, "")
      .replace(/^&|&$/g, "");

    // ⚠️ Plus de fmt=json ici !
    const targetUrl = `https://clinicaltrials.gov/api/v2/${targetPath}${cleanQueryString ? "?" + cleanQueryString : ""}`;

    console.log("🔁 Proxying to:", targetUrl);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "User-Agent": "ClinicalTrials-Proxy/1.0",
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`ClinicalTrials API responded with status: ${response.status}`);
    }

    const data = await response.json();

    return res.status(200).json({
      success: true,
      data: data,
      proxiedFrom: targetUrl,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Proxy error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Proxy error",
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
