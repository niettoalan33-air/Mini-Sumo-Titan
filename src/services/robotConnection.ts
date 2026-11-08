import { ConnectionMedium, ConnectionStatus, TelemetryData, RobotState, RobotMode, CommandLogEntry } from '../types/robot';

export const BLE_CONFIG = {
  DEVICE_NAME: 'MINI_SUMO',
  SERVICE_UUID: '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
  TX_CHAR_UUID: 'c565818d-6972-466d-88b0-517865f14d02',
  RX_CHAR_UUID: 'c565818e-6972-466d-88b0-517865f14d02',
};

export const DEFAULT_WIFI_CONFIG = {
  SSID: 'MINI_SUMO-TITAN',
  DEFAULT_IP: '192.168.4.1',
  DEFAULT_PORT: 81,
  DEFAULT_URL: 'ws://192.168.4.1:81',
};

type Listener<T> = (data: T) => void;

interface BluetoothRemoteGATTCharacteristicCompat {
  writeValue?: (value: BufferSource) => Promise<void>;
  writeValueWithoutResponse?: (value: BufferSource) => Promise<void>;
  startNotifications: () => Promise<BluetoothRemoteGATTCharacteristicCompat>;
  stopNotifications?: () => Promise<BluetoothRemoteGATTCharacteristicCompat>;
  addEventListener: (type: string, listener: (ev: Event) => void) => void;
  removeEventListener: (type: string, listener: (ev: Event) => void) => void;
  value?: DataView;
}

interface BluetoothDeviceCompat {
  name?: string;
  id: string;
  gatt?: {
    connected: boolean;
    connect: () => Promise<{
      getPrimaryService: (service: string) => Promise<{
        getCharacteristic: (char: string) => Promise<BluetoothRemoteGATTCharacteristicCompat>;
      }>;
      disconnect: () => void;
    }>;
    disconnect: () => void;
  };
  addEventListener: (type: string, listener: (ev: Event) => void) => void;
  removeEventListener: (type: string, listener: (ev: Event) => void) => void;
}

export class RobotConnectionManager {
  private medium: ConnectionMedium = 'ble';
  private status: ConnectionStatus = 'disconnected';
  private errorMessage: string | null = null;

  // Web Bluetooth state
  private bleDevice: BluetoothDeviceCompat | null = null;
  private txChar: BluetoothRemoteGATTCharacteristicCompat | null = null;
  private rxChar: BluetoothRemoteGATTCharacteristicCompat | null = null;

  // WebSocket state
  private socket: WebSocket | null = null;
  private wsUrl: string = DEFAULT_WIFI_CONFIG.DEFAULT_URL;

  // Command timers
  private heartbeatIntervalId: number | null = null;
  private repeatIntervalId: number | null = null;
  private currentRepeatingCommand: string | null = null;

  // Telemetry buffer & state
  private telemetryBuffer: string = '';
  private lastTelemetry: TelemetryData | null = null;

  // Listeners
  private statusListeners: Set<Listener<ConnectionStatus>> = new Set();
  private telemetryListeners: Set<Listener<TelemetryData>> = new Set();
  private logListeners: Set<Listener<CommandLogEntry>> = new Set();
  private errorListeners: Set<Listener<string | null>> = new Set();

  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  constructor() {
    // Check if Web Bluetooth is natively supported
    if (typeof navigator !== 'undefined' && !(navigator as unknown as { bluetooth?: unknown }).bluetooth) {
      // Default to wifi if ble not supported in browser
      this.medium = 'wifi';
    }
  }

  public getMedium(): ConnectionMedium {
    return this.medium;
  }

