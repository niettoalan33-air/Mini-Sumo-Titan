import React from 'react';
import { Activity, Gauge, Eye, AlertOctagon, Battery, Cpu, Radio, Shield } from 'lucide-react';
import { TelemetryData } from '../types/robot';

interface TelemetryViewProps {
  telemetry: TelemetryData | null;
  isConnected: boolean;
}

export const TelemetryView: React.FC<TelemetryViewProps> = ({ telemetry, isConnected }) => {
  const hasData = isConnected && telemetry !== null;

  // Values strictly from ESP32 telemetry (no fake values)
  const leftSpeed = hasData ? telemetry.leftMotorSpeed : null;
  const rightSpeed = hasData ? telemetry.rightMotorSpeed : null;
  const frontSensor = hasData ? telemetry.frontSensor : null;
  const rearSensor = hasData ? telemetry.rearSensor : null;
  const emergency = hasData ? telemetry.emergency : false;
  const batteryVoltage = hasData ? telemetry.batteryVoltage : null;
  const batteryPercent = hasData ? telemetry.batteryPercent : null;
  const mode = hasData ? telemetry.mode : '--';
  const state = hasData ? telemetry.state : 'DESCONECTADO';

  const isFrontActive = frontSensor !== null && (frontSensor === 1 || frontSensor === true || Number(frontSensor) > 0);
  const isRearActive = rearSensor !== null && (rearSensor === 1 || rearSensor === true || Number(rearSensor) > 0);

  // Speed bar percentage (-255 to 255 normalized)
  const calcBarWidth = (speed: number | null) => {
    if (speed === null) return 0;
    return Math.min(100, Math.round((Math.abs(speed) / 255) * 100));
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-red-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
            PANEL DE TELEMETRÍA EN TIEMPO REAL
          </h2>
        </div>
        <div className="text-[11px] font-mono text-zinc-400">
          {hasData ? (
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sincronizado
            </span>
          ) : (
            <span className="text-zinc-500">Sin datos</span>
          )}
        </div>
      </div>

      {/* Grid of Key Sensors & Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Front Sensor */}
        <div className={`p-3 rounded-lg border flex flex-col justify-between transition-colors ${
          isFrontActive
            ? 'bg-red-950/40 border-red-500 shadow-md shadow-red-500/20'
            : 'bg-zinc-950/70 border-zinc-800'
        }`}>
          <div className="flex items-center justify-between text-zinc-400 text-[10px] font-mono uppercase">
            <span>SENSOR DELANTERO</span>
            <Eye className="w-3.5 h-3.5" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-sm font-black font-mono ${isFrontActive ? 'text-red-400' : 'text-zinc-300'}`}>
              {frontSensor !== null ? (isFrontActive ? 'DETECTADO' : 'LIBRE') : '--'}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              [f: {frontSensor !== null ? String(frontSensor) : '--'}]
            </span>
          </div>
        </div>

        {/* Rear Sensor */}
        <div className={`p-3 rounded-lg border flex flex-col justify-between transition-colors ${
          isRearActive
            ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-500/20'
            : 'bg-zinc-950/70 border-zinc-800'
        }`}>
          <div className="flex items-center justify-between text-zinc-400 text-[10px] font-mono uppercase">
            <span>SENSOR TRASERO</span>
            <Eye className="w-3.5 h-3.5" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-sm font-black font-mono ${isRearActive ? 'text-amber-400' : 'text-zinc-300'}`}>
              {rearSensor !== null ? (isRearActive ? 'DETECTADO' : 'LIBRE') : '--'}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              [r: {rearSensor !== null ? String(rearSensor) : '--'}]
            </span>
          </div>
        </div>

        {/* Emergency Flag */}
        <div className={`p-3 rounded-lg border flex flex-col justify-between ${
          emergency
            ? 'bg-red-950 border-red-500 shadow-lg shadow-red-500/30'
            : 'bg-zinc-950/70 border-zinc-800'
        }`}>
          <div className="flex items-center justify-between text-zinc-400 text-[10px] font-mono uppercase">
            <span>EMERGENCIA</span>
            <AlertOctagon className="w-3.5 h-3.5" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-sm font-black font-mono ${emergency ? 'text-red-400' : 'text-emerald-400'}`}>
              {hasData ? (emergency ? 'ACTIVADA (1)' : 'OK (0)') : '--'}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">[e: {hasData ? (emergency ? '1' : '0') : '--'}]</span>
          </div>
        </div>

        {/* Battery Measurement */}
        <div className="p-3 rounded-lg border bg-zinc-950/70 border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] font-mono uppercase">
            <span>BATERÍA</span>
            <Battery className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            {batteryVoltage !== null ? (
              <>
                <span className="text-sm font-black font-mono text-emerald-400">
                  {batteryVoltage.toFixed(2)}V
                </span>
                {batteryPercent !== null && (
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {batteryPercent}%
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs font-mono text-zinc-500 italic">
                Sin medición válida
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Motors Speed Meters (Left and Right) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Left Motor */}
        <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800">
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className="text-zinc-400 uppercase font-bold flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-red-500" />
              Motor Izquierdo (l)
            </span>
            <span className="font-black text-white text-sm">
              {leftSpeed !== null ? leftSpeed : '--'}
              <span className="text-[10px] text-zinc-500 ml-1">/ 255</span>
            </span>
          </div>
          {/* Visual bar */}
          <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 relative">
            <div
              className={`h-full transition-all duration-150 ${
                leftSpeed && leftSpeed < 0 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${calcBarWidth(leftSpeed)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-1">
            <span>0</span>
            <span>128</span>
            <span>255 PWM</span>
          </div>
        </div>

        {/* Right Motor */}
        <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800">
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className="text-zinc-400 uppercase font-bold flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-red-500" />
              Motor Derecho (q)
            </span>
            <span className="font-black text-white text-sm">
              {rightSpeed !== null ? rightSpeed : '--'}
              <span className="text-[10px] text-zinc-500 ml-1">/ 255</span>
            </span>
          </div>
          {/* Visual bar */}
          <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 relative">
            <div
              className={`h-full transition-all duration-150 ${
                rightSpeed && rightSpeed < 0 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${calcBarWidth(rightSpeed)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-1">
            <span>0</span>
            <span>128</span>
            <span>255 PWM</span>
          </div>
        </div>
      </div>

      {/* Mini-Sumo Tactical Dohyo Diagram */}
      <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 flex flex-col items-center">
        <div className="text-[10px] font-mono uppercase text-zinc-400 mb-2 font-bold tracking-wider">
          VISUALIZADOR TÁCTICO DOHYO (77cm MINI SUMO)
        </div>

        <div className="relative w-48 h-48 rounded-full bg-zinc-900 border-4 border-white flex items-center justify-center shadow-inner shadow-black">
          {/* Dohyo Shikiri lines (starting marks) */}
          <div className="absolute w-8 h-1 bg-zinc-600 top-20 rounded" />
          <div className="absolute w-8 h-1 bg-zinc-600 bottom-20 rounded" />

          {/* Front Sensor visual beam cone */}
          <div
            className={`absolute -top-3 w-16 h-8 rounded-t-full transition-opacity duration-200 pointer-events-none ${
              isFrontActive
                ? 'bg-gradient-to-t from-red-600/40 to-transparent border-t-2 border-red-500 opacity-100 animate-pulse'
                : 'opacity-10 border-t border-zinc-700'
            }`}
          />

          {/* Rear Sensor visual beam cone */}
          <div
            className={`absolute -bottom-3 w-16 h-8 rounded-b-full transition-opacity duration-200 pointer-events-none ${
              isRearActive
                ? 'bg-gradient-to-b from-amber-600/40 to-transparent border-b-2 border-amber-500 opacity-100 animate-pulse'
                : 'opacity-10 border-b border-zinc-700'
            }`}
          />

          {/* 500g Mini-Sumo Robot Chassis (10x10 cm scale representation) */}
          <div className="relative w-20 h-20 rounded-md bg-zinc-950 border-2 border-red-500/80 shadow-2xl flex flex-col items-center justify-between p-1 z-10">
            {/* Front scoop / wedge blade */}
            <div className="w-full h-1.5 bg-gradient-to-r from-red-600 via-white to-red-600 rounded-sm" />

            <div className="text-center font-mono">
              <span className="text-[9px] font-black tracking-widest text-white block">TITAN</span>
              <span className="text-[7px] text-zinc-400">500g</span>
            </div>

            {/* Wheels / tracks */}
            <div className="w-full flex justify-between px-0.5">
              <div className={`w-1 h-3 rounded-xs ${leftSpeed && leftSpeed !== 0 ? 'bg-red-400 animate-pulse' : 'bg-zinc-700'}`} />
              <div className={`w-1 h-3 rounded-xs ${rightSpeed && rightSpeed !== 0 ? 'bg-red-400 animate-pulse' : 'bg-zinc-700'}`} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-400 mt-2">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isFrontActive ? 'bg-red-500' : 'bg-zinc-700'}`} />
            <span>Frente: {isFrontActive ? 'ALERTA' : 'DESPEJADO'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isRearActive ? 'bg-amber-500' : 'bg-zinc-700'}`} />
            <span>Atrás: {isRearActive ? 'ALERTA' : 'DESPEJADO'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
