export type MonitorSourceType = 'attributes' | 'telemetry';

/**
 * Single row in realtime monitor table.
 */
export interface MonitorRow {
  /** Unique row id: `${deviceId}-${sourceType}-${key}` */
  id: string;
  deviceId: number;
  deviceName: string;
  key: string;
  value: unknown;
  sourceType: MonitorSourceType;
  lastUpdate: string;
}

/**
 * Device-level snapshot maintained on the client.
 */
export interface MonitorDeviceSnapshot {
  deviceId: number;
  deviceName: string;
  channelId: number;
  telemetry: Record<string, unknown>;
  clientAttributes: Record<string, unknown>;
  sharedAttributes: Record<string, unknown>;
  serverAttributes: Record<string, unknown>;
  lastUpdate: string;
}

export type MonitorConnectionStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'reconnecting';
