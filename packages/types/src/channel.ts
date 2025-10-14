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

interface ChannelInfo extends BaseEntity, StatusInfo {
  name: string;
  driverId: IdType;
  driverType: string;
  collectionType: (typeof CollectionType)[keyof typeof CollectionType];
  period?: number;
  reportType: (typeof ReportType)[keyof typeof ReportType];
  driverConfig?: Recordable<any>;
}

export type { ChannelInfo };
