import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import type { DriverInfo } from '@vben/types';

import type { OnActionClickFn } from '#/adapter/vxe-table';

import { $t } from '@vben/locales';

/**
 * Table columns configuration for tenant package list
 */
export function useColumns(
  onActionClick: OnActionClickFn<DriverInfo>,
): VxeTableGridOptions<DriverInfo>['columns'] {
  return [
    {
      field: 'name',
      title: $t('page.driver.name'),
    },
    {
      field: 'driverType',
      title: $t('page.driver.driverType'),
    },
    {
      field: 'source',
      title: $t('page.driver.source.title'),
      cellRender: {
        name: 'CellTag',
        options: sourceOptions(),
      },
    },
    {
      field: 'version',
      title: $t('page.driver.version'),
    },
    {
      field: 'apiVersion',
      title: $t('page.driver.apiVersion'),
    },
    {
      field: 'sdkVersion',
      title: $t('page.driver.sdkVersion'),
    },
    {
      field: 'osType',
      title: $t('page.driver.osType.title'),
      cellRender: {
        name: 'CellTag',
        options: osTypeOptions(),
      },
    },
    {
      field: 'osArch',
      title: $t('page.driver.osArch.title'),
      cellRender: {
        name: 'CellTag',
        options: osArchOptions(),
      },
    },
    {
      field: 'size',
      title: $t('page.driver.size'),
      formatter: ({ row }) => {
        const size = Number(row.size ?? 0);
        if (!size) return '-';
        const KB = 1024;
        const MB = KB * 1024;
        const GB = MB * 1024;
        if (size < MB) return `${(size / KB).toFixed(2)}KB`;
        if (size < GB) return `${(size / MB).toFixed(2)}MB`;
        return `${(size / GB).toFixed(2)}GB`;
      },
    },
    {
      field: 'createdAt',
      formatter: 'formatDateTime',
      title: $t('common.baseInfo.createdAt'),
    },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'uninstall',
            icon: 'entypo:uninstall',
            tooltip: $t('common.uninstall'),
            danger: true,
            disabled: (row: DriverInfo) => row.source !== 1,
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('common.actions'),
      width: 200,
    },
  ];
}

function sourceOptions() {
  return [
    { color: 'volcano', label: $t('page.driver.source.builtIn'), value: 0 },
    { color: 'cyan', label: $t('page.driver.source.custom'), value: 1 },
  ];
}

function osTypeOptions() {
  return [
    { color: 'blue', label: $t('page.driver.osType.windows'), value: 0 },
    { color: 'volcano', label: $t('page.driver.osType.linux'), value: 1 },
    { color: 'orange', label: $t('page.driver.osType.macos'), value: 2 },
    { color: 'error', label: $t('page.driver.osType.unknown'), value: 3 },
  ];
}

function osArchOptions() {
  return [
    { color: 'purple', label: $t('page.driver.osArch.x86'), value: 0 },
    { color: 'lime', label: $t('page.driver.osArch.arm64'), value: 1 },
    { color: 'gold', label: $t('page.driver.osArch.arm'), value: 2 },
    { color: 'error', label: $t('page.driver.osArch.unknown'), value: 3 },
  ];
}
