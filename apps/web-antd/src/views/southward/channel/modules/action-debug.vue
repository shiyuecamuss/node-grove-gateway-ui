<script lang="ts" setup>
import type { ActionInfo, IdType } from '@vben/types';
import type { VbenFormSchema as FormSchema } from '@vben/common-ui';

import { nextTick, ref } from 'vue';

import { JsonViewer, useVbenModal, z } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { DataType } from '@vben/types';
import { Card, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { debugAction, getActionById } from '#/api/core';

defineOptions({ name: 'ActionDebug' });

const loading = ref(false);
const actionInfo = ref<ActionInfo | null>(null);
const result = ref<any>(null);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    labelClass: 'text-[14px] w-1/4',
  },
  handleSubmit: async (values: Record<string, any>) => {
    if (!actionInfo.value) return;
    loading.value = true;
    try {
      const { timeoutMs, ...params } = values;
      const resp = await debugAction(actionInfo.value.id, {
        params,
        timeoutMs: timeoutMs ?? 5000,
      });
      result.value = resp;
      message.success($t('common.success'));
    } finally {
      loading.value = false;
    }
  },
  schema: [],
  submitButtonOptions: {
    content: $t('page.southward.action.test'),
  },
  resetButtonOptions: {
    show: false,
  },
  showDefaultActions: true,
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-4/5',
  destroyOnClose: true,
  footer: false,
  onCancel() {
    modalApi.close();
  },
  onOpenChange: async (isOpen: boolean) => {
    if (!isOpen) return;
    await nextTick();
    const { actionId } = modalApi.getData<{ actionId: IdType }>();
    await load(actionId);
  },
  title: $t('page.southward.action.test'),
});

async function load(id: IdType) {
  loading.value = true;
  result.value = null;
  try {
    const info = await getActionById(id);
    actionInfo.value = info;
    const schema = buildSchema(info);
    await formApi.setState({ schema });
    const initValues: Record<string, any> = { timeoutMs: 5000 };
    (info.inputs || []).forEach((p) => {
      if (p.dataType === DataType.Boolean) {
        initValues[p.key] = p.defaultValue ?? false;
      } else {
        initValues[p.key] = p.defaultValue ?? undefined;
      }
    });
    await formApi.setValues(initValues);
  } finally {
    loading.value = false;
  }
}

function buildSchema(info: ActionInfo): FormSchema[] {
  const items: FormSchema[] = [];
  items.push({
    component: 'InputNumber',
    fieldName: 'timeoutMs',
    label: $t('page.southward.action.timeoutMs'),
    componentProps: {
      min: 1,
      step: 100,
      class: 'w-full',
    },
    rules: z.number().min(1),
  });

  for (const p of info.inputs || []) {
    if (p.dataType === DataType.Boolean) {
      items.push({
        component: 'Switch',
        fieldName: p.key,
        label: p.name,
        rules: p.required ? z.boolean() : undefined,
      });
      continue;
    }

    const isFloat = ([DataType.Float32, DataType.Float64] as number[]).includes(
      p.dataType as number,
    );
    const isInteger = (
      [
        DataType.Int8,
        DataType.UInt8,
        DataType.Int16,
        DataType.UInt16,
        DataType.Int32,
        DataType.UInt32,
        DataType.Int64,
        DataType.UInt64,
        DataType.Timestamp,
      ] as number[]
    ).includes(p.dataType as number);

    if (isFloat || isInteger) {
      items.push({
        component: 'InputNumber',
        fieldName: p.key,
        label: p.name,
        componentProps: {
          min: p.minValue ?? undefined,
          max: p.maxValue ?? undefined,
          step: isFloat ? 0.01 : 1,
          class: 'w-full',
        },
        rules: p.required ? 'required' : undefined,
      });
      continue;
    }

    items.push({
      component: 'Input',
      fieldName: p.key,
      label: p.name,
      componentProps: {
        class: 'w-full',
      },
      rules: p.required ? 'required' : undefined,
    });
  }

  return items;
}
</script>

<template>
  <Modal>
    <div class="grid grid-cols-2 gap-4">
      <Card :title="$t('page.southward.action.parameter.title')">
        <Form />
      </Card>
      <Card :title="$t('common.result')">
        <div class="min-h-[340px] flex-1 overflow-auto">
          <template v-if="result !== null">
            <JsonViewer :value="result" copyable :sort="false" boxed />
          </template>
          <template v-else>
            <div
              class="flex h-full items-center justify-center text-[var(--color-text-tertiary)]"
            >
              {{ $t('common.noData') }}
            </div>
          </template>
        </div>
      </Card>
    </div>
  </Modal>
</template>
