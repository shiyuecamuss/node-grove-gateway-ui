import type { Recordable } from '@vben-core/typings';

import type { BaseEntity } from './base';

import { DriverSource, OsArch, OsType } from '@vben-core/typings';

interface DriverInfo extends BaseEntity {
  name: string;
  description: string;
  driverType: string;
  source: (typeof DriverSource)[keyof typeof DriverSource];
  version: string;
  apiVersion: number;
  sdkVersion: string;
  osType: (typeof OsType)[keyof typeof OsType];
  osArch: (typeof OsArch)[keyof typeof OsArch];
  size: number;
  path: string;
  checksum: string;
  metadata: Recordable<any>;
}

interface DriverProbeInfo {
  name: string;
  description: string;
  driverType: string;
  source: (typeof DriverSource)[keyof typeof DriverSource];
  version: string;
  apiVersion: number;
  sdkVersion: string;
  osType: (typeof OsType)[keyof typeof OsType];
  osArch: (typeof OsArch)[keyof typeof OsArch];
  size: number;
  path: string;
  checksum: string;
  metadata: Recordable<any>;
}

export type { DriverInfo, DriverProbeInfo };
