import { SensorStatus } from '../types';

export type ShakeCallback = (magnitude: number) => void;

class ShakeDetectorService {
  private listeners: Set<ShakeCallback> = new Set();
  private lastX = 0;
  private lastY = 0;
  private lastZ = 0;
  private lastUpdate = 0;
  private lastShakeTime = 0;
  private cooldownMs = 800; // Debounce between shakes
  private threshold = 18; // Acceleration threshold (m/s²)
  private isActive = false;
  private currentMagnitude = 0;

  private handleMotion = (event: DeviceMotionEvent) => {
    const current = Date.now();
    const diffTime = current - this.lastUpdate;

    // Throttle checks to ~100ms
    if (diffTime < 80) return;

    const acc = event.accelerationIncludingGravity || event.acceleration;
    if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

    const { x, y, z } = acc;

    // Calculate velocity / delta acceleration
    const deltaX = Math.abs(x - this.lastX);
    const deltaY = Math.abs(y - this.lastY);
    const deltaZ = Math.abs(z - this.lastZ);

    const speed = ((deltaX + deltaY + deltaZ) / diffTime) * 1000;
    this.currentMagnitude = speed;

    if (speed > this.threshold) {
      if (current - this.lastShakeTime > this.cooldownMs) {
        this.lastShakeTime = current;
        this.notifyListeners(speed);
      }
    }

    this.lastX = x;
    this.lastY = y;
    this.lastZ = z;
    this.lastUpdate = current;
  };

  public async requestPermission(): Promise<boolean> {
    if (
      typeof window !== 'undefined' &&
      typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function'
    ) {
      try {
        const response = await (DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
        return response === 'granted';
      } catch (err) {
        console.warn('DeviceMotionEvent permission error:', err);
        return false;
      }
    }
    return true; // Non-iOS or permission already permitted
  }

  public start(): boolean {
    if (typeof window === 'undefined') return false;
    if (this.isActive) return true;

    try {
      window.addEventListener('devicemotion', this.handleMotion, false);
      this.isActive = true;
      return true;
    } catch {
      return false;
    }
  }

  public stop(): void {
    if (typeof window === 'undefined') return;
    window.removeEventListener('devicemotion', this.handleMotion, false);
    this.isActive = false;
  }

  public subscribe(callback: ShakeCallback): () => void {
    this.listeners.add(callback);
    if (!this.isActive) {
      this.start();
    }
    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0) {
        this.stop();
      }
    };
  }

  private notifyListeners(magnitude: number) {
    this.listeners.forEach((cb) => {
      try {
        cb(magnitude);
      } catch (err) {
        console.error('Error in shake listener:', err);
      }
    });
  }

  /**
   * Simulates a physical shake manually (e.g. for desktop or button trigger)
   */
  public simulateShake(magnitude = 25) {
    const current = Date.now();
    if (current - this.lastShakeTime > 300) {
      this.lastShakeTime = current;
      this.currentMagnitude = magnitude;
      this.notifyListeners(magnitude);
    }
  }

  public getStatus(): SensorStatus {
    const supported = typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
    return {
      supported,
      active: this.isActive,
      permissionGranted: true,
      lastShakeTime: this.lastShakeTime,
      magnitude: this.currentMagnitude
    };
  }

  public setSensitivity(threshold: number) {
    this.threshold = threshold;
  }

  public getSensitivity(): number {
    return this.threshold;
  }
}

export const shakeDetector = new ShakeDetectorService();
