import { CollectionType, ReportType } from '@vben/types';

import { $t } from '#/locales';

export { useBasicFormSchema } from './form';
export { searchFormSchema } from './search-form';
export { useColumns } from './table-columns';

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
