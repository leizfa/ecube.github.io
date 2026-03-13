// js/parts/partB.js
export async function runPartB(container, lessonData) {
  container.innerHTML = `
    <div class="fullscreen centered" style="flex-direction:column; gap:12px; padding:18px; box-sizing:border-box; text-align:center;">
      <div class="text-primary" style="font-size:clamp(18px,4vw,44px)">Part B</div>
      <div class="text-dialogue">Placeholder: aqui entra a lógica ramificada/exercícios da Parte B.</div>
      <button class="start-button" id="btn-b-next">CONTINUAR</button>
    </div>
  `;

  const btn = container.querySelector("#btn-b-next");
  const p = new Promise((res) => btn.addEventListener("click", res, { once: true }));
  await p;

  return () => (container.innerHTML = "");
}