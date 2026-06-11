export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // ── Endpoint: Obtener Mensajes (GET) ──
    if (path === "/api/chat/messages" && request.method === "GET") {
      try {
        // Obtenemos los últimos 100 mensajes
        const { results } = await env.DB.prepare(
          "SELECT * FROM (SELECT * FROM messages ORDER BY timestamp DESC LIMIT 100) ORDER BY timestamp ASC"
        ).all();
        
        return new Response(JSON.stringify(results), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // ── Endpoint: Enviar Mensaje (POST) ──
    if (path === "/api/chat/send" && request.method === "POST") {
      try {
        const body = await request.json();
        const { name, color, avatar, text, time } = body;
        
        await env.DB.prepare(
          "INSERT INTO messages (name, color, avatar, text, time) VALUES (?, ?, ?, ?, ?)"
        ).bind(name, color, avatar, text, time).run();
        
        return new Response(JSON.stringify({ success: true }), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // ── Endpoint: Tutor IA (POST proxy a Anthropic) ──
    if (path === "/api/tutor" && request.method === "POST") {
      try {
        const body = await request.json();
        
        const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: body.model || "claude-3-5-sonnet-latest",
            max_tokens: body.max_tokens || 600,
            system: body.system,
            messages: body.messages
          })
        });
        
        const data = await anthropicResponse.json();
        return new Response(JSON.stringify(data), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  }
};
