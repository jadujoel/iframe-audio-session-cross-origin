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

	const typeEl = document.getElementById("type");
	const ctxStateEl = document.getElementById("ctx-state");
	const typeButtonsEl = document.getElementById("type-buttons");
	const toneToggle = document.getElementById("tone-toggle") as HTMLButtonElement | null;

	const tone = createTone({ frequency: 440 });

	const render = () => {
		if (typeEl) typeEl.textContent = audioSession.type;
		if (ctxStateEl) ctxStateEl.textContent = tone.getContextState() ?? "(no context)";
		if (toneToggle) {
			toneToggle.textContent = tone.isPlaying() ? "Stop tone" : "Play tone (440 Hz)";
			toneToggle.setAttribute("aria-pressed", String(tone.isPlaying()));
		}
		for (const btn of typeButtonsEl?.querySelectorAll("button") ?? []) {
			btn.setAttribute("aria-pressed", String(btn.dataset.type === audioSession.type));
		}
	};
	render();

	watchAudioSessionType((next, prev) => {
		console.log(`[parent] type ${prev} -> ${next}`);
		render();
	});

	for (const type of Object.values(AudioSessionTypes)) {
		const button = document.createElement("button");
		button.type = "button";
		button.textContent = type;
		button.dataset.type = type;
		button.addEventListener("click", () => {
			console.log(`[parent] set type -> ${type}`);
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
