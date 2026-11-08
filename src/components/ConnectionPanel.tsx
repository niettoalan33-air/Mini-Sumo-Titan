import React, { useState } from 'react';
import { Bluetooth, Wifi, RefreshCw, AlertTriangle, CheckCircle2, XCircle, Info, ExternalLink, Settings } from 'lucide-react';
import { ConnectionMedium, ConnectionStatus } from '../types/robot';
import { robot, BLE_CONFIG, DEFAULT_WIFI_CONFIG } from '../services/robotConnection';
import { sounds } from '../utils/audio';

interface ConnectionPanelProps {
  status: ConnectionStatus;
  medium: ConnectionMedium;
  onMediumChange: (m: ConnectionMedium) => void;
  errorMessage: string | null;
}

export const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
  status,
  medium,
  onMediumChange,
  errorMessage,
}) => {
  const [wsUrl, setWsUrl] = useState(robot.getWsUrl());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isBleSupported = robot.isBluetoothSupported();
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  const handleConnect = async () => {
    sounds.playBeep(700, 0.08);
    if (medium === 'wifi') {
      robot.setWsUrl(wsUrl);
    }
    await robot.connect();
  };

  const handleDisconnect = () => {
    sounds.playBeep(400, 0.08);
    robot.disconnect();
  };

  const handleMediumSelect = (m: ConnectionMedium) => {
    if (m === medium) return;
    sounds.playBeep(600, 0.04);
    robot.setMedium(m);
    onMediumChange(m);
  };

  const resetWsDefault = () => {
    setWsUrl(DEFAULT_WIFI_CONFIG.DEFAULT_URL);
    robot.setWsUrl(DEFAULT_WIFI_CONFIG.DEFAULT_URL);
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-xl shadow-black/40">
      {/* Selector Tabs */}
      <div className="flex items-center justify-between mb-3 border-b border-zinc-800/80 pb-2">
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => handleMediumSelect('ble')}
            disabled={isConnecting}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${
              medium === 'ble'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bluetooth className="w-4 h-4 text-blue-300" />
            <span>Bluetooth BLE</span>
          </button>

          <button
            onClick={() => handleMediumSelect('wifi')}
            disabled={isConnecting}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${
              medium === 'wifi'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wifi className="w-4 h-4 text-amber-300" />
            <span>Wi-Fi WebSocket</span>
          </button>
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-md hover:bg-zinc-800 transition-colors"
          title="Parámetros técnicos"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* BLE unsupported warning */}
      {medium === 'ble' && !isBleSupported && (
        <div className="mb-3 p-3 bg-amber-950/40 border border-amber-600/50 rounded-lg text-amber-200 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-300">
              Web Bluetooth no soportado en este navegador
            </p>
            <p className="text-zinc-300 leading-relaxed">
              Tu navegador o plataforma no tiene habilitada la API Web Bluetooth. Te recomendamos usar la pestaña <strong className="text-amber-300">Wi-Fi WebSocket</strong> (192.168.4.1:81) o abrir esta web en <strong className="text-white">Google Chrome / Microsoft Edge</strong> sobre Android o PC con Bluetooth.
            </p>
          </div>
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div className="mb-3 p-3 bg-red-950/50 border border-red-600/60 rounded-lg text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn">
          <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-red-300">Aviso del enlace de comunicaciones:</p>
            <p className="text-zinc-200 break-words">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Connection Info & Action Button */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
        <div className="sm:col-span-2 text-xs font-mono">
          {medium === 'ble' ? (
            <div className="bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800/80 space-y-1">
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-500">Dispositivo objetivo:</span>
                <span className="font-bold text-white bg-zinc-800 px-1.5 py-0.5 rounded text-[11px]">{BLE_CONFIG.DEVICE_NAME}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                <span className="text-zinc-500">Service UUID:</span>
                <span className="truncate max-w-[200px]" title={BLE_CONFIG.SERVICE_UUID}>{BLE_CONFIG.SERVICE_UUID}</span>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between text-zinc-300 text-[11px]">
                <span className="text-zinc-500">Red AP ESP32:</span>
                <span className="font-bold text-amber-300">{DEFAULT_WIFI_CONFIG.SSID}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={wsUrl}
                  onChange={(e) => setWsUrl(e.target.value)}
                  disabled={isConnected || isConnecting}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                  placeholder="ws://192.168.4.1:81"
                />
                {wsUrl !== DEFAULT_WIFI_CONFIG.DEFAULT_URL && (
                  <button
                    onClick={resetWsDefault}
                    className="text-[10px] text-zinc-400 hover:text-white px-1.5 py-1 bg-zinc-800 rounded border border-zinc-700 shrink-0"
                    title="Restablecer IP por defecto"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Big Action Button */}
        <div className="sm:col-span-1">
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-zinc-200 border border-zinc-600 rounded-lg font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <XCircle className="w-4 h-4 text-red-400" />
              <span>Desconectar</span>
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting || (medium === 'ble' && !isBleSupported)}
              className={`w-full py-3 px-4 rounded-lg font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
                isConnecting
                  ? 'bg-amber-600/60 text-white cursor-wait animate-pulse'
                  : medium === 'ble' && !isBleSupported
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:from-red-800 active:to-red-900 text-white shadow-red-600/30 hover:shadow-red-600/50'
              }`}
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Conectando...</span>
                </>
              ) : (
                <>
                  {medium === 'ble' ? <Bluetooth className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                  <span>Conectar Robot</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Advanced Technical Specifications drawer */}
      {showAdvanced && (
        <div className="mt-3 pt-3 border-t border-zinc-800 text-xs font-mono text-zinc-400 space-y-1.5 bg-zinc-950/40 p-2.5 rounded-lg">
          <p className="font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-red-400" />
            Parámetros del protocolo ESP32:
          </p>
          <p>• BLE Service: <span className="text-zinc-200">{BLE_CONFIG.SERVICE_UUID}</span></p>
          <p>• BLE TX Char (Comandos): <span className="text-zinc-200">{BLE_CONFIG.TX_CHAR_UUID}</span></p>
          <p>• BLE RX Char (Telemetría): <span className="text-zinc-200">{BLE_CONFIG.RX_CHAR_UUID}</span></p>
          <p>• Wi-Fi AP SSID: <span className="text-zinc-200">{DEFAULT_WIFI_CONFIG.SSID}</span> (IP 192.168.4.1 : 81)</p>
          <p>• Heartbeat: <span className="text-emerald-400">PING cada 500ms</span> automático mientras conectado</p>
          <p>• Cadencia de movimiento: <span className="text-emerald-400">200ms continuo</span>, 'S:0' al soltar</p>
        </div>
      )}
    </div>
  );
};
