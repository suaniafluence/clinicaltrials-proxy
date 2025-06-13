// /api/proxy.js (Next.js API Route par exemple)
export default async function handler(req, res) {
  // Préflight OPTIONS
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      error: "Missing target URL",
      usage: "Add ?url=studies&query.cond=diabetes&fmt=json to your request",
      example: "/api/proxy?url=studies&query.cond=diabetes",
    });
  }

  try {
    // Extraction de la chaîne de requête, sans "url"
    const queryString = req.url.split("?")[1] || "";
    const cleanQueryString = queryString
      .replace(/(^|&)url=[^&]*/g, "")
      .replace(/^&|&$/g, "");

    // Ajout de fmt=json si non précisé
    const hasFmt = /(?:^|&)fmt=/.test(cleanQueryString);
    const finalQuery = cleanQueryString
      ? cleanQueryString + (hasFmt ? "" : "&fmt=json")
      : "fmt=json";

    // Construction de l'URL cible (API v2 uniquement)
    const baseUrl = "https://clinicaltrials.gov/api/v2/";
    const sanitizedUrl = url.replace(/^\/+/, ""); // évite les doubles slashs
    const targetUrl = `${baseUrl}${sanitizedUrl}${finalQuery ? "?" + finalQuery : ""}`;

    console.log("Proxying to:", targetUrl);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "User-Agent": "ClinicalTrials-Proxy/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`ClinicalTrials API responded with status: ${response.status}`);
    }

    const data = await response.json();

    return res.status(200).json({
      success: true,
      data: data,
      proxiedFrom: targetUrl,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return res.status(500).json({
      success: false,
      error: "Proxy error",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
