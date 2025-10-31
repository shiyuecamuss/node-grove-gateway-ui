import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import type {
  ActionInfo,
  ChannelInfo,
  DeviceInfo,
  PointInfo,
} from '@vben/types';

import type { OnActionClickFn } from '#/adapter/vxe-table';

import { $t } from '@vben/locales';

import {
  accessModeOptions,
  collectionTypeOptions,
  dataPointTypeOptions,
  dataTypeOptions,
  reportTypeOptions,
} from './options';

type ActionParameter = ActionInfo['inputs'][number];

/**
 * Table columns configuration for tenant package list
 */
export function useChannelColumns(
  onActionClick: OnActionClickFn<ChannelInfo>,
): VxeTableGridOptions<ChannelInfo>['columns'] {
  return [
    {
      field: 'name',
      title: $t('page.southward.channel.name'),
    },
    {
      field: 'driverType',
      title: $t('page.southward.channel.driverType'),
    },
    {
      field: 'collectionType',
      title: $t('page.southward.channel.collectionType.title'),
      cellRender: {
        name: 'CellTag',
        options: collectionTypeOptions(),
      },
    },
    {
      field: 'period',
      title: $t('page.southward.channel.period'),
      formatter: ({ row }) => {
        return row.period ? `${(row.period / 1000).toFixed(1)}s` : '-';
      },
    },
    {
      field: 'reportType',
      title: $t('page.southward.channel.reportType.title'),
      cellRender: {
        name: 'CellTag',
        options: reportTypeOptions(),
      },
    },
    {
      field: 'status',
      title: $t('common.status.title'),
      slots: { default: 'status' },
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
            code: 'configView',
            icon: 'mdi:eye-outline',
            tooltip: $t('page.southward.channel.configView'),
          },
          {
            code: 'subDevice',
            icon: 'mdi:devices',
            tooltip: $t('page.southward.channel.subDevice'),
          },
          {
            code: 'edit',
            icon: 'lucide:edit',
            tooltip: $t('common.edit'),
          },
          {
            code: 'delete',
            icon: 'lucide:trash-2',
            tooltip: $t('common.delete'),
            danger: true,
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

export function useDeviceColumns(
  onActionClick: OnActionClickFn<DeviceInfo>,
): VxeTableGridOptions<DeviceInfo>['columns'] {
  return [
    { field: 'deviceName', title: $t('page.southward.device.name') },
    { field: 'deviceType', title: $t('page.southward.device.type') },
    {
      field: 'status',
      title: $t('common.status.title'),
      slots: { default: 'status' },
    },
    {
      align: 'right',
      cellRender: {
        attrs: { nameField: 'deviceName', onClick: onActionClick },
        name: 'CellOperation',
        options: [
          {
            code: 'pointManagement',
            icon: 'lucide:database',
            tooltip: $t('page.southward.device.pointManagement'),
          },
          {
            code: 'actionManagement',
            icon: 'lucide:activity',
            tooltip: $t('page.southward.device.actionManagement'),
          },
          { code: 'edit', icon: 'lucide:edit', tooltip: $t('common.edit') },
          {
            code: 'delete',
            icon: 'lucide:trash-2',
            tooltip: $t('common.delete'),
            danger: true,
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('common.actions'),
      width: 180,
    },
  ];
}

export function usePointColumns(
  onActionClick: OnActionClickFn<PointInfo>,
): VxeTableGridOptions<PointInfo>['columns'] {
  return [
    { field: 'name', title: $t('page.southward.point.name') },
    { field: 'key', title: $t('page.southward.point.key') },
    {
      field: 'type',
      title: $t('page.southward.point.type'),
      cellRender: {
        name: 'CellTag',
        options: dataPointTypeOptions(),
      },
    },
    {
      field: 'dataType',
      title: $t('page.southward.point.dataType'),
      cellRender: {
        name: 'CellTag',
        options: dataTypeOptions(),
      },
    },
    {
      field: 'accessMode',
      title: $t('page.southward.point.accessMode'),
      cellRender: {
        name: 'CellTag',
        options: accessModeOptions(),
      },
    },
    { field: 'unit', title: $t('page.southward.point.unit') },
    {
      align: 'right',
      cellRender: {
        attrs: { nameField: 'name', onClick: onActionClick },
        name: 'CellOperation',
        options: [
          { code: 'edit', icon: 'lucide:edit', tooltip: $t('common.edit') },
          {
            code: 'delete',
            icon: 'lucide:trash-2',
            tooltip: $t('common.delete'),
            danger: true,
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('common.actions'),
      width: 160,
    },
  ];
}

export function useActionColumns(
  onActionClick: OnActionClickFn<ActionInfo>,
): VxeTableGridOptions<ActionInfo>['columns'] {
  return [
    { field: 'name', title: $t('page.southward.action.name') },
    { field: 'command', title: $t('page.southward.action.command') },
    {
      field: 'inputs',
      title: $t('page.southward.action.parameter.count'),
      formatter: ({ row }) => row.inputs?.length ?? 0,
    },
    {
      align: 'right',
      cellRender: {
        attrs: { nameField: 'name', onClick: onActionClick },
        name: 'CellOperation',
        options: [
          { code: 'edit', icon: 'lucide:edit', tooltip: $t('common.edit') },
          {
            code: 'delete',
            icon: 'lucide:trash-2',
            tooltip: $t('common.delete'),
            danger: true,
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('common.actions'),
      width: 160,
    },
  ];
}

export function useActionParameterColumns(
  onActionClick: OnActionClickFn<ActionParameter>,
): VxeTableGridOptions<ActionParameter>['columns'] {
  return [
    {
      field: 'name',
      title: $t('page.southward.action.parameter.name'),
    },
    {
      field: 'key',
      title: $t('page.southward.action.parameter.key'),
    },
    {
      field: 'dataType',
      title: $t('page.southward.action.parameter.dataType'),
      cellRender: {
        name: 'CellTag',
        options: dataTypeOptions(),
      },
    },
    {
      field: 'required',
      title: $t('page.southward.action.parameter.required'),
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: $t('common.yes'), value: true },
          { color: 'error', label: $t('common.no'), value: false },
        ],
      },
    },
    {
      field: 'defaultValue',
      title: $t('page.southward.action.parameter.defaultValue'),
      formatter: ({ cellValue }) => {
        if (cellValue === null || cellValue === undefined || cellValue === '') {
          return '-';
        }
        return cellValue;
      },
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
          { code: 'edit', icon: 'lucide:edit', tooltip: $t('common.edit') },
          {
            code: 'delete',
            icon: 'lucide:trash-2',
            tooltip: $t('common.delete'),
            danger: true,
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('common.actions'),
      width: 160,
    },
  ];
}
