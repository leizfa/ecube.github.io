// js/parts/partD.js
export async function runPartD(container, lessonData) {
  container.innerHTML = `
    <div class="fullscreen centered" style="flex-direction:column; gap:12px; padding:18px; box-sizing:border-box; text-align:center;">
      <div class="text-primary" style="font-size:clamp(18px,4vw,44px)">Part D</div>
      <div class="text-dialogue">Placeholder: Parte D (peer/check) — lógica leve.</div>
      <button class="start-button" id="btn-d-next">FINALIZAR</button>
    </div>
  `;

  const btn = container.querySelector("#btn-d-next");
  const p = new Promise((res) => btn.addEventListener("click", res, { once: true }));
  await p;

  return () => (container.innerHTML = "");
}