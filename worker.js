export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-api-key, anthropic-version"
    };

    // Manejo de peticiones Preflight (OPTIONS)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // Ruta específica del Tutor IA
    if (url.pathname === "/api/tutor" && request.method === "POST") {
      try {
        const body = await request.json();

        // Llamada a la API oficial de Anthropic Claude Messages
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify(body)
        });

        const data = await res.json();

        return new Response(JSON.stringify(data), {
          status: res.status,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          error: {
            message: "Error interno en el Cloudflare Worker",
            details: error.message
          }
        }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
