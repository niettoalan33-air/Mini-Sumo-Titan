import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ConnectionPanel } from './components/ConnectionPanel';
import { RobotStateBanner } from './components/RobotStateBanner';
import { ControlsPad } from './components/ControlsPad';
import { TacticalActions } from './components/TacticalActions';
import { TelemetryView } from './components/TelemetryView';
import { CommandLog } from './components/CommandLog';
import { robot } from './services/robotConnection';
import { ConnectionMedium, ConnectionStatus, TelemetryData, CommandLogEntry } from './types/robot';

export default function App() {
  const [status, setStatus] = useState<ConnectionStatus>(robot.getStatus());
  const [medium, setMedium] = useState<ConnectionMedium>(robot.getMedium());
  const [errorMessage, setErrorMessage] = useState<string | null>(robot.getErrorMessage());
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(robot.getLastTelemetry());
  const [logs, setLogs] = useState<CommandLogEntry[]>([]);

  useEffect(() => {
    const unsubStatus = robot.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    const unsubTelemetry = robot.onTelemetry((newTelemetry) => {
      setTelemetry(newTelemetry);
    });

    const unsubError = robot.onError((err) => {
      setErrorMessage(err);
    });

    const unsubLog = robot.onLog((entry) => {
      setLogs((prev) => [...prev.slice(-100), entry]); // keep last 100 entries
    });

    return () => {
      unsubStatus();
      unsubTelemetry();
      unsubError();
      unsubLog();
    };
  }, []);

  const isConnected = status === 'connected';
  const isEmergency = Boolean(telemetry?.emergency);
  const currentMode = telemetry?.mode || 'MANUAL';
  const robotState = telemetry?.state || 'STANDBY_SEGURIDAD';

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-red-600 selection:text-white pb-10">
      {/* Top Header */}
      <Header status={status} medium={medium} telemetry={telemetry} />

      {/* Main Tactical Dashboard */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-4 md:p-6 space-y-4">
        {/* State Banner: 3s Countdown / Edge Evasion / Emergency / Robot State */}
        <RobotStateBanner telemetry={telemetry} isConnected={isConnected} />

        {/* Connection Setup (BLE & Wi-Fi) */}
        <ConnectionPanel
          status={status}
          medium={medium}
          onMediumChange={(m) => setMedium(m)}
          errorMessage={errorMessage}
        />

        {/* Combat Controls & Tactical Actions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Movement Controls (D-Pad) - 6 cols on lg */}
          <div className="lg:col-span-6">
            <ControlsPad
              isConnected={isConnected}
              isEmergency={isEmergency}
              disabledNotice={
                !isConnected
                  ? '⚠️ Conecta el ESP32 para habilitar el movimiento'
                  : isEmergency
                  ? '🛑 PARADA DE EMERGENCIA ACTIVA: Presiona RESET para desbloquear'
                  : null
              }
            />
          </div>

          {/* Tactical Actions (ESTOP, RESET, START, MODES) - 6 cols on lg */}
          <div className="lg:col-span-6">
            <TacticalActions
              isConnected={isConnected}
              currentMode={currentMode}
              isEmergency={isEmergency}
              robotState={robotState}
            />
          </div>
        </div>

        {/* Telemetry & Sensor Readings */}
        <TelemetryView telemetry={telemetry} isConnected={isConnected} />

        {/* Real-time Protocol Terminal */}
        <CommandLog logs={logs} onClear={clearLogs} />

        {/* Competition Reference Footer */}
        <footer className="text-center pt-4 text-xs font-mono text-zinc-500 border-t border-zinc-900 space-y-1">
          <p className="font-semibold text-zinc-400">
            MINI SUMO TITAN – SISTEMA DE CONTROL DE COMBATE (500g)
          </p>
          <p className="text-[11px] text-zinc-600">
            BLE Service: 4fafc201-1fb5-459e-8fcc-c5c9c331914b • WebSocket: ws://192.168.4.1:81 • Heartbeat: PING 500ms
          </p>
        </footer>
      </main>
    </div>
  );
}
