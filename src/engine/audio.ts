// Tiny WebAudio synth. All sound is optional; nothing in the game depends on it.
let ac: AudioContext | null = null; let muted = false; let rainNode: AudioBufferSourceNode | null = null; let rainGain: GainNode | null = null;
function ctx(): AudioContext | null { try { if (!ac) ac = new (window.AudioContext || (window as any).webkitAudioContext)(); if (ac.state === 'suspended') void ac.resume(); return ac; } catch { return null; } }
function tone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.05, delay = 0) {
  if (muted) return; const a = ctx(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.value = freq; const t = a.currentTime + delay;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur);
}
export const sfx = {
  click: () => tone(520, 0.05, 'square', 0.03), step: () => tone(90 + Math.random() * 20, 0.04, 'triangle', 0.03),
  paper: () => { tone(300, 0.05, 'sawtooth', 0.02); tone(240, 0.06, 'sawtooth', 0.02, 0.04); },
  discover: () => { tone(660, 0.1, 'triangle', 0.06); tone(880, 0.14, 'triangle', 0.06, 0.09); },
  right: () => { tone(523, 0.1, 'triangle', 0.06); tone(784, 0.18, 'triangle', 0.06, 0.1); }, wrong: () => { tone(200, 0.18, 'sawtooth', 0.05); tone(150, 0.22, 'sawtooth', 0.05, 0.12); },
  gavel: () => { tone(120, 0.12, 'square', 0.1); tone(100, 0.2, 'square', 0.1, 0.14); }
};
export function setMuted(m: boolean) { muted = m; if (rainGain) rainGain.gain.value = m ? 0 : 0.035; }
export function startRain() {
  if (rainNode) return; const a = ctx(); if (!a) return;
  const len = a.sampleRate * 2, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource(); src.buffer = buf; src.loop = true; const f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2200;
  rainGain = a.createGain(); rainGain.gain.value = muted ? 0 : 0.035; src.connect(f).connect(rainGain).connect(a.destination); src.start(); rainNode = src;
}
export function stopRain() { try { rainNode?.stop(); } catch { /* already stopped */ } rainNode = null; }
