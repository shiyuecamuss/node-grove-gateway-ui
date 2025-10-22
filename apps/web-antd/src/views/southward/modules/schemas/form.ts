import type { VbenFormSchema as FormSchema } from '@vben/common-ui';

import { $t } from '@vben/locales';
import { CollectionType, ReportType } from '@vben/types';

import { collectionTypeOptions, reportTypeOptions } from '.';

export function useBasicFormSchema(): FormSchema[] {
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

export function useConnectPolicyFormSchema(): FormSchema[] {
  return [
    // Connection timeouts
    {
      component: 'InputNumber',
      fieldName: 'connectPolicy.connectTimeoutMs',
      label: $t('page.southward.channel.connectPolicy.connectTimeout'),
      help: $t('ui.help.unitWithName', { unit: $t('ui.unit.milliseconds') }),
      controlClass: 'w-full',
      componentProps: { min: 0 },
      rules: 'required',
      defaultValue: 10_000,
    },
    {
      component: 'InputNumber',
      fieldName: 'connectPolicy.readTimeoutMs',
      label: $t('page.southward.channel.connectPolicy.readTimeout'),
      help: $t('ui.help.unitWithName', { unit: $t('ui.unit.milliseconds') }),
      controlClass: 'w-full',
      componentProps: { min: 0 },
      rules: 'required',
      defaultValue: 10_000,
    },
    {
      component: 'InputNumber',
      fieldName: 'connectPolicy.writeTimeoutMs',
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
      fieldName: 'connectPolicy.backoff.initialIntervalMs',
      label: $t('page.southward.channel.connectPolicy.backoff.initialInterval'),
      help: $t('ui.help.unitWithName', { unit: $t('ui.unit.milliseconds') }),
      controlClass: 'w-full',
      componentProps: { min: 0 },
      rules: 'required',
      defaultValue: 1000,
    },
    {
      component: 'InputNumber',
      fieldName: 'connectPolicy.backoff.maxIntervalMs',
      label: $t('page.southward.channel.connectPolicy.backoff.maxInterval'),
      help: $t('ui.help.unitWithName', { unit: $t('ui.unit.milliseconds') }),
      controlClass: 'w-full',
      componentProps: { min: 0 },
      rules: 'required',
      defaultValue: 30_000,
    },
    {
      component: 'InputNumber',
      fieldName: 'connectPolicy.backoff.randomizationFactor',
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
      fieldName: 'connectPolicy.backoff.multiplier',
      label: $t('page.southward.channel.connectPolicy.backoff.multiplier'),
      controlClass: 'w-full',
      componentProps: { min: 1, step: 0.1 },
      rules: 'required',
      defaultValue: 2,
    },
    {
      component: 'InputNumber',
      fieldName: 'connectPolicy.backoff.maxElapsedTimeMs',
      label: $t('page.southward.channel.connectPolicy.backoff.maxElapsedTime'),
      help: $t('ui.help.unitWithName', { unit: $t('ui.unit.milliseconds') }),
      controlClass: 'w-full',
      componentProps: { min: 0 },
    },
  ];
}