  public setMedium(medium: ConnectionMedium) {
    if (this.status === 'connected' || this.status === 'connecting') {
      this.disconnect();
    }
    this.medium = medium;
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getErrorMessage(): string | null {
    return this.errorMessage;
  }

  public getLastTelemetry(): TelemetryData | null {
    return this.lastTelemetry;
  }

  public getWsUrl(): string {
    return this.wsUrl;
  }

  public setWsUrl(url: string) {
    this.wsUrl = url.trim();
  }

  // --- Subscriptions ---
  public onStatusChange(listener: Listener<ConnectionStatus>): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  public onTelemetry(listener: Listener<TelemetryData>): () => void {
    this.telemetryListeners.add(listener);
    if (this.lastTelemetry) listener(this.lastTelemetry);
    return () => this.telemetryListeners.delete(listener);
  }

  public onLog(listener: Listener<CommandLogEntry>): () => void {
    this.logListeners.add(listener);
    return () => this.logListeners.delete(listener);
  }

  public onError(listener: Listener<string | null>): () => void {
    this.errorListeners.add(listener);
    listener(this.errorMessage);
    return () => this.errorListeners.delete(listener);
  }

  private notifyStatus(status: ConnectionStatus) {
    this.status = status;
    this.statusListeners.forEach((l) => l(status));
  }

  private notifyError(err: string | null) {
    this.errorMessage = err;
    this.errorListeners.forEach((l) => l(err));
  }

  private addLog(direction: 'tx' | 'rx' | 'sys', text: string) {
    const entry: CommandLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      direction,
      text,
      timestamp: new Date(),
    };
    this.logListeners.forEach((l) => l(entry));
  }

  // --- Connection Control ---
  public async connect(): Promise<boolean> {
    this.stopRepeatingMovement();
    this.stopHeartbeat();
    this.notifyError(null);

    if (this.medium === 'ble') {
      return this.connectBle();
    } else {
      return this.connectWifi();
    }
  }

