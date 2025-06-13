// /api/proxy/[...slug].js  (nécessite renommage dans Next.js avec catch-all route)
export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Récupération dynamique du chemin après /api/proxy/
    const slug = req.query.slug;
    const urlPath = Array.isArray(slug) ? slug.join("/") : slug || "";

    if (!urlPath) {
      return res.status(400).json({
        error: "Missing target URL path",
        usage: "Utilisez /api/proxy/studies?query.cond=diabetes",
        example: "/api/proxy/studies?query.cond=diabetes",
      });
    }

    // Récupération de la query string sans le slug
    const queryString = req.url.split("?")[1] || "";
    const cleanQueryString = queryString
      .replace(/(^|&)url=[^&]*/g, "")
      .replace(/^&|&$/g, "");

    // Ajout automatique de fmt=json si absent
    const hasFmt = /(?:^|&)fmt=/.test(cleanQueryString);
    const finalQuery = cleanQueryString
      ? cleanQueryString + (hasFmt ? "" : "&fmt=json")
      : "fmt=json";

    // Construction de l'URL finale vers l'API ClinicalTrials
    const targetUrl = `https://clinicaltrials.gov/api/v2/${urlPath}${
      finalQuery ? "?" + finalQuery : ""
    }`;

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
    console.log("🔎 Données renvoyées à GPT :", JSON.stringify(data, null, 2));
    
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
