import {
  AudioSessionTypes,
  createTone,
  getAudioSession,
  setAudioSessionType,
  watchAudioSessionType,
} from "./utils";

export async function main() {
  const audioSession = getAudioSession();
  if (!audioSession) {
    throw new Error("Audio Session API not supported in this environment.");
  }

  const params = new URLSearchParams(window.location.search);
  const label = params.get("label") ?? "";
  const freq = Number(params.get("freq")) || 660;
  const nested = params.get("nested") === "1";
  const suffix = label ? ` ${label}` : "";
  const tag = `[iframe${suffix}]`;

  if (nested) {
    const container = document.getElementById("nested-container");
    if (container) {
      const childLabel = label ? `${label}.1` : "nested";
      const childFreq = freq + 110;
      const child = document.createElement("iframe");
      child.title = `iframe ${childLabel}`;
      child.src = `./iframe.html?label=${encodeURIComponent(childLabel)}&freq=${childFreq}`;
      child.width = "700";
      child.height = "280";
      container.appendChild(child);
    }
  }

  const headingEl = document.querySelector("h2");
  if (headingEl && label) headingEl.textContent = `Iframe ${label}`;
  document.title = `Audio Session — Iframe${suffix}`;

  const typeEl = document.getElementById("type");
  const ctxStateEl = document.getElementById("ctx-state");
  const typeButtonsEl = document.getElementById("type-buttons");
  const toneToggle = document.getElementById("tone-toggle") as HTMLButtonElement | null;

  const tone = createTone({ frequency: freq });

  const render = () => {
    if (typeEl) typeEl.textContent = audioSession.type;
    if (ctxStateEl) ctxStateEl.textContent = tone.getContextState() ?? "(no context)";
    if (toneToggle) {
      toneToggle.textContent = tone.isPlaying() ? "Stop tone" : `Play tone (${freq} Hz)`;
      toneToggle.setAttribute("aria-pressed", String(tone.isPlaying()));
    }
    for (const btn of typeButtonsEl?.querySelectorAll("button") ?? []) {
      btn.setAttribute("aria-pressed", String(btn.dataset.type === audioSession.type));
    }
  };
  render();

  watchAudioSessionType((next, prev) => {
    console.log(`${tag} type ${prev} -> ${next}`);
    render();
  });

  for (const type of Object.values(AudioSessionTypes)) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = type;
    button.dataset.type = type;
    button.addEventListener("click", () => {
      console.log(`${tag} set type -> ${type}`);
      setAudioSessionType(type);
      render();
    });
    typeButtonsEl?.appendChild(button);
  }

  toneToggle?.addEventListener("click", async () => {
    if (tone.isPlaying()) tone.stop();
    else await tone.start();
    render();
  });

  setInterval(render, 500);
}

main();
