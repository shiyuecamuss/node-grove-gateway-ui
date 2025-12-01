import type { MonitorConnectionStatus, MonitorDeviceSnapshot } from './types';

import { ref } from 'vue';

import { useWebSocket } from '@vueuse/core';

import { baseRequestClient } from '#/api/request';

interface SubscribePayload {
  type: 'subscribe';
  channelId?: number;
  deviceId?: number;
  deviceIds?: number[];
  requestId?: string;
}

interface UnsubscribePayload {
  type: 'unsubscribe';
  requestId?: string;
}

interface PingPayload {
  type: 'ping';
  ts: number;
}

type ClientMessage = PingPayload | SubscribePayload | UnsubscribePayload;

type ServerMessage =
  | {
      attributes: {
        client: Record<string, unknown>;
        server: Record<string, unknown>;
        shared: Record<string, unknown>;
      };
      device: {
        channelId: number;
        deviceName: string;
        id: number;
      };
      lastUpdate: string;
      telemetry: Record<string, unknown>;
      type: 'snapshot';
    }
  | {
      code: string;
      details?: any;
      message: string;
      type: 'error';
    }
  | {
      dataType: 'attributes' | 'telemetry';
      deviceId: number;
      scope?: string;
      timestamp: string;
      type: 'update';
      values: any;
    }
  | {
      deviceIds: number[];
      requestId?: string;
      type: 'subscribed';
    }
  | {
      ts: number;
      type: 'pong';
    };

function buildWsUrl(): string {
  const baseURL = (baseRequestClient as any).defaults?.baseURL as
    | string
    | undefined;
  const url = baseURL ?? window.location.origin;
  const wsScheme = url.startsWith('https') ? 'wss' : 'ws';
  const httpScheme = url.startsWith('https') ? 'https' : 'http';

  const normalized = url.replace(`${httpScheme}:`, `${wsScheme}:`);
  return `${normalized}/api/ws/monitor`;
}

export function useMonitorWs() {
  const status = ref<MonitorConnectionStatus>('disconnected');
  const snapshots = ref<Map<number, MonitorDeviceSnapshot>>(new Map());
  const subscribedDeviceIds = ref<number[]>([]);

  const {
    status: wsStatus,
    open: openWs,
    close: closeWs,
    send,
  } = useWebSocket(buildWsUrl(), {
    immediate: false,
    autoReconnect: {
      delay: 1000,
    },
    onConnected() {
      status.value = 'connected';
      if (subscribedDeviceIds.value.length > 0) {
        subscribe(subscribedDeviceIds.value);
      }
    },
    onDisconnected() {
      status.value =
        subscribedDeviceIds.value.length > 0 ? 'reconnecting' : 'disconnected';
    },
    onMessage(_, event) {
      try {
        const msg = JSON.parse(event.data) as ServerMessage;
        handleServerMessage(msg);
      } catch {
        // ignore invalid messages
      }
    },
  });

  function connect() {
    if (wsStatus.value === 'OPEN' || wsStatus.value === 'CONNECTING') return;
    status.value =
      status.value === 'disconnected' ? 'connecting' : 'reconnecting';
    openWs();
  }

  function disconnect() {
    subscribedDeviceIds.value = [];
    snapshots.value = new Map();
    status.value = 'disconnected';
    closeWs();
  }

  function sendMessage(payload: ClientMessage) {
    if (wsStatus.value !== 'OPEN') {
      console.warn(
        '[monitor-ws] Skip send, socket is not open:',
        wsStatus.value,
        payload.type,
      );
      return;
    }
    send(JSON.stringify(payload));
  }

  function subscribe(deviceIds: number | number[], channelId?: number) {
    const ids = Array.isArray(deviceIds) ? deviceIds : [deviceIds];
    subscribedDeviceIds.value = [...ids];
    // Clear stale snapshots when updating the subscription set so that
    // the grid only reflects the currently subscribed devices.
    snapshots.value = new Map();
    const payload: SubscribePayload = {
      type: 'subscribe',
      channelId,
      deviceIds: ids,
      requestId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };
    sendMessage(payload);
  }

  function unsubscribe() {
    subscribedDeviceIds.value = [];
    // When fully unsubscribing, clear all cached snapshots.
    snapshots.value = new Map();
    sendMessage({ type: 'unsubscribe', requestId: `${Date.now()}` });
  }

  function ping() {
    sendMessage({ type: 'ping', ts: Date.now() });
  }

  function handleServerMessage(msg: ServerMessage) {
    switch (msg.type) {
      case 'error': {
        // 这里只做简单日志，具体 UI 提示交给调用方
        console.error('[monitor-ws] error', msg.code, msg.message, msg.details);
        break;
      }
      case 'pong': {
        // no-op
        break;
      }
      case 'snapshot': {
        const snapshot: MonitorDeviceSnapshot = {
          deviceId: msg.device.id,
          deviceName: msg.device.deviceName,
          channelId: msg.device.channelId,
          telemetry: msg.telemetry ?? {},
          clientAttributes: msg.attributes?.client ?? {},
          sharedAttributes: msg.attributes?.shared ?? {},
          serverAttributes: msg.attributes?.server ?? {},
          lastUpdate: msg.lastUpdate,
        };
        snapshots.value.set(snapshot.deviceId, snapshot);
        snapshots.value = new Map(snapshots.value);
        break;
      }
      case 'subscribed': {
        subscribedDeviceIds.value = msg.deviceIds;
        break;
      }
      case 'update': {
        const existing = snapshots.value.get(msg.deviceId);
        if (!existing) break;

        if (msg.dataType === 'telemetry') {
          existing.telemetry = {
            ...existing.telemetry,
            ...msg.values,
          };
        } else if (msg.dataType === 'attributes') {
          const values = msg.values ?? {};
          existing.clientAttributes = {
            ...existing.clientAttributes,
            ...values.client,
          };
          existing.sharedAttributes = {
            ...existing.sharedAttributes,
            ...values.shared,
          };
          existing.serverAttributes = {
            ...existing.serverAttributes,
            ...values.server,
          };
        }

        existing.lastUpdate = msg.timestamp;
        snapshots.value.set(existing.deviceId, { ...existing });
        snapshots.value = new Map(snapshots.value);
        break;
      }
    }
  }

  return {
    status,
    snapshots,
    subscribedDeviceIds,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    ping,
  };
}
