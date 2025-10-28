<script lang="ts" setup>
import type { DeviceInfo, IdType, Recordable } from '@vben/types';

import type { DriverSchemas } from './schemas/driver';

import { nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { FormOpenType } from '@vben/constants';
import { useRequestHandler } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import { set } from '@vben-core/shared/utils';

import { Card } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getDeviceById } from '#/api';
import { fetchDriverSchemasById } from '#/api/core/driver';

import { mapDeviceSchemasToForm, sortDriverSchemas } from './schemas/driver';
import { useSubDeviceBasicFormSchema } from './schemas/form';

defineOptions({ name: 'SubDeviceForm' });

const emit = defineEmits<{
  submit: [type: FormOpenType, id: IdType | undefined, values: DeviceInfo];
}>();

const { handleRequest } = useRequestHandler();

const type = ref(FormOpenType.CREATE);
const recordId = ref<IdType | undefined>(undefined);
const channelId = ref<IdType | undefined>(undefined);

// 基础字段表单
const [BasicForm, basicFormApi] = useVbenForm({
  handleSubmit: async (_values) => {
    // 不直接提交，由 DriverForm 统一触发提交
  },
  schema: useSubDeviceBasicFormSchema(),
  showDefaultActions: false,
  commonConfig: {
    labelClass: 'text-[14px] w-1/6',
  },
});

// 动态 driverConfig 表单
const [DriverForm, driverFormApi] = useVbenForm({
  handleSubmit: async (driverConfig: Recordable<any>) => {
    await basicFormApi.validate();
    const base = await basicFormApi.getValues();
    emit('submit', type.value, recordId.value, {
      channelId: channelId.value as IdType,
      ...base,
      driverConfig,
    } as DeviceInfo);
  },
  schema: [],
  showDefaultActions: true,
  commonConfig: {
    labelClass: 'text-[14px] w-1/6',
  },
  wrapperClass: 'grid-cols-2 md:grid-cols-2 lg:grid-cols-2',
});

// 抽屉
const [Modal, modalApi] = useVbenDrawer({
  class: 'w-1/2',
  destroyOnClose: true,
  footer: false,
  onCancel() {
    modalApi.close();
  },
  onOpenChange: async (isOpen: boolean) => {
    if (!isOpen) return;
    await nextTick();
    await init();
  },
});

async function loadDriverSchemaByDriverId(did: IdType | undefined) {
  if (did === undefined || did === null) {
    driverFormApi.updateSchema([]);
    return;
  }
  await handleRequest(
    () => fetchDriverSchemasById(did),
    async (schemas: DriverSchemas) => {
      const sorted = sortDriverSchemas(schemas);
      const formSchemas = mapDeviceSchemasToForm(sorted);
      driverFormApi.setState({ schema: formSchemas });
      await nextTick();
      const defaults: Record<string, any> = {};
      for (const item of formSchemas) {
        if (
          item &&
          'fieldName' in item &&
          Reflect.has(item, 'defaultValue') &&
          (item as any).defaultValue !== undefined
        ) {
          set(defaults, (item as any).fieldName, (item as any).defaultValue);
        }
      }
      await driverFormApi.resetForm({ values: defaults });
    },
  );
}

async function init() {
  const {
    type: t,
    id: i,
    driverId: did,
    channelId: cid,
  } = modalApi.getData<{
    channelId: IdType;
    driverId: IdType;
    id?: IdType;
    type: FormOpenType;
  }>();
  type.value = t;
  recordId.value = i;
  channelId.value = cid;

  await loadDriverSchemaByDriverId(did);

  if (type.value === FormOpenType.EDIT) {
    await handleRequest(
      () => getDeviceById(recordId.value as number),
      async (data: DeviceInfo) => {
        await basicFormApi.resetForm({
          values: {
            id: data.id,
            channelId: data.channelId,
            deviceName: data.deviceName,
            deviceType: data.deviceType,
            status: data.status,
          },
        });
        await driverFormApi.setValues(data.driverConfig as any);
      },
    );
  }
}
</script>

<template>
  <Modal>
    <div class="space-y-4 p-4">
      <Card size="small">
        <template #title>
          <div class="flex items-center gap-2">
            <IconifyIcon class="size-4" icon="mdi:information-outline" />
            {{ $t('page.southward.device.basic') }}
          </div>
        </template>
        <BasicForm />
      </Card>
      <Card size="small">
        <template #title>
          <div class="flex items-center gap-2">
            <IconifyIcon class="size-4" icon="mdi:cog-outline" />
            {{ $t('page.southward.device.driver') }}
          </div>
        </template>
        <DriverForm />
      </Card>
    </div>
  </Modal>
</template>
