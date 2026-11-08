export type ConnectionMedium = 'ble' | 'wifi';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export type RobotState =
  | 'STANDBY_SEGURIDAD'
  | 'DESPLIEGUE_3S'
  | 'COMBATE_MANUAL'
  | 'EVASION_AUTONOMA'
  | 'EMERGENCIA'
  | string;

export type RobotMode = 'MANUAL' | 'AUTO';

export interface TelemetryData {
  connection: boolean;
  state: RobotState;
  mode: RobotMode;
  frontSensor: number | boolean;
  rearSensor: number | boolean;
  leftMotorSpeed: number;
  rightMotorSpeed: number;
  emergency: boolean;
  batteryVoltage: number | null; // only valid if ESP32 provides it
  batteryPercent: number | null;
  edgeDetected: boolean;
  rawJson?: string;
  timestamp: number;
}

export interface CommandLogEntry {
  id: string;
  direction: 'tx' | 'rx' | 'sys';
  text: string;
  timestamp: Date;
}
