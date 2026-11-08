import React from 'react';
import { AlertOctagon, ShieldAlert, Zap, Radio, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { TelemetryData } from '../types/robot';

interface RobotStateBannerProps {
  telemetry: TelemetryData | null;
  isConnected: boolean;
}

export const RobotStateBanner: React.FC<RobotStateBannerProps> = ({ telemetry, isConnected }) => {
  const currentState = telemetry?.state || 'STANDBY_SEGURIDAD';
  const isEmergency = Boolean(telemetry?.emergency);
  const isEdgeDetected = Boolean(telemetry?.edgeDetected) || currentState === 'EVASION_AUTONOMA';
  const mode = telemetry?.mode || 'MANUAL';

  // State presentation helper
  const getStateConfig = (state: string) => {
    switch (state) {
      case 'DESPLIEGUE_3S':
        return {
          title: 'DESPLIEGUE REGAMENTARIO (3s)',
          subtitle: 'Cuenta regresiva en curso en el ESP32 – ¡Mantener distancia!',
          color: 'from-amber-600/30 to-amber-950/60 border-amber-500 text-amber-400',
          badge: 'bg-amber-500 text-black',
          icon: Clock,
          pulse: true,
        };
      case 'COMBATE_MANUAL':
        return {
          title: 'COMBATE MANUAL ACTIVO',
          subtitle: 'Control por piloto habilitado – F:255, B:255, L:255, R:255',
          color: 'from-blue-600/30 to-blue-950/60 border-blue-500 text-blue-400',
          badge: 'bg-blue-500 text-white',
          icon: Zap,
          pulse: false,
        };
      case 'EVASION_AUTONOMA':
        return {
          title: 'EVASIÓN AUTÓNOMA ACTIVA',
          subtitle: 'Algoritmo del ESP32 gestionando búsqueda y dohyo',
          color: 'from-purple-600/30 to-purple-950/60 border-purple-500 text-purple-300',
          badge: 'bg-purple-600 text-white',
          icon: Radio,
          pulse: true,
        };
      case 'STANDBY_SEGURIDAD':
      default:
        return {
          title: 'STANDBY DE SEGURIDAD',
          subtitle: 'Robot en reposo seguro. Presiona INICIAR o selecciona modo.',
          color: 'from-zinc-800/40 to-zinc-950/80 border-zinc-700 text-zinc-300',
          badge: 'bg-zinc-700 text-zinc-200',
          icon: ShieldCheck,
          pulse: false,
        };
    }
  };

  const stateCfg = getStateConfig(currentState);
  const StateIcon = stateCfg.icon;

  return (
    <div className="space-y-2">
      {/* 1. EMERGENCY ACTIVE BANNER (Highest priority safety notice) */}
      {isEmergency && (
        <div className="bg-red-950 border-2 border-red-500 text-red-100 p-4 rounded-xl flex items-center gap-3.5 shadow-2xl shadow-red-600/50 animate-pulse">
          <div className="p-2.5 bg-red-600 text-white rounded-lg shrink-0">
            <AlertOctagon className="w-7 h-7 animate-bounce" />
          </div>
          <div className="flex-1">
            <h2 className="text-base sm:text-lg font-black tracking-wider uppercase text-white flex items-center gap-2">
              <span>¡PARADA DE EMERGENCIA ACTIVA (ESTOP)!</span>
            </h2>
            <p className="text-xs sm:text-sm text-red-200 font-mono mt-0.5">
              Todos los motores bloqueados. El robot no responderá a movimientos hasta enviar <strong className="text-white underline">RESET</strong>.
            </p>
          </div>
        </div>
      )}

      {/* 2. EDGE DETECTED ALERT (Requirement 7: "Cuando el robot detecte un borde, mostrar: EVASIÓN DE BORDE ACTIVADA") */}
      {isEdgeDetected && !isEmergency && (
        <div className="bg-gradient-to-r from-amber-950 via-red-950 to-amber-950 border-2 border-amber-400 text-amber-100 p-3.5 rounded-xl flex items-center gap-3 shadow-lg shadow-amber-500/30 animate-pulse">
          <div className="p-2 bg-amber-500 text-black rounded-lg shrink-0 font-black">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-black tracking-widest uppercase text-amber-300">
              ⚡ EVASIÓN DE BORDE ACTIVADA ⚡
            </h3>
            <p className="text-xs text-amber-200/90 font-mono">
              Sensor de línea blanca detectó límite del tatami Dohyo. El ESP32 ejecuta maniobra evasiva inmediata.
            </p>
          </div>
        </div>
      )}

      {/* 3. CURRENT ROBOT STATE DISPLAY */}
      <div
        className={`bg-gradient-to-r ${stateCfg.color} border rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg transition-all ${
          stateCfg.pulse ? 'ring-1 ring-amber-400/50' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 shrink-0">
            <StateIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-400 font-bold">
                ESTADO OFICIAL ROBOT:
              </span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded font-mono ${stateCfg.badge}`}>
                {currentState}
              </span>
            </div>
            <h3 className="text-base font-black tracking-wider uppercase text-white mt-0.5">
              {stateCfg.title}
            </h3>
            <p className="text-xs text-zinc-300 font-mono">
              {isConnected ? stateCfg.subtitle : 'Desconectado. Conéctate para sincronizar el estado real del ESP32.'}
            </p>
          </div>
        </div>

        {/* Mode & Timing Badge */}
        <div className="flex items-center gap-2 sm:self-center">
          <div className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-right">
            <div className="text-[10px] text-zinc-400 font-mono uppercase">MODO ACTIVO</div>
            <div className="text-xs font-black text-white font-mono tracking-wider flex items-center gap-1 justify-end">
              <span className={`w-2 h-2 rounded-full ${mode === 'AUTO' ? 'bg-purple-400' : 'bg-blue-400'}`} />
              {mode}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
