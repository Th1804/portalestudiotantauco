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

    // ── Endpoint: Tutor IA (API gratuita, sin clave) ──
    if (path === "/api/tutor" && request.method === "POST") {
      try {
        const body = await request.json();
        const messages = [];
        if (body.system) messages.push({ role: "system", content: body.system });
        if (Array.isArray(body.messages)) {
          for (const message of body.messages) messages.push(message);
        }

        const upstream = await fetch("https://text.pollinations.ai/openai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openai",
            messages,
            max_tokens: Math.min(body.max_tokens || 700, 800)
          })
        });
        const raw = await upstream.text();
        let text = "";
        try {
          const data = JSON.parse(raw);
          text = data?.choices?.[0]?.message?.content || "";
        } catch (error) {
          text = raw;
        }
        if (!upstream.ok || !String(text).trim()) {
          return new Response(JSON.stringify({ error: "tutor-unavailable" }), {
            status: upstream.status || 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        return new Response(JSON.stringify({
          content: [{ type: "text", text: String(text).trim() }]
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  }
};
