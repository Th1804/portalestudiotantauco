const TUTOR_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";
const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
const TUTOR_MAX_MESSAGES = 16;
const TUTOR_MAX_CHARS = 4000;
const TUTOR_MAX_SYSTEM_CHARS = 8000;
const TUTOR_MAX_TOKENS = 1200;
const TUTOR_PER_MINUTE = 40;

const tutorHits = new Map();

function clip(value, max) {
  return String(value).trim().slice(0, max);
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(headers, status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

export function tutorMessages(body) {
  const messages = [];
  if (body && typeof body.system === "string" && body.system.trim()) {
    messages.push({ role: "system", content: clip(body.system, TUTOR_MAX_SYSTEM_CHARS) });
  }
  const incoming = body && Array.isArray(body.messages) ? body.messages : [];
  let conversation = 0;
  for (const message of incoming) {
    if (conversation >= TUTOR_MAX_MESSAGES) break;
    if (!message || (message.role !== "user" && message.role !== "assistant")) continue;
    if (typeof message.content !== "string" || !message.content.trim()) continue;
    messages.push({ role: message.role, content: clip(message.content, TUTOR_MAX_CHARS) });
    conversation += 1;
  }
  return messages;
}

export function tutorAnswer(data) {
  const message = data && data.choices && data.choices[0] && data.choices[0].message;
  let content = message && message.content;
  if (Array.isArray(content)) {
    content = content.map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part.text === "string") return part.text;
      return "";
    }).join("");
  }
  if (typeof content !== "string") return "";
  return content.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<think>[\s\S]*$/i, "").trim();
}

function openRouterUrl(env) {
  const custom = env && env.OPENROUTER_API_URL;
  if (typeof custom !== "string" || !custom.trim()) return OPENROUTER_CHAT_URL;
  let parsed;
  try {
    parsed = new URL(custom);
  } catch (error) {
    return OPENROUTER_CHAT_URL;
  }
  const loopback = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (parsed.protocol === "https:" || (parsed.protocol === "http:" && loopback)) return parsed.toString();
  return OPENROUTER_CHAT_URL;
}

function tutorLimited(ip) {
  const now = Date.now();
  const hits = (tutorHits.get(ip) || []).filter((time) => now - time < 60_000);
  if (tutorHits.size > 500) {
    for (const [key, times] of tutorHits) {
      if (times.every((time) => now - time >= 60_000)) tutorHits.delete(key);
    }
  }
  if (hits.length >= TUTOR_PER_MINUTE) {
    tutorHits.set(ip, hits);
    return true;
  }
  hits.push(now);
  tutorHits.set(ip, hits);
  return false;
}

export async function handleTutor(request, env, fetchImpl = fetch) {
  const headers = corsHeaders();
  const key = env && typeof env.OPENROUTER_API_KEY === "string" ? env.OPENROUTER_API_KEY.trim() : "";
  if (!key) {
    return json(headers, 503, { error: "tutor-unconfigured" });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return json(headers, 400, { error: "tutor-empty" });
  }

  const messages = tutorMessages(body);
  if (!messages.some((message) => message.role === "user")) {
    return json(headers, 400, { error: "tutor-empty" });
  }

  const ip = request.headers.get("CF-Connecting-IP") || "local";
  if (tutorLimited(ip)) {
    return json(headers, 429, { error: "tutor-unavailable" });
  }

  let upstream;
  try {
    upstream = await fetchImpl(openRouterUrl(env), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
        "HTTP-Referer": "https://portaltantauco.enzofuentes1804.workers.dev",
        "X-Title": "Portal Estudio Tantauco",
      },
      body: JSON.stringify({
        model: TUTOR_MODEL,
        messages,
        max_tokens: TUTOR_MAX_TOKENS,
        reasoning: { effort: "low", exclude: true },
      }),
    });
  } catch (error) {
    return json(headers, 502, { error: "tutor-unavailable" });
  }

  const raw = await upstream.text();
  let data = null;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    data = null;
  }
  const text = tutorAnswer(data);
  if (!upstream.ok || !text) {
    const status = upstream.status === 402 || upstream.status === 429 ? upstream.status : 502;
    return json(headers, status, { error: "tutor-unavailable" });
  }

  return json(headers, 200, {
    content: [{ type: "text", text }],
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const headers = corsHeaders();

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    if (path === "/api/chat/messages" && request.method === "GET") {
      try {
        const { results } = await env.DB.prepare(
          "SELECT * FROM (SELECT * FROM messages ORDER BY timestamp DESC LIMIT 100) ORDER BY timestamp ASC"
        ).all();

        return json(headers, 200, results);
      } catch (e) {
        return json(headers, 500, { error: e.message });
      }
    }

    if (path === "/api/chat/send" && request.method === "POST") {
      try {
        const body = await request.json();
        const { name, color, avatar, text, time } = body;

        await env.DB.prepare(
          "INSERT INTO messages (name, color, avatar, text, time) VALUES (?, ?, ?, ?, ?)"
        ).bind(name, color, avatar, text, time).run();

        return json(headers, 200, { success: true });
      } catch (e) {
        return json(headers, 500, { error: e.message });
      }
    }

    if (path === "/api/tutor" && request.method === "POST") {
      return handleTutor(request, env);
    }

    return new Response("Not found", { status: 404, headers });
  }
};
