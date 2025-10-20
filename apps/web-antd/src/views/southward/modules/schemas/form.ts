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
