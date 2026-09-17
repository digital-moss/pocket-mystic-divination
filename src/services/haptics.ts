import { HapticMode } from '../types';

class HapticFeedbackService {
  private audioCtx: AudioContext | null = null;
  private mode: HapticMode = 'click';
  private soundEnabled: boolean = true;

  constructor() {
    // Lazy initialize on first interaction
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public setMode(mode: HapticMode) {
    this.mode = mode;
  }

  public getMode(): HapticMode {
    return this.mode;
  }

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Triggers Android-style haptic feedback using navigator.vibrate
   * alongside subtle audio tactile click synthesis
   */
  public triggerCardReveal() {
    if (this.mode === 'off') return;

    // Physical device vibration
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        switch (this.mode) {
          case 'click':
            navigator.vibrate(22);
            break;
          case 'double':
            navigator.vibrate([18, 40, 18]);
            break;
          case 'heavy':
            navigator.vibrate(45);
            break;
          case 'soft':
            navigator.vibrate(10);
            break;
        }
      } catch {
        // Safe fallback
      }
    }

    if (!this.soundEnabled) return;

    // Synthesize physical tactile click
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Primary crisp impulse (mechanical relay / micro-switch)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(3.0, now);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);

      // Low thump resonance for tactile body feel
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(95, now);
      subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.06);

      subGain.gain.setValueAtTime(0.18, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);

      subOsc.start(now);
      subOsc.stop(now + 0.07);
    } catch {
      // AudioContext unavailable
    }
  }

  /**
   * Mechanical riffle / shuffle tick during rapid shake
   */
  public triggerShuffleTick(pitchMultiplier = 1.0) {
    if (!this.soundEnabled) return;

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator && this.mode !== 'off') {
      try {
        navigator.vibrate(8);
      } catch {
        // Safe fallback
      }
    }

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(700 * pitchMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.018);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.022);
    } catch {
      // AudioContext unavailable
    }
  }

  /**
   * Subtle button touch feedback
   */
  public triggerTouch() {
    if (this.mode !== 'off' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch {
        // Ignore
      }
    }
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.02);
    } catch {
      // Ignore
    }
  }
}

export const haptics = new HapticFeedbackService();
