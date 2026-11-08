import React from 'react';
import { AlertOctagon, RotateCcw, Play, Hand, Cpu } from 'lucide-react';
import { RobotMode } from '../types/robot';
import { robot } from '../services/robotConnection';
import { sounds } from '../utils/audio';

interface TacticalActionsProps {
  isConnected: boolean;
  currentMode: RobotMode;
  isEmergency: boolean;
  robotState: string;
}

export const TacticalActions: React.FC<TacticalActionsProps> = ({
  isConnected,
  currentMode,
  isEmergency,
  robotState,
}) => {
  const handleEstop = () => {
    sounds.playEmergency();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 200]);
    }
    robot.emergencyStop();
  };

  const handleReset = () => {
    sounds.playBeep(520, 0.1);
    robot.reset();
  };

  const handleStart = () => {
    sounds.playStartCountdown();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([50, 50, 50]);
    }
    robot.startCompetition();
  };

  const handleModeChange = (mode: RobotMode) => {
    sounds.playBeep(650, 0.05);
    robot.setMode(mode);
  };

  const isCountingDown = robotState === 'DESPLIEGUE_3S';

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-xl space-y-4">
      {/* 1. GIANT RED EMERGENCY STOP BUTTON (ESTOP) */}
      <div className="text-center">
        <div className="text-[10px] font-mono tracking-widest uppercase text-red-400 font-bold mb-1.5 flex items-center justify-center gap-1.5">
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>PARADA DE SEGURIDAD REGLAMENTARIA</span>
        </div>

        <button
          type="button"
          onClick={handleEstop}
          disabled={!isConnected}
          className={`w-full py-5 px-6 rounded-xl font-black text-lg md:text-xl uppercase tracking-widest flex items-center justify-center gap-3 transition-all border-4 select-none ${
            isEmergency
              ? 'bg-red-700 border-white text-white shadow-2xl shadow-red-600 animate-pulse'
              : isConnected
              ? 'bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:to-red-500 active:from-red-800 active:to-red-900 border-red-400/80 text-white shadow-xl shadow-red-600/40 hover:scale-[1.01] active:scale-[0.98]'
              : 'bg-zinc-950 border-zinc-800 text-zinc-600 cursor-not-allowed'
          }`}
          title="Parada inmediata de todos los motores (ESTOP)"
        >
          <AlertOctagon className="w-7 h-7" />
          <span>EMERGENCIA (ESTOP)</span>
        </button>
      </div>

      {/* 2. RESET & START (INICIAR 3s) BUTTONS */}
      <div className="grid grid-cols-2 gap-3">
        {/* RESET BUTTON */}
        <button
          type="button"
          onClick={handleReset}
          disabled={!isConnected}
          className={`py-3.5 px-3 rounded-lg font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
            isConnected
              ? 'bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-white border-zinc-600 shadow-md hover:border-zinc-400'
              : 'bg-zinc-950 border-zinc-800 text-zinc-600 cursor-not-allowed'
          }`}
          title="Restablecer estado del robot (RESET)"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <span>RESET</span>
        </button>

        {/* INICIAR (START - 3s COUNTDOWN) */}
        <button
          type="button"
          onClick={handleStart}
          disabled={!isConnected || isEmergency}
          className={`py-3.5 px-3 rounded-lg font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
            isCountingDown
              ? 'bg-amber-600 border-white text-white animate-pulse shadow-lg shadow-amber-500/50'
              : isConnected && !isEmergency
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:from-emerald-800 active:to-emerald-900 text-white border-emerald-400/60 shadow-lg shadow-emerald-600/30'
              : 'bg-zinc-950 border-zinc-800 text-zinc-600 cursor-not-allowed'
          }`}
          title="Iniciar combate con cuenta regresiva de 3s (START)"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{isCountingDown ? '3s DESPLIEGUE...' : 'INICIAR (START)'}</span>
        </button>
      </div>

      {/* 3. MODE SELECTOR (MANUAL vs AUTO) */}
      <div className="pt-2 border-t border-zinc-800">
        <div className="text-[10px] font-mono tracking-wider uppercase text-zinc-400 font-bold mb-2 flex items-center justify-between">
          <span>SELECCIÓN DE MODO DE COMBATE</span>
          <span className="text-zinc-500">ENVÍA MODE:MANUAL / MODE:AUTO</span>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
          <button
            type="button"
            onClick={() => handleModeChange('MANUAL')}
            disabled={!isConnected || isEmergency}
            className={`py-2 px-3 rounded-md text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${
              currentMode === 'MANUAL'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : isConnected
                ? 'text-zinc-400 hover:text-zinc-200'
                : 'text-zinc-600 cursor-not-allowed'
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
            <span>MODO MANUAL</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('AUTO')}
            disabled={!isConnected || isEmergency}
            className={`py-2 px-3 rounded-md text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${
              currentMode === 'AUTO'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : isConnected
                ? 'text-zinc-400 hover:text-zinc-200'
                : 'text-zinc-600 cursor-not-allowed'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>MODO AUTÓNOMO</span>
          </button>
        </div>
      </div>
    </div>
  );
};
