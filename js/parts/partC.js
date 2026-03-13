// js/parts/partC.js
export async function runPartC(container, lessonData) {
  const tracks = lessonData?.partC?.tracks || [];

  container.innerHTML = `
    <div class="fullscreen centered" style="flex-direction:column; gap:12px; padding:18px; box-sizing:border-box; text-align:center;">
      <div class="text-primary" style="font-size:clamp(18px,4vw,44px)">Part C</div>
      <div class="text-dialogue">Player simples (play/pause/next). Coloque os áudios em lessonData.partC.tracks.</div>
      <button class="start-button" id="btn-c-next">CONTINUAR</button>
    </div>
  `;

  const btn = container.querySelector("#btn-c-next");
  const p = new Promise((res) => btn.addEventListener("click", res, { once: true }));
  await p;

  return () => (container.innerHTML = "");
}