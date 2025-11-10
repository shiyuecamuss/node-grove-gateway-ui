import type { IdType } from './base';

interface AppSubInfo {
  id: IdType;
  app_id: IdType;
  all_devices: boolean;
  device_ids?: Array<IdType>;
  priority: number;
}

export type { AppSubInfo };
