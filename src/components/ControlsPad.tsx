import React, { useState, useEffect, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Square, Gamepad2, Keyboard } from 'lucide-react';
import { robot } from '../services/robotConnection';
import { sounds } from '../utils/audio';

interface ControlsPadProps {
  isConnected: boolean;
  isEmergency: boolean;
  disabledNotice?: string | null;
}

type Direction = 'F:255' | 'B:255' | 'L:255' | 'R:255' | null;

export const ControlsPad: React.FC<ControlsPadProps> = ({ isConnected, isEmergency, disabledNotice }) => {
  const [activeDirection, setActiveDirection] = useState<Direction>(null);

  const canControl = isConnected && !isEmergency;

  const handlePressStart = useCallback(
    (cmd: 'F:255' | 'B:255' | 'L:255' | 'R:255') => {
      if (!canControl) {
        if (!isConnected) {
          robot.sendRawCommand(cmd); // will trigger standard 'Robot desconectado' warning
        }
        return;
      }
      setActiveDirection(cmd);
      sounds.playBeep(900, 0.04);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }
      robot.startRepeatingMovement(cmd);
    },
    [canControl, isConnected]
  );

  const handlePressEnd = useCallback(() => {
    if (activeDirection) {
      setActiveDirection(null);
      robot.stopRepeatingMovement();
      sounds.playBeep(450, 0.03);
    }
  }, [activeDirection]);

  const handleExplicitStop = useCallback(() => {
    setActiveDirection(null);
    sounds.playBeep(350, 0.08);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(30);
    }
    robot.stop();
  }, []);

  // Keyboard navigation support (W, A, S, D, Arrows, Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // avoid OS repeat, our service handles the 200ms interval
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          handlePressStart('F:255');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          handlePressStart('B:255');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          handlePressStart('L:255');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          handlePressStart('R:255');
          break;
        case ' ': // Space bar for immediate STOP
          e.preventDefault();
          handleExplicitStop();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'w', 'W', 'ArrowDown', 's', 'S', 'ArrowLeft', 'a', 'A', 'ArrowRight', 'd', 'D'].includes(e.key)) {
        e.preventDefault();
        handlePressEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handlePressStart, handlePressEnd, handleExplicitStop]);

  // Clean up if disconnected or emergency occurs while pressed
  useEffect(() => {
    if (!canControl && activeDirection) {
      setActiveDirection(null);
      robot.stopRepeatingMovement();
    }
  }, [canControl, activeDirection]);

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-xl flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-red-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
            CONTROLES MANUALES (200ms REPEAT)
          </h2>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
          <Keyboard className="w-3.5 h-3.5" />
          <span>W / A / S / D / FLECHAS</span>
        </div>
      </div>

      {disabledNotice && (
        <div className="w-full mb-3 text-center py-1.5 px-2 bg-zinc-950/80 border border-zinc-800 rounded text-[11px] font-mono text-zinc-400">
          {disabledNotice}
        </div>
      )}

      {/* Cross D-Pad Layout */}
      <div className="relative select-none touch-none w-64 h-64 sm:w-72 sm:h-72 my-2 flex items-center justify-center">
        {/* Background tactical ring */}
        <div className="absolute inset-2 rounded-full border border-zinc-800/80 pointer-events-none flex items-center justify-center">
          <div className="w-3/4 h-3/4 rounded-full border border-dashed border-zinc-800/60" />
        </div>

        {/* FORWARD (ADELANTE) */}
        <button
          type="button"
          onPointerDown={() => handlePressStart('F:255')}
          onPointerUp={handlePressEnd}
          onPointerCancel={handlePressEnd}
          onContextMenu={(e) => e.preventDefault()}
          disabled={!canControl}
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 sm:w-22 sm:h-22 rounded-xl flex flex-col items-center justify-center font-black border-2 transition-transform shadow-xl ${
            activeDirection === 'F:255'
              ? 'bg-red-600 border-white text-white scale-95 shadow-red-500/60 shadow-2xl'
              : canControl
              ? 'bg-zinc-800/90 hover:bg-zinc-700 border-zinc-600 text-white active:scale-95'
              : 'bg-zinc-950/60 border-zinc-800/50 text-zinc-600 cursor-not-allowed'
          }`}
        >
          <ChevronUp className="w-8 h-8" />
          <span className="text-[11px] font-mono tracking-wider">ADELANTE</span>
          <span className="text-[9px] text-zinc-400 font-normal">F:255</span>
        </button>

        {/* BACKWARD (ATRÁS) */}
        <button
          type="button"
          onPointerDown={() => handlePressStart('B:255')}
          onPointerUp={handlePressEnd}
          onPointerCancel={handlePressEnd}
          onContextMenu={(e) => e.preventDefault()}
          disabled={!canControl}
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-20 sm:w-22 sm:h-22 rounded-xl flex flex-col items-center justify-center font-black border-2 transition-transform shadow-xl ${
            activeDirection === 'B:255'
              ? 'bg-red-600 border-white text-white scale-95 shadow-red-500/60 shadow-2xl'
              : canControl
              ? 'bg-zinc-800/90 hover:bg-zinc-700 border-zinc-600 text-white active:scale-95'
              : 'bg-zinc-950/60 border-zinc-800/50 text-zinc-600 cursor-not-allowed'
          }`}
        >
          <span className="text-[9px] text-zinc-400 font-normal">B:255</span>
          <span className="text-[11px] font-mono tracking-wider">ATRÁS</span>
          <ChevronDown className="w-8 h-8" />
        </button>

        {/* LEFT (IZQUIERDA) */}
        <button
          type="button"
          onPointerDown={() => handlePressStart('L:255')}
          onPointerUp={handlePressEnd}
          onPointerCancel={handlePressEnd}
          onContextMenu={(e) => e.preventDefault()}
          disabled={!canControl}
          className={`absolute left-0 top-1/2 -translate-y-1/2 w-20 h-20 sm:w-22 sm:h-22 rounded-xl flex flex-col items-center justify-center font-black border-2 transition-transform shadow-xl ${
            activeDirection === 'L:255'
              ? 'bg-red-600 border-white text-white scale-95 shadow-red-500/60 shadow-2xl'
              : canControl
              ? 'bg-zinc-800/90 hover:bg-zinc-700 border-zinc-600 text-white active:scale-95'
              : 'bg-zinc-950/60 border-zinc-800/50 text-zinc-600 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="w-8 h-8" />
          <span className="text-[10px] font-mono tracking-wider">IZQ</span>
          <span className="text-[9px] text-zinc-400 font-normal">L:255</span>
        </button>

        {/* RIGHT (DERECHA) */}
        <button
          type="button"
          onPointerDown={() => handlePressStart('R:255')}
          onPointerUp={handlePressEnd}
          onPointerCancel={handlePressEnd}
          onContextMenu={(e) => e.preventDefault()}
          disabled={!canControl}
          className={`absolute right-0 top-1/2 -translate-y-1/2 w-20 h-20 sm:w-22 sm:h-22 rounded-xl flex flex-col items-center justify-center font-black border-2 transition-transform shadow-xl ${
            activeDirection === 'R:255'
              ? 'bg-red-600 border-white text-white scale-95 shadow-red-500/60 shadow-2xl'
              : canControl
              ? 'bg-zinc-800/90 hover:bg-zinc-700 border-zinc-600 text-white active:scale-95'
              : 'bg-zinc-950/60 border-zinc-800/50 text-zinc-600 cursor-not-allowed'
          }`}
        >
          <ChevronRight className="w-8 h-8" />
          <span className="text-[10px] font-mono tracking-wider">DER</span>
          <span className="text-[9px] text-zinc-400 font-normal">R:255</span>
        </button>

        {/* CENTER STOP BUTTON (S:0) */}
        <button
          type="button"
          onClick={handleExplicitStop}
          onContextMenu={(e) => e.preventDefault()}
          disabled={!isConnected}
          className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center font-black border-2 shadow-2xl transition-all z-10 ${
            isConnected
              ? 'bg-gradient-to-br from-red-800 to-zinc-950 border-red-500 hover:border-white text-white hover:scale-105 active:scale-95 shadow-red-950/50'
              : 'bg-zinc-950 border-zinc-800 text-zinc-600 cursor-not-allowed'
          }`}
          title="Detener motores (S:0)"
        >
          <Square className="w-5 h-5 text-red-500 fill-red-500" />
          <span className="text-xs tracking-wider uppercase font-black">STOP</span>
          <span className="text-[9px] font-mono text-zinc-400">S:0</span>
        </button>
      </div>

      <div className="w-full text-center mt-2">
        <p className="text-[11px] font-mono text-zinc-400">
          Mantener presionado: envía comando cada <strong className="text-red-400">200ms</strong>. Al soltar: envía inmediatamente <strong className="text-white">S:0</strong>.
        </p>
      </div>
    </div>
  );
};
