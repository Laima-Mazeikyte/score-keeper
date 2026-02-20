# Click sound (optional)

To use your own **mouse/button click** sound for the plus/minus score buttons:

1. Add a short audio file here named **`click.mp3`**, **`click.ogg`**, or **`click.wav`**.
2. Keep it short (around 0.03–0.1 seconds) so it feels responsive.
3. The app tries them in this order: `click.mp3` → `click.ogg` → `click.wav`.

If no file is present, no click sound is played (no fallback).

**Important:** Open the app through a local server so the sound file can load (opening `index.html` directly with `file://` won’t work). From the project folder run: **`npm run serve`** then open the URL shown (e.g. `http://localhost:3000`).

**Where to get free click sounds:**  
Search for “button click sound free” or “UI click SFX”. Sites like [Freesound.org](https://freesound.org) or [Mixkit](https://mixkit.co/free-sound-effects/) have short click/tap sounds—pick one that’s licensed for your use.
