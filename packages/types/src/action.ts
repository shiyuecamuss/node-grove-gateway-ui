import type { Recordable } from '@vben-core/typings';

import type { BaseEntity, IdType } from './base';

import { DataType } from './common';

export const DataPointType = {
  Attribute: 0,
  Telemetry: 1,
  Event: 2,
} as const;

export const AccessMode = {
  Read: 0,
  Write: 1,
  ReadWrite: 2,
} as const;

interface ActionInfo extends BaseEntity {
  deviceId: IdType;
  name: string;
  command: string;
  inputs: Parameter[];
}

interface Parameter {
  name: string;
  key: string;
  dataType: (typeof DataType)[keyof typeof DataType];
  required: boolean;
  defaultValue: any;
  minValue?: number;
  maxValue?: number;
  driverConfig: Recordable<any>;
}

export type { ActionInfo };
