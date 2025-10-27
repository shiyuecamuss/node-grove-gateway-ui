<script lang="ts" setup>
import type { DeviceInfo, IdType } from '@vben/types';

import { onMounted } from 'vue';

import { useVbenForm } from '@vben/common-ui';
import { FormOpenType } from '@vben/constants';
import { useRequestHandler } from '@vben/hooks';
import { $t } from '@vben/locales';

import { getDeviceById } from '#/api';

defineOptions({ name: 'SouthwardDeviceForm' });

const props = defineProps<{
  channelId?: IdType;
  id?: IdType;
  type: FormOpenType;
}>();
const emit = defineEmits<{
  (
    e: 'submit',
    type: FormOpenType,
    id: IdType | undefined,
    values: DeviceInfo,
  ): void;
}>();

const { handleRequest } = useRequestHandler();

const [Form, formApi] = useVbenForm({
  handleSubmit: async (values) => {
    emit('submit', props.type, props.id, values as DeviceInfo);
  },
  schema: [
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
    {
      component: 'Select',
      fieldName: 'status',
      label: $t('common.status.title'),
      rules: 'required',
      componentProps: {
        options: [
          { label: $t('common.status.enabled'), value: 1 },
          { label: $t('common.status.disabled'), value: 2 },
        ],
      },
    },
  ],
  showDefaultActions: true,
});

async function init() {
  if (props.type === FormOpenType.CREATE) {
    await formApi.setValues({ channelId: props.channelId, status: 1 });
    return;
  }
  if (props.id) {
    await handleRequest(
      () => getDeviceById(props.id as number),
      async (data: DeviceInfo) => {
        await formApi.setValues({
          id: data.id,
          channelId: data.channelId,
          deviceName: data.deviceName,
          deviceType: data.deviceType,
          status: data.status,
          driverConfig: data.driverConfig,
        } as any);
      },
    );
  }
}

onMounted(() => {
  init();
});
</script>

<template>
  <Form />
</template>
