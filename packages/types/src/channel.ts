import type { Recordable } from '@vben-core/typings';

import type { BaseEntity, IdType, StatusInfo } from './base';

// Channel collection type
export const CollectionType = {
  Report: 0,
  Collection: 1,
} as const;

// Channel report type
export const ReportType = {
  Change: 0,
  Always: 1,
} as const;

export interface ChannelConnectPolicy {
  connectTimeoutMs: number;
  readTimeoutMs: number;
  writeTimeoutMs: number;
  backoff: ChannelBackoff;
}

export interface ChannelBackoff {
  initialIntervalMs: number;
  maxIntervalMs: number;
  randomizationFactor: number;
  multiplier: number;
  maxElapsedTimeMs?: number;
}

interface ChannelInfo extends BaseEntity, StatusInfo {
  name: string;
  driverId: IdType;
  driverType: string;
  collectionType: (typeof CollectionType)[keyof typeof CollectionType];
  period?: number;
  reportType: (typeof ReportType)[keyof typeof ReportType];
  connectPolicy: ChannelConnectPolicy;
  driverConfig?: Recordable<any>;
}

export type { ChannelInfo };
