import type { VbenFormSchema as FormSchema } from '@vben/common-ui';

import { $t } from '@vben/locales';
import { CollectionType, ReportType } from '@vben/types';

import {
  accessModeOptions,
  collectionTypeOptions,
  dataPointTypeOptions,
  dataTypeOptions,
  reportTypeOptions,
} from './options';

export function useChannelBasicFormSchema(): FormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: $t('ui.placeholder.inputWithName', {
          name: $t('page.southward.channel.name'),
        }),
      },
      fieldName: 'name',
      label: $t('page.southward.channel.name'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'driverId',
      label: $t('page.southward.channel.driver'),
      rules: 'required',
      controlClass: 'w-full',
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        placeholder: $t('ui.placeholder.selectWithName', {
          name: $t('page.southward.channel.collectionType.title'),
        }),
        options: collectionTypeOptions(),
      },
      fieldName: 'collectionType',
      label: $t('page.southward.channel.collectionType.title'),
      rules: 'required',
      controlClass: 'w-full',
      defaultValue: CollectionType.Collection,
    },
    {
      component: 'InputNumber',
      fieldName: 'period',
      label: $t('page.southward.channel.period'),
      help: $t('ui.help.unitWithName', {
        unit: $t('ui.unit.milliseconds'),
      }),
      controlClass: 'w-full',
      dependencies: {
        triggerFields: ['collectionType'],
        if: (values) => {
          return values.collectionType === CollectionType.Collection;
        },
        rules: (values) => {
          return values.collectionType === CollectionType.Collection
            ? 'required'
            : null;
        },
      },
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        placeholder: $t('ui.placeholder.selectWithName', {
          name: $t('page.southward.channel.reportType.title'),
        }),
        options: reportTypeOptions(),
      },
      fieldName: 'reportType',
      label: $t('page.southward.channel.reportType.title'),
      rules: 'required',
      controlClass: 'w-full',
      defaultValue: ReportType.Change,
    },
  ];
}

export function useSubDeviceBasicFormSchema(): FormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'deviceName',
      label: $t('page.southward.device.name'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'deviceType',
      label: $t('page.southward.device.type'),
      rules: 'required',
    },
  ];
}

export function usePointBasicFormSchema(): FormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('page.southward.point.name'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'key',
      label: $t('page.southward.point.key'),
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: dataPointTypeOptions(),
      },
      fieldName: 'type',
      label: $t('page.southward.point.type'),
      rules: 'required',
      controlClass: 'w-full',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: dataTypeOptions(),
      },
      fieldName: 'dataType',
      label: $t('page.southward.point.dataType'),
      rules: 'required',
      controlClass: 'w-full',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: accessModeOptions(),
      },
      fieldName: 'accessMode',
      label: $t('page.southward.point.accessMode'),
      rules: 'required',
      controlClass: 'w-full',
    },
    {
      component: 'Input',
      fieldName: 'unit',
      label: $t('page.southward.point.unit'),
    },
    {
      component: 'InputNumber',
      fieldName: 'minValue',
      label: $t('page.southward.point.minValue'),
      controlClass: 'w-full',
    },
    {
      component: 'InputNumber',
      fieldName: 'maxValue',
      label: $t('page.southward.point.maxValue'),
      controlClass: 'w-full',
    },
    {
      component: 'InputNumber',
      fieldName: 'scale',
      label: $t('page.southward.point.scale'),
      controlClass: 'w-full',
    },
  ];
}

export function useActionBasicFormSchema(): FormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('page.southward.action.name'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'command',
      label: $t('page.southward.action.command'),
      rules: 'required',
    },
  ];
}

