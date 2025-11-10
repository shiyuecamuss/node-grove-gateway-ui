<script lang="ts" setup>
import type { IdType } from '@vben/types';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { DriverTemplateEntity } from '@vben/types';

import { Radio } from 'ant-design-vue';

import { downloadDriverTemplate } from '#/api';

defineOptions({ name: 'TemplateDownload' });

// Selected entity state
const selectedEntity = ref<
  (typeof DriverTemplateEntity)[keyof typeof DriverTemplateEntity]
>(DriverTemplateEntity.Device);

// Modal registration
const [Modal, modalApi] = useVbenModal({
  class: 'w-[520px]',
  destroyOnClose: true,
  title: $t('page.southward.driver.templateDownload'),
  fullscreenButton: false,
  onConfirm: async () => {
    const { driverId, driverType } =
      modalApi.getData<{ driverId: IdType; driverType: string }>() ?? {};
    if (!driverId) return;
    // Trigger template download by selected entity
    await downloadDriverTemplate(driverId, driverType, selectedEntity.value);
    modalApi.close();
  },
});

const options = [
  { label: $t('entity.device'), value: DriverTemplateEntity.Device },
  { label: $t('entity.point'), value: DriverTemplateEntity.Point },
  { label: $t('entity.action'), value: DriverTemplateEntity.Action },
];
</script>

<template>
  <Modal>
    <div class="flex justify-center px-2 py-4">
      <Radio.Group
        v-model:value="selectedEntity"
        :options="options"
        option-type="button"
        button-style="solid"
      />
    </div>
  </Modal>
</template>

<style scoped></style>
