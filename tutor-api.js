(function () {
  var WORKER = 'https://portaltantauco.enzofuentes1804.workers.dev/api/tutor';

  function endpoint() {
    var host = location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return '/api/tutor';
    return WORKER;
  }

  function textOf(data) {
    var block = data && data.content && data.content[0];
    if (block && typeof block.text === 'string' && block.text.trim()) return block.text.trim();
    var choice = data && data.choices && data.choices[0] && data.choices[0].message;
    var content = choice && choice.content;
    if (typeof content === 'string' && content.trim()) return content.trim();
    return '';
  }

  async function reply(system, messages) {
    var res = await fetch(endpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: system,
        messages: messages || [],
        max_tokens: 700
      })
    });
    if (res.status === 402 || res.status === 429) {
      var wait = new Error('espera');
      wait.wait = true;
      throw wait;
    }
    var raw = await res.text();
    if (!res.ok) throw new Error('http ' + res.status);
    var data = null;
    try { data = JSON.parse(raw); } catch (error) { data = null; }
    var text = textOf(data);
    if (!text) throw new Error('vacio');
    return text;
  }

  window.TantaucoTutor = { reply: reply };
})();
