<script lang="ts" setup>
import type { FormOpenData } from '@vben/constants';
import type { DriverInfo, IdType, Recordable } from '@vben/types';

import type { DriverSchemas } from './schemas/driver';

import { nextTick, ref, watch } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { FormOpenType } from '@vben/constants';
import { useRequestHandler } from '@vben/hooks';
import { $t } from '@vben/locales';

import { Card, Select, Step, Steps, Tag } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { fetchAllDrivers, getUserById } from '#/api/core';
import { fetchDriverSchemasById } from '#/api/core/driver';

import { useBasicFormSchema } from './schemas';
import { assignByPath, mapChannelSchemasToForm } from './schemas/driver';

defineOptions({ name: 'ChannelForm' });

defineEmits<{
  submit: [type: FormOpenType, id: IdType | undefined, values: Recordable<any>];
}>();

const { handleRequest } = useRequestHandler();

const currentTab = ref(0);
const type = ref(FormOpenType.CREATE);
const recordId = ref<IdType | undefined>(undefined);
const loading = ref(false);
const drivers = ref<DriverInfo[]>([]);
const driverSchemas = ref<DriverSchemas | null>(null);

// 初始化表单
const [Form, formApi] = useVbenForm({
  handleSubmit: (_record: Recordable<any>) => {
    currentTab.value = 1;
    // modalApi.close();
  },
  schema: useBasicFormSchema(),
  commonConfig: {
    labelClass: 'text-[14px] w-1/6',
  },
  submitButtonOptions: {
    content: $t('common.next'),
  },
  resetButtonOptions: {
    show: false,
  },
});

// Step 2 dynamic driver form
const [DriverForm, driverFormApi] = useVbenForm({
  handleSubmit: (_record: Recordable<any>) => {
    // no-op, submit via outer confirm
  },
  schema: [],
  commonConfig: {
    labelClass: 'text-[14px] w-1/6',
  },
  submitButtonOptions: { show: false },
  resetButtonOptions: { show: false },
});

const [Modal, modalApi] = useVbenDrawer({
  class: 'w-1/2',
  destroyOnClose: true,
  footer: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    const step1 = await formApi.validateAndSubmitForm();
    if (!step1) return;
    const step2 = await driverFormApi.getValues<Recordable<any>>();
    const driverConfig: Recordable<any> = {};
    if (driverSchemas.value) {
      // take fields from channel schema to compose nested object
      const flatten = Object.entries(step2 || {});
      for (const [k, v] of flatten) {
        assignByPath(driverConfig, k, v);
      }
    }
    const payload = { ...step1, driver_config: driverConfig };

    console.warn('payload', payload);
    // modalApi.close();
  },
  onOpenChange: async (isOpen: boolean) => {
    if (isOpen) {
      await nextTick();

      const { type: t, id: i } = modalApi.getData<FormOpenData>();

      type.value = t;
      recordId.value = i;

      await handleRequest(
        () => fetchAllDrivers(),
        (data: DriverInfo[]) => {
          drivers.value = data;
        },
      );

      if (t === FormOpenType.EDIT) {
        await formApi.removeSchemaByFields(['password']);
        loading.value = true;
        await handleRequest(
          () => getUserById(recordId.value as IdType),
          (data) => {
            formApi.setValues(data);
            loading.value = false;
          },
          (error) => {
            loading.value = false;
            console.error(error);
          },
        );
      }
    }
  },
});

function filterOption(
  input: string,
  option: undefined | { label?: string },
): boolean {
  return option?.label?.toLowerCase().includes(input.toLowerCase()) ?? false;
}

// watch driverId change to fetch dynamic schemas
watch(
  async () => {
    const vals = await formApi.getValues();
    return vals?.driverId;
  },
  async (driverId) => {
    if (!driverId) {
      driverSchemas.value = null;
      driverFormApi.setState({ schema: [] });
      return;
    }
    await handleRequest(
      () => fetchDriverSchemasById(driverId as unknown as IdType),
      (schemas: DriverSchemas) => {
        driverSchemas.value = schemas;
        const schema = mapChannelSchemasToForm(schemas);
        driverFormApi.setState({ schema });
      },
    );
  },
  { immediate: false },
);
</script>

<template>
  <Modal>
    <Steps :current="currentTab" class="steps">
      <Step :title="$t('page.southward.form.step1')" />
      <Step :title="$t('page.southward.form.step2')" />
    </Steps>
    <div class="p-4">
      <Card v-show="currentTab === 0">
        <Form>
          <template #driverId="slotProps">
            <Select
              v-bind="slotProps"
              :allow-clear="true"
              :show-search="true"
              :filter-option="filterOption"
              :placeholder="
                $t('ui.placeholder.selectWithName', {
                  name: $t('page.southward.channel.driver'),
                })
              "
              :options="
                drivers.map((v) => ({
                  displayLabel: `${v.driverType} ${v.version}`,
                  label: v.driverType,
                  value: v.id,
                  version: v.version,
                }))
              "
              option-label-prop="displayLabel"
            >
              <template #option="item">
                <div class="flex items-center justify-between">
                  <span>{{ item.label }}</span>
                  <Tag color="lime">{{ item.version }}</Tag>
                </div>
              </template>
            </Select>
          </template>
        </Form>
      </Card>

      <div v-show="currentTab === 1" class="space-y-4">
        <Card>
          <DriverForm />
        </Card>
      </div>
    </div>
  </Modal>
</template>

<style scoped></style>