  public isBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && !!(navigator as unknown as { bluetooth?: unknown }).bluetooth;
  }

  private async connectBle(): Promise<boolean> {
    if (!this.isBluetoothSupported()) {
      const msg = 'Web Bluetooth no está disponible en este navegador. Utiliza Google Chrome / Edge o conéctate mediante Wi-Fi WebSocket.';
      this.notifyError(msg);
      this.addLog('sys', `ERROR: ${msg}`);
      this.notifyStatus('error');
      return false;
    }

    try {
      this.notifyStatus('connecting');
      this.addLog('sys', `Buscando robot BLE con servicio ${BLE_CONFIG.SERVICE_UUID}...`);

      const navBle = (navigator as unknown as {
        bluetooth: {
          requestDevice: (options: {
            filters?: Array<{ name?: string; namePrefix?: string; services?: string[] }>;
            optionalServices?: string[];
            acceptAllDevices?: boolean;
          }) => Promise<BluetoothDeviceCompat>;
        };
      }).bluetooth;

      // Request device with service filter and optional device name matching
      const device = await navBle.requestDevice({
        filters: [
          { name: BLE_CONFIG.DEVICE_NAME },
          { namePrefix: 'MINI_SUMO' },
          { services: [BLE_CONFIG.SERVICE_UUID] },
        ],
        optionalServices: [BLE_CONFIG.SERVICE_UUID],
      });

      this.bleDevice = device;
      this.addLog('sys', `Dispositivo seleccionado: ${device.name || device.id}. Conectando a GATT...`);

      device.addEventListener('gattserverdisconnected', this.handleGattDisconnected);

      if (!device.gatt) {
        throw new Error('GATT server no disponible en el dispositivo');
      }

      const server = await device.gatt.connect();
      this.addLog('sys', 'GATT conectado. Obteniendo servicio primario...');

      const service = await server.getPrimaryService(BLE_CONFIG.SERVICE_UUID);
      this.addLog('sys', 'Servicio encontrado. Obteniendo características TX y RX...');

      this.txChar = await service.getCharacteristic(BLE_CONFIG.TX_CHAR_UUID);
      this.rxChar = await service.getCharacteristic(BLE_CONFIG.RX_CHAR_UUID);

      // Start notifications for telemetry
      await this.rxChar.startNotifications();
      this.rxChar.addEventListener('characteristicvaluechanged', this.handleBleTelemetry);

      this.notifyStatus('connected');
      this.addLog('sys', '¡Conexión BLE establecida con MINI_SUMO! Heartbeat activado.');

      // Start periodic 500ms PING heartbeat
      this.startHeartbeat();
      return true;
    } catch (err: unknown) {
      const errorStr = err instanceof Error ? err.message : String(err);
      this.notifyError(`Fallo al conectar BLE: ${errorStr}`);
      this.addLog('sys', `ERROR BLE: ${errorStr}`);
      this.notifyStatus('error');
      this.cleanupBle();
      return false;
    }
  }

  private handleGattDisconnected = () => {
    this.addLog('sys', 'Dispositivo BLE desconectado por el ESP32 o pérdida de señal.');
    this.stopHeartbeat();
    this.stopRepeatingMovement();
    this.cleanupBle();
    this.notifyStatus('disconnected');
    this.notifyError('Conexión Bluetooth perdida con el robot.');
  };

  private handleBleTelemetry = (event: Event) => {
    const target = event.target as unknown as { value?: DataView };
    if (!target || !target.value) return;
    try {
      const chunk = this.decoder.decode(target.value);
      this.processIncomingChunk(chunk);
    } catch (e) {
      console.warn('Error decodificando telemetría BLE', e);
    }
  };

  private cleanupBle() {
    if (this.rxChar) {
      try {
        this.rxChar.removeEventListener('characteristicvaluechanged', this.handleBleTelemetry);
        this.rxChar.stopNotifications?.().catch(() => {});
      } catch {
        // ignore
      }
      this.rxChar = null;
    }
    this.txChar = null;
    if (this.bleDevice) {
      this.bleDevice.removeEventListener('gattserverdisconnected', this.handleGattDisconnected);
      if (this.bleDevice.gatt && this.bleDevice.gatt.connected) {
        this.bleDevice.gatt.disconnect();
      }
      this.bleDevice = null;
    }
  }

  private connectWifi(): Promise<boolean> {
    return new Promise((resolve) => {
      this.notifyStatus('connecting');
      this.addLog('sys', `Conectando WebSocket a ${this.wsUrl}...`);

      try {
        const ws = new WebSocket(this.wsUrl);
        this.socket = ws;

        const timeoutId = window.setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            ws.close();
            this.notifyStatus('error');
            const err = `Tiempo de espera agotado conectando a ${this.wsUrl}. Verifica que estés conectado al Wi-Fi '${DEFAULT_WIFI_CONFIG.SSID}'.`;
            this.notifyError(err);
            this.addLog('sys', `TIMEOUT: ${err}`);
            resolve(false);
          }
        }, 6000);

        ws.onopen = () => {
          window.clearTimeout(timeoutId);
          this.notifyStatus('connected');
          this.notifyError(null);
          this.addLog('sys', `¡WebSocket conectado a ${this.wsUrl}! Heartbeat activado.`);
          this.startHeartbeat();
          resolve(true);
        };

        ws.onmessage = (event) => {
          if (typeof event.data === 'string') {
            this.processIncomingChunk(event.data);
          } else if (event.data instanceof Blob) {
            event.data.text().then((text) => this.processIncomingChunk(text));
          } else if (event.data instanceof ArrayBuffer) {
            this.processIncomingChunk(this.decoder.decode(event.data));
          }
        };

        ws.onerror = () => {
          window.clearTimeout(timeoutId);
          // Only show error if still connecting/open
          if (this.status === 'connecting') {
            const err = `No se pudo conectar a ${this.wsUrl}. Asegúrate de estar conectado a la red Wi-Fi '${DEFAULT_WIFI_CONFIG.SSID}'.`;
            this.notifyError(err);
            this.addLog('sys', `ERROR WS: ${err}`);
            this.notifyStatus('error');
            resolve(false);
          }
        };

        ws.onclose = () => {
          window.clearTimeout(timeoutId);
          this.addLog('sys', 'Conexión WebSocket cerrada.');
          this.stopHeartbeat();
          this.stopRepeatingMovement();
          if (this.status === 'connected') {
            this.notifyError('Conexión Wi-Fi cerrada por el ESP32.');
            this.notifyStatus('disconnected');
          }
          this.socket = null;
        };
      } catch (err: unknown) {
        const errorStr = err instanceof Error ? err.message : String(err);
        this.notifyError(`Fallo al iniciar WebSocket: ${errorStr}`);
        this.addLog('sys', `ERROR WS: ${errorStr}`);
        this.notifyStatus('error');
        resolve(false);
      }
    });
  }

  public disconnect() {
    this.stopRepeatingMovement();
    this.stopHeartbeat();

    if (this.medium === 'ble') {
      this.cleanupBle();
    } else {
      if (this.socket) {
        try {
          this.socket.close();
        } catch {
          // ignore
        }
        this.socket = null;
      }
    }
    this.notifyStatus('disconnected');
    this.addLog('sys', 'Desconectado manualmente.');
  }

  // --- Heartbeat (PING cada 500ms) ---
  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatIntervalId = window.setInterval(() => {
      if (this.status === 'connected') {
        this.sendRawCommand('PING', true);
      } else {
        this.stopHeartbeat();
      }
    }, 500);
  }

  private stopHeartbeat() {
    if (this.heartbeatIntervalId !== null) {
      window.clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
  }

  // --- Telemetry Processing ---
  private processIncomingChunk(chunk: string) {
    this.telemetryBuffer += chunk;

    // Check for newline-delimited or full JSON objects
    // Could arrive as multiple JSON objects or fragmented chunks
    let boundary = this.telemetryBuffer.indexOf('}');
    while (boundary !== -1) {
      const openBracket = this.telemetryBuffer.indexOf('{');
      if (openBracket !== -1 && openBracket < boundary) {
        const jsonStr = this.telemetryBuffer.substring(openBracket, boundary + 1);
        this.telemetryBuffer = this.telemetryBuffer.substring(boundary + 1);
        this.parseTelemetryObject(jsonStr);
      } else {
        // Discard malformed prefix before the closing brace
        this.telemetryBuffer = this.telemetryBuffer.substring(boundary + 1);
      }
      boundary = this.telemetryBuffer.indexOf('}');
    }

    // Safety: limit buffer size if runaway
    if (this.telemetryBuffer.length > 2048) {
      this.telemetryBuffer = '';
    }
  }

  private parseTelemetryObject(rawJson: string) {
    try {
      const data = JSON.parse(rawJson);
      this.addLog('rx', rawJson);

      // Support documented format:
      // { c: 1, s: "COMBATE_MANUAL", m: "MANUAL", f: 0, r: 0, l: 150, q: 150, e: 0, bv: null }
      // and equivalent alternative keys
      const stateRaw: string = String(data.s ?? data.state ?? data.status ?? 'STANDBY_SEGURIDAD');
      const modeRaw: string = String(data.m ?? data.mode ?? 'MANUAL').toUpperCase();
      const mode: RobotMode = modeRaw.includes('AUTO') ? 'AUTO' : 'MANUAL';

      const frontVal = data.f ?? data.front ?? data.sensor_front ?? 0;
      const rearVal = data.r ?? data.rear ?? data.sensor_rear ?? 0;

      const leftSpeed = Number(data.l ?? data.left ?? data.speed_left ?? 0);
      const rightSpeed = Number(data.q ?? data.right ?? data.speed_right ?? 0);

      const emergencyFlag = Boolean(data.e === 1 || data.e === true || data.emergency || data.estop);

      // Battery voltage: strictly null if ESP32 didn't provide valid numeric value > 0
      const bvRaw = data.bv ?? data.battery ?? data.battery_voltage ?? data.v;
      let batteryVoltage: number | null = null;
      let batteryPercent: number | null = null;
      if (typeof bvRaw === 'number' && !isNaN(bvRaw) && bvRaw > 0) {
        batteryVoltage = bvRaw;
        // Approximate 2S LiPo (6.4V empty to 8.4V full) or 1S/3S typical mini-sumo battery
        // If voltage is around 7.4V (2S LiPo standard for mini sumo)
        if (batteryVoltage >= 6.0 && batteryVoltage <= 8.6) {
          batteryPercent = Math.max(0, Math.min(100, Math.round(((batteryVoltage - 6.6) / (8.4 - 6.6)) * 100)));
        } else if (batteryVoltage >= 3.0 && batteryVoltage <= 4.3) {
          batteryPercent = Math.max(0, Math.min(100, Math.round(((batteryVoltage - 3.3) / (4.2 - 3.3)) * 100)));
        } else if (batteryVoltage > 0 && batteryVoltage <= 100) {
          // Already sent as percentage
          batteryPercent = Math.round(batteryVoltage);
        }
      }

      const edgeDetected =
        stateRaw === 'EVASION_AUTONOMA' ||
        Boolean(data.edge ?? data.borde ?? false) ||
        stateRaw.toUpperCase().includes('BORDE') ||
        stateRaw.toUpperCase().includes('EVASION');

      const telemetry: TelemetryData = {
        connection: data.c === 1 || data.c === true || true,
        state: stateRaw as RobotState,
        mode,
        frontSensor: frontVal,
        rearSensor: rearVal,
        leftMotorSpeed: leftSpeed,
        rightMotorSpeed: rightSpeed,
        emergency: emergencyFlag,
        batteryVoltage,
        batteryPercent,
        edgeDetected,
        rawJson,
        timestamp: Date.now(),
      };

      this.lastTelemetry = telemetry;
      this.telemetryListeners.forEach((l) => l(telemetry));
    } catch {
      // not valid JSON object, might be raw console string from firmware
      this.addLog('rx', rawJson);
    }
  }

  // --- Sending Commands ---
  public async sendRawCommand(cmd: string, isHeartbeat = false): Promise<boolean> {
    if (this.status !== 'connected') {
      if (!isHeartbeat) {
        this.notifyError('No se puede enviar comando: el robot está desconectado.');
        this.addLog('sys', `Bloqueado comando '${cmd}': sin conexión activa`);
      }
      return false;
    }

    try {
      if (this.medium === 'ble') {
        if (!this.txChar) {
          throw new Error('Característica TX no disponible');
        }
        const data = this.encoder.encode(cmd + '\n');
        if (this.txChar.writeValueWithoutResponse) {
          await this.txChar.writeValueWithoutResponse(data);
        } else if (this.txChar.writeValue) {
          await this.txChar.writeValue(data);
        }
      } else {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
          throw new Error('WebSocket no está en estado OPEN');
        }
        this.socket.send(cmd + '\n');
      }

      if (!isHeartbeat) {
        this.addLog('tx', cmd);
      }
      return true;
    } catch (err: unknown) {
      const errorStr = err instanceof Error ? err.message : String(err);
      this.notifyError(`Error enviando '${cmd}': ${errorStr}`);
      this.addLog('sys', `TX ERROR: ${errorStr}`);
      // If communication pipe broken, mark as disconnected
      this.disconnect();
      return false;
    }
  }

  // --- Movement Control ---
  // Repeatedly send movement command every 200ms while held
  public startRepeatingMovement(cmd: 'F:255' | 'B:255' | 'L:255' | 'R:255') {
    // If we're already repeating this exact command, don't restart interval
    if (this.currentRepeatingCommand === cmd && this.repeatIntervalId !== null) {
      return;
    }

    this.stopRepeatingMovement();

    if (this.status !== 'connected') {
      this.notifyError('Robot desconectado. Conéctate antes de mover el robot.');
      return;
    }

    this.currentRepeatingCommand = cmd;
    // Send immediately on first press
    this.sendRawCommand(cmd);

    // Repeat every 200ms while kept pressed
    this.repeatIntervalId = window.setInterval(() => {
      if (this.status === 'connected' && this.currentRepeatingCommand) {
        this.sendRawCommand(this.currentRepeatingCommand);
      } else {
        this.stopRepeatingMovement();
      }
    }, 200);
  }

  public stopRepeatingMovement() {
    if (this.repeatIntervalId !== null) {
      window.clearInterval(this.repeatIntervalId);
      this.repeatIntervalId = null;
    }

    const hadActiveMovement = this.currentRepeatingCommand !== null;
    this.currentRepeatingCommand = null;

    // "Al soltar el botón, enviar inmediatamente S:0"
    if (hadActiveMovement && this.status === 'connected') {
      this.sendRawCommand('S:0');
    }
  }

  // Explicit STOP button: always forces stop and sends S:0
  public stop() {
    this.stopRepeatingMovement();
    this.sendRawCommand('S:0');
  }

  // Safety: ESTOP
  public emergencyStop() {
    this.stopRepeatingMovement();
    this.sendRawCommand('ESTOP');
    this.notifyError('¡PARADA DE EMERGENCIA ACTIVADA (ESTOP)!');
  }

  // Safety: RESET
  public reset() {
    this.stopRepeatingMovement();
    this.sendRawCommand('RESET');
    this.notifyError(null);
  }

  // Modes
  public setMode(mode: RobotMode) {
    this.sendRawCommand(mode === 'AUTO' ? 'MODE:AUTO' : 'MODE:MANUAL');
  }

  // Start competition run (countdown 3s managed by ESP32)
  public startCompetition() {
    this.sendRawCommand('START');
  }
}

// Singleton connection instance
export const robot = new RobotConnectionManager();
