import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  RotateCcw, 
  Sliders, 
  Hand,
  CheckCircle2
} from 'lucide-react';
import { shakeDetector } from '../services/shakeDetector';
import { haptics } from '../services/haptics';

interface ShakeControlProps {
  isShuffling: boolean;
  onShake: () => void;
  onResetCard: () => void;
  isFlipped: boolean;
}

export const ShakeControl: React.FC<ShakeControlProps> = ({
  isShuffling,
  onShake,
  onResetCard,
  isFlipped
}) => {
  const [sensorStatus, setSensorStatus] = useState(shakeDetector.getStatus());
  const [sensitivity, setSensitivity] = useState(shakeDetector.getSensitivity());
  const [showSettings, setShowSettings] = useState(false);
  const [liveMagnitude, setLiveMagnitude] = useState(0);

  useEffect(() => {
    const unsub = shakeDetector.subscribe((mag) => {
      setLiveMagnitude(mag);
      setTimeout(() => setLiveMagnitude(0), 400);
    });

    const interval = setInterval(() => {
      setSensorStatus(shakeDetector.getStatus());
    }, 1000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const handleManualShake = () => {
    haptics.triggerShuffleTick(1.2);
    shakeDetector.simulateShake(30);
    onShake();
  };

  const handleRequestMotionPermission = async () => {
    const granted = await shakeDetector.requestPermission();
    if (granted) {
      shakeDetector.start();
      setSensorStatus(shakeDetector.getStatus());
      haptics.triggerCardReveal();
    }
  };

  const handleSensitivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setSensitivity(val);
    shakeDetector.setSensitivity(val);
  };

  return (
    <div className="w-full max-w-[380px] mx-auto mt-4 px-2 select-none">
      {/* Primary Hardware Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          id="btn-physical-shake"
          onClick={handleManualShake}
          disabled={isShuffling}
          className="flex-1 relative group overflow-hidden bg-[#1c1c1c] hover:bg-[#252525] active:bg-[#161616] text-neutral-100 border-2 border-neutral-700/80 active:border-neutral-500 py-3.5 px-4 rounded-xl font-mono-code font-bold text-sm tracking-wider uppercase transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2.5"
        >
          {/* Subtle tactile pulse highlight */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <Activity className={`w-4 h-4 text-amber-400 ${isShuffling ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`} />
          <span>{isShuffling ? 'SHUFFLING DECK...' : 'SHAKE TO DRAW'}</span>
        </button>

        {isFlipped && (
          <button
            id="btn-reset-card"
            onClick={() => {
              haptics.triggerTouch();
              onResetCard();
            }}
            title="Return card to deck / Flip back"
            className="px-3.5 py-3.5 bg-[#181818] hover:bg-[#222222] border border-neutral-700/60 rounded-xl text-neutral-300 hover:text-white transition-colors flex items-center justify-center"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        <button
          id="btn-sensor-settings"
          onClick={() => {
            haptics.triggerTouch();
            setShowSettings(!showSettings);
          }}
          title="Sensor & Accelerometer settings"
          className={`px-3 py-3.5 rounded-xl border transition-colors flex items-center justify-center ${
            showSettings 
              ? 'bg-neutral-800 border-amber-500/50 text-amber-400' 
              : 'bg-[#181818] hover:bg-[#222222] border-neutral-700/60 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>

      {/* Sensor Status Indicator Ribbon */}
      <div className="flex items-center justify-between mt-2.5 px-2 text-[10px] font-mono-code text-neutral-500">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${liveMagnitude > 10 || isShuffling ? 'bg-amber-400 animate-ping' : 'bg-neutral-600'}`}></span>
          <span>ACCELEROMETER:</span>
          <span className={sensorStatus.supported ? 'text-emerald-400 font-semibold' : 'text-neutral-400'}>
            {sensorStatus.supported ? 'HARDWARE ACTIVE' : 'SIMULATOR'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span>VELOCITY:</span>
          <span className="text-neutral-300 font-mono">
            {liveMagnitude > 0 ? liveMagnitude.toFixed(0) : '0'} m/s²
          </span>
        </div>
      </div>

      {/* Expandable Sensor & Sensitivity Configuration */}
      {showSettings && (
        <div className="mt-3 p-3.5 bg-[#161616] border border-neutral-700/70 rounded-xl text-xs font-mono-code text-neutral-300 space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              PHYSICAL SENSOR CALIBRATION
            </span>
            <span className="text-[10px] text-neutral-500">ANDROID SENSOR API</span>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-neutral-400">Shake Velocity Threshold:</span>
              <span className="text-amber-400 font-bold">{sensitivity} (~{sensitivity * 45} Android)</span>
            </div>
            <input
              type="range"
              min="8"
              max="40"
              value={sensitivity}
              onChange={handleSensitivityChange}
              className="w-full accent-amber-400 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-neutral-500 mt-1">
              <span>Very Sensitive (8)</span>
              <span>Default (18)</span>
              <span>Hard Shake (40)</span>
            </div>
          </div>

          {/* iOS / Mobile permission prompt */}
          {typeof window !== 'undefined' && 'DeviceMotionEvent' in window && (
            <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
              <span className="text-[10px] text-neutral-400">Mobile Motion Access:</span>
              <button
                id="btn-req-motion-perm"
                onClick={handleRequestMotionPermission}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded text-[10px] text-neutral-200 flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Verify Sensor</span>
              </button>
            </div>
          )}

          <div className="text-[10px] text-neutral-500 leading-relaxed bg-[#111111] p-2 rounded border border-neutral-800/80">
            <span className="text-amber-300 font-semibold">Tip:</span> On mobile phones, shaking the physical handset will shuffle the cards and fire an instant haptic tick. On desktop, click <span className="text-neutral-300">"Shake to Draw"</span> or use spacebar.
          </div>
        </div>
      )}
    </div>
  );
};
