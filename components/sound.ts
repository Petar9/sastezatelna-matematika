"use client";

import type { AchievementSound } from "@/src/core/sounds";

const storageKey = "maths:sound";
function storage() { try { return window.localStorage; } catch { return undefined; } }

export function soundEnabled() {
 try { return storage()?.getItem(storageKey) !== "off"; } catch { return true; }
}
export function setSoundEnabled(enabled: boolean) {
 try { if (enabled) storage()?.removeItem(storageKey); else storage()?.setItem(storageKey, "off"); } catch { /* The choice still applies until reload. */ }
}

let context: AudioContext | undefined;
function audio() {
 if (context || typeof window === "undefined") return context;
 const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
 try { if (Context) context = new Context(); } catch { /* Unsupported browsers stay silent. */ }
 return context;
}

// Browsers only start audio after a user gesture, and an answer's response
// arrives after the tap. Resume on every tap or key press; it is a no-op once running.
// navigator.audioSession is left untouched so the iOS silent switch mutes these sounds.
export function unlockSound() {
 if (typeof window === "undefined") return () => {};
 const unlock = () => { try { const ctx = audio(); if (ctx && ctx.state !== "running") void ctx.resume().catch(() => {}); } catch { /* stay silent */ } };
 window.addEventListener("pointerdown", unlock, { capture: true, passive: true });
 window.addEventListener("keydown", unlock, { capture: true });
 return () => { window.removeEventListener("pointerdown", unlock, { capture: true }); window.removeEventListener("keydown", unlock, { capture: true }); };
}

// Rising major chord: C5 E5 G5 for a learning milestone, up to C6 for a new record.
const tones: Record<AchievementSound, { notes: number[]; last: number }> = {
 milestone: { notes: [523.25, 659.25, 783.99], last: 0.3 },
 record: { notes: [523.25, 659.25, 783.99, 1046.5], last: 0.5 },
};
export function playAchievement(sound: AchievementSound) {
 if (!soundEnabled()) return;
 try {
  const ctx = audio();
  if (!ctx || ctx.state !== "running") return;
  const { notes, last } = tones[sound], start = ctx.currentTime + 0.02;
  // A slight pitch variation keeps a repeated sound from feeling mechanical.
  const tune = 1 + (Math.random() - 0.5) * 0.02;
  notes.forEach((frequency, index) => {
   const at = start + index * 0.09, length = index === notes.length - 1 ? last : 0.22;
   const oscillator = ctx.createOscillator(), gain = ctx.createGain();
   oscillator.type = "triangle";
   oscillator.frequency.value = frequency * tune;
   gain.gain.setValueAtTime(0.0001, at);
   gain.gain.exponentialRampToValueAtTime(0.12, at + 0.01);
   gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
   oscillator.connect(gain).connect(ctx.destination);
   oscillator.start(at);
   oscillator.stop(at + length + 0.05);
  });
 } catch { /* Sound is optional; visual feedback carries the same meaning. */ }
}
