const apiCard = (state) => {
  if (state.status === 'ok') {
    const d = state.data;
    return `<section class="api-card" style="margin-top:1.5rem;padding:1rem 1.25rem;border:1px solid #16a34a;border-radius:8px;background:#f0fdf4">
      <h2 style="margin:0 0 .25rem;font-size:1rem">Mounted API: ${d.service} ✅</h2>
      <p style="margin:.25rem 0">${d.message}</p>
      <p style="margin:.25rem 0;color:#475569;font-size:.85rem">loopback port ${d.port} · pid ${d.pid} · mounted at <code>${d.mountedFrom ?? 'n/a'}</code></p>
    </section>`;
  }
  return `<section class="api-card" style="margin-top:1.5rem;padding:1rem 1.25rem;border:1px solid #f59e0b;border-radius:8px;background:#fffbeb">
    <h2 style="margin:0 0 .25rem;font-size:1rem">Mounted API: unavailable</h2>
    <p style="margin:.25rem 0;color:#475569">${state.reason}</p>
  </section>`;
};

const app = document.getElementById('app');
app.innerHTML = `
  <h1>Hello from peek-test-app</h1>
  <p>Served by a peek.dev JIT preview at ${new Date().toISOString()}</p>
  <section id="api-status" class="api-card" style="margin-top:1.5rem;padding:1rem 1.25rem;border:1px solid #cbd5e1;border-radius:8px">checking mounted API…</section>
`;

fetch('/api/hello')
  .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
  .then((data) => { document.getElementById('api-status').outerHTML = apiCard({ status: 'ok', data }); })
  .catch((err) => { document.getElementById('api-status').outerHTML = apiCard({ status: 'down', reason: String(err) }); });