export function useActionParameterBasicFormSchema(): FormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('page.southward.action.parameter.name'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'key',
      label: $t('page.southward.action.parameter.key'),
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: dataTypeOptions(),
      },
      controlClass: 'w-full',
      fieldName: 'dataType',
      label: $t('page.southward.action.parameter.dataType'),
      rules: 'required',
    },
    {
      component: 'Switch',
      fieldName: 'required',
      label: $t('page.southward.action.parameter.required'),
      defaultValue: false,
    },
    {
      component: 'Input',
      fieldName: 'defaultValue',
      label: $t('page.southward.action.parameter.defaultValue'),
      dependencies: {
        triggerFields: ['required'],
        rules: (values) => {
          return values.required ? null : 'required';
        },
      },
    },
    {
      component: 'InputNumber',
      controlClass: 'w-full',
      fieldName: 'minValue',
      label: $t('page.southward.action.parameter.minValue'),
    },
    {
      component: 'InputNumber',
      controlClass: 'w-full',
      fieldName: 'maxValue',
      label: $t('page.southward.action.parameter.maxValue'),
    },
  ];
}

export function useConnectPolicyFormSchema(): FormSchema[] {
  return [
    // Connection timeouts
    {
      component: 'InputNumber',
      fieldName: 'connectionPolicy.connectTimeoutMs',
      label: $t('page.southward.channel.connectPolicy.connectTimeout'),
      help: $t('ui.help.unitWithName', { unit: $t('ui.unit.milliseconds') }),
      controlClass: 'w-full',
      componentProps: { min: 0 },
      rules: 'required',
      defaultValue: 10_000,
    },
    {
      component: 'InputNumber',
      fieldName: 'connectionPolicy.readTimeoutMs',
      label: $t('page.southward.channel.connectPolicy.readTimeout'),
      help: $t('ui.help.unitWithName', { unit: $t('ui.unit.milliseconds') }),
      controlClass: 'w-full',
      componentProps: { min: 0 },
      rules: 'required',
      defaultValue: 10_000,
    },
    {
      component: 'InputNumber',
      fieldName: 'connectionPolicy.writeTimeoutMs',
      label: $t('page.southward.channel.connectPolicy.writeTimeout'),
      help: $t('ui.help.unitWithName', { unit: $t('ui.unit.milliseconds') }),
      controlClass: 'w-full',
      componentProps: { min: 0 },
      rules: 'required',
      defaultValue: 10_000,
    },
    {
      component: 'Divider',
      fieldName: 'backoffDivider',
      hideLabel: true,
      renderComponentContent() {
        return {
          default: () =>
            $t('page.southward.channel.connectPolicy.backoff.title'),
        };
      },
    },
    // Backoff configuration
    {
      component: 'InputNumber',
      fieldName: 'connectionPolicy.backoff.initialIntervalMs',
      label: $t('page.southward.channel.connectPolicy.backoff.initialInterval'),
      help: $t('ui.help.unitWithName', { unit: $t('ui.unit.milliseconds') }),
      controlClass: 'w-full',
      componentProps: { min: 0 },
      rules: 'required',
      defaultValue: 1000,
    },
    {
      component: 'InputNumber',
      fieldName: 'connectionPolicy.backoff.maxIntervalMs',
      label: $t('page.southward.channel.connectPolicy.backoff.maxInterval'),
      help: $t('ui.help.unitWithName', { unit: $t('ui.unit.milliseconds') }),
      controlClass: 'w-full',
      componentProps: { min: 0 },
      rules: 'required',
      defaultValue: 30_000,
    },
    {
      component: 'InputNumber',
      fieldName: 'connectionPolicy.backoff.randomizationFactor',
      label: $t(
        'page.southward.channel.connectPolicy.backoff.randomizationFactor',
      ),
      controlClass: 'w-full',
      componentProps: { min: 0, max: 1, step: 0.01 },
      rules: 'required',
      defaultValue: 0.2,
    },
    {
      component: 'InputNumber',
      fieldName: 'connectionPolicy.backoff.multiplier',
      label: $t('page.southward.channel.connectPolicy.backoff.multiplier'),
      controlClass: 'w-full',
      componentProps: { min: 1, step: 0.1 },
      rules: 'required',
      defaultValue: 2,
    },
    {
      component: 'InputNumber',
      fieldName: 'connectionPolicy.backoff.maxElapsedTimeMs',
      label: $t('page.southward.channel.connectPolicy.backoff.maxElapsedTime'),
      help: $t('ui.help.unitWithName', { unit: $t('ui.unit.milliseconds') }),
      controlClass: 'w-full',
      componentProps: { min: 0 },
    },
  ];
}
