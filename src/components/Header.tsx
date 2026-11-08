import React, { useState, useEffect } from 'react';
import { ShieldAlert, Bluetooth, Wifi, Volume2, VolumeX, Battery, BatteryCharging, Zap } from 'lucide-react';
import { ConnectionMedium, ConnectionStatus, TelemetryData } from '../types/robot';
import { sounds } from '../utils/audio';

interface HeaderProps {
  status: ConnectionStatus;
  medium: ConnectionMedium;
  telemetry: TelemetryData | null;
}

export const Header: React.FC<HeaderProps> = ({ status, medium, telemetry }) => {
  const [audioEnabled, setAudioEnabled] = useState(sounds.isEnabled());

  useEffect(() => {
    sounds.setEnabled(audioEnabled);
  }, [audioEnabled]);

  const toggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    if (next) sounds.playBeep(800, 0.05);
  };

  const isConnected = status === 'connected';

  // Battery is strictly shown if ESP32 provided valid voltage
  const hasValidBattery = telemetry && telemetry.batteryVoltage !== null && telemetry.batteryVoltage > 0;

  return (
    <header className="border-b border-red-950/60 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3 shadow-lg shadow-black/60">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Category */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-950 border border-red-500/50 shadow-inner shadow-red-500/40">
            <Zap className="w-5 h-5 text-white" />
            {isConnected && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-black tracking-wider text-white uppercase italic">
                MINI SUMO <span className="text-red-500">TITAN</span>
              </h1>
              <span className="text-[10px] font-mono tracking-widest px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60 font-semibold">
                500g COMBAT
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
              <span>ESP32 FIRMWARE PROTOCOL</span>
              <span className="text-zinc-600">•</span>
              <span className="uppercase text-zinc-300 font-bold">{medium === 'ble' ? 'Bluetooth BLE' : 'Wi-Fi WebSocket'}</span>
            </p>
          </div>
        </div>

        {/* Right side: Telemetry summary & Audio toggle */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Battery Indicator (Valid measurements only) */}
          {hasValidBattery ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono">
              <Battery className="w-4 h-4 text-emerald-400" />
              <span className="text-zinc-200 font-bold">
                {telemetry.batteryVoltage?.toFixed(2)}V
              </span>
              {telemetry.batteryPercent !== null && (
                <span className="text-zinc-400 text-[10px]">
                  ({telemetry.batteryPercent}%)
                </span>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-900/60 border border-zinc-800/60 text-[11px] font-mono text-zinc-500" title="El ESP32 aún no reporta medición de batería">
              <Battery className="w-3.5 h-3.5 text-zinc-600" />
              <span>Bat: --</span>
            </div>
          )}

          {/* Connection Pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-xs font-bold transition-all border ${
              isConnected
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400 shadow-sm shadow-emerald-500/20'
                : status === 'connecting'
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 animate-pulse'
                : status === 'error'
                ? 'bg-red-950/40 border-red-500/50 text-red-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}
          >
            {medium === 'ble' ? (
              <Bluetooth className={`w-3.5 h-3.5 ${isConnected ? 'text-blue-400' : ''}`} />
            ) : (
              <Wifi className={`w-3.5 h-3.5 ${isConnected ? 'text-amber-400' : ''}`} />
            )}
            <span className="uppercase tracking-wider">
              {status === 'connected'
                ? 'ONLINE'
                : status === 'connecting'
                ? 'CONECTANDO...'
                : status === 'error'
                ? 'ERROR'
                : 'OFFLINE'}
            </span>
          </div>

          {/* Sound cue toggle */}
          <button
            onClick={toggleAudio}
            className={`p-2 rounded-lg border transition-all ${
              audioEnabled
                ? 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:text-white hover:border-red-500'
                : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:text-zinc-400'
            }`}
            title={audioEnabled ? 'Silenciar efectos de sonido' : 'Activar efectos de sonido'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-red-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
