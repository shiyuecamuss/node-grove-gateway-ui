import { CollectionType, ReportType } from '@vben/types';

import { $t } from '#/locales';

export { useBasicFormSchema, useConnectPolicyFormSchema } from './form';
export { searchFormSchema } from './search-form';
export { useColumns } from './table-columns';

export const isNullOrUndefined = (v: unknown): v is null | undefined =>
  v === null || v === undefined;

export function collectionTypeOptions() {
  return [
    {
      color: 'cyan',
      label: $t('page.southward.channel.collectionType.collection'),
      value: CollectionType.Collection,
    },
    {
      color: 'purple',
      label: $t('page.southward.channel.collectionType.report'),
      value: CollectionType.Report,
    },
  ];
}

export function reportTypeOptions() {
  return [
    {
      color: 'volcano',
      label: $t('page.southward.channel.reportType.change'),
      value: ReportType.Change,
    },
    {
      color: 'magenta',
      label: $t('page.southward.channel.reportType.always'),
      value: ReportType.Always,
    },
  ];
}
