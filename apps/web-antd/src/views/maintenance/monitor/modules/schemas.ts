import type { MonitorRow } from './types';

import type { VxeGridProps } from '#/adapter/vxe-table';

import { $t } from '@vben/locales';

/**
 * Build VXE grid columns for monitor realtime table.
 */
export function useMonitorColumns(): VxeGridProps<MonitorRow>['columns'] {
  return [
    {
      field: 'deviceName',
      title: $t('page.monitor.realtime.table.deviceName'),
      minWidth: 160,
    },
    {
      field: 'deviceId',
      title: $t('page.monitor.realtime.table.deviceId'),
      width: 120,
    },
    {
      field: 'key',
      title: $t('page.monitor.realtime.table.key'),
      minWidth: 160,
    },
    {
      field: 'value',
      title: $t('page.monitor.realtime.table.value'),
      minWidth: 200,
      showOverflow: true,
    },
    {
      field: 'sourceType',
      title: $t('page.monitor.realtime.table.sourceType'),
      width: 140,
      formatter: ({ cellValue }) =>
        $t(`page.monitor.realtime.table.sourceTypeMap.${cellValue}`),
    },
    {
      field: 'lastUpdate',
      title: $t('page.monitor.realtime.table.lastUpdate'),
      width: 220,
    },
  ];
}
