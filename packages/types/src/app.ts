import type { Recordable } from '@vben-core/typings';
import type { BaseEntity, IdType, RetryPolicy, StatusInfo } from './base';

export const DropPolicy = {
  Discard: 0,
  Block: 1,
} as const;

interface QueuePolicy {
  capacity: number;
  dropPolicy: (typeof DropPolicy)[keyof typeof DropPolicy];
  block_Duration: number;
  bufferEnabled: boolean;
  bufferCapacity: number;
  bufferExpireMs: number;
}

interface AppInfo extends BaseEntity, StatusInfo {
  /// Plugin id
  plugin_id: IdType;
  /// App name
  name: string;
  /// App description
  description?: string;
  /// App config
  config: Recordable<any>;
  /// App retry policy
  retry_policy: RetryPolicy;
  /// App queue policy
  queue_policy: QueuePolicy;
}

export type { AppInfo };
