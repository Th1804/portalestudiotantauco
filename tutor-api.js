(function () {
  var URL = 'https://text.pollinations.ai/openai';

  function textOf(data, raw) {
    var choice = data && data.choices && data.choices[0] && data.choices[0].message;
    var content = choice && choice.content;
    if (typeof content === 'string' && content.trim()) return content.trim();
    if (raw && raw.trim() && raw.trim().charAt(0) !== '{' && raw.trim().charAt(0) !== '<') return raw.trim();
    return '';
  }

  async function reply(system, messages) {
    var res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: [{ role: 'system', content: system }].concat(messages || []),
        max_tokens: 700
      })
    });
    var raw = await res.text();
    if (res.status === 402) {
      var wait = new Error('espera');
      wait.wait = true;
      throw wait;
    }
    if (!res.ok) throw new Error('http ' + res.status);
    var data = null;
    try { data = JSON.parse(raw); } catch (error) { data = null; }
    var text = textOf(data, raw);
    if (!text) throw new Error('vacio');
    return text;
  }

  window.TantaucoTutor = { reply: reply };
})();
