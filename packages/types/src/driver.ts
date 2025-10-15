import type { Recordable } from '@vben-core/typings';

import type { BaseEntity } from './base';

// Driver source type
export const DriverSource = {
  BuiltIn: 0,
  Custom: 1,
} as const;

export const OsType = {
  Windows: 0,
  Linux: 1,
  MacOS: 2,
  Unknown: 3,
} as const;

export const OsArch = {
  x86: 0,
  arm64: 1,
  arm: 2,
  Unknown: 3,
} as const;

interface DriverInfo extends BaseEntity {
  name: string;
  description: string;
  driverType: string;
  source: (typeof DriverSource)[keyof typeof DriverSource];
  version: string;
  apiVersion: string;
  sdkVersion: string;
  osType: (typeof OsType)[keyof typeof OsType];
  osArch: (typeof OsArch)[keyof typeof OsArch];
  size: number;
  path: string;
  checksum: string;
  metadata: Recordable<any>;
}

export type { DriverInfo };
