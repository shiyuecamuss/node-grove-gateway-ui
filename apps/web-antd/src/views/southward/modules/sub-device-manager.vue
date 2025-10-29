<script lang="ts" setup>
import type { DeviceInfo, IdType, Recordable } from '@vben/types';

import type { OnActionClickParams, VxeGridProps } from '#/adapter/vxe-table';

import { nextTick } from 'vue';

import { confirm, Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { FormOpenType } from '@vben/constants';
import { useRequestHandler } from '@vben/hooks';
import { $t } from '@vben/locales';
import { CommonStatus, EntityType } from '@vben/types';

import { Button, message, Switch } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  changeDeviceStatus,
  createDevice,
  deleteDevice,
  fetchDevicePage,
  updateDevice,
} from '#/api';

import { deviceSearchFormSchema } from './schemas/search-form';
import { useDeviceColumns } from './schemas/table-columns';
import SubDeviceForm from './sub-device-form.vue';

defineOptions({ name: 'SubDeviceModal' });

const { handleRequest } = useRequestHandler();

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: SubDeviceForm,
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
    await gridApi.query();
  },
});

const gridOptions: VxeGridProps<DeviceInfo> = {
  checkboxConfig: {
    highlight: true,
    labelField: 'name',
  },
  columns: useDeviceColumns(onActionClick),
  exportConfig: {},
  height: 'auto', // 如果设置为 auto，则必须确保存在父节点且不允许存在相邻元素，否则会出现高度闪动问题
  keepSource: true,
  proxyConfig: {
    autoLoad: true,
    response: {
      result: 'records',
      total: 'total',
      list: 'records',
    },
    ajax: {
      query: async ({ page }, formValues) => {
        const { channelId } = modalApi.getData<{ channelId: IdType }>();
        return await fetchDevicePage({
          page: page.currentPage,
          pageSize: page.pageSize,
          channelId,
          ...formValues,
        });
      },
    },
  },
  toolbarConfig: {
    custom: true,
    export: true,
    import: true,
    refresh: true,
    zoom: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    collapsed: true,
    schema: deviceSearchFormSchema,
    showCollapseButton: true,
    submitOnEnter: false,
  },
  gridOptions,
});

function onActionClick({ code, row }: OnActionClickParams<DeviceInfo>) {
  switch (code) {
    case 'delete': {
      handleDelete(row);
      break;
    }
    case 'edit': {
      handleEdit(row);
      break;
    }
    default: {
      break;
    }
  }
}

const handleCreate = () => {
  const { channelId, driverId } = modalApi.getData<{
    channelId: IdType;
    driverId: IdType;
  }>();

  formDrawerApi
    .setData({
      type: FormOpenType.CREATE,
      channelId,
      driverId,
    })
    .setState({
      title: $t('common.createWithName', {
        name: $t('page.southward.device.title'),
      }),
    })
    .open();
};

const handleEdit = (row: DeviceInfo) => {
  const { channelId, driverId } = modalApi.getData<{
    channelId: IdType;
    driverId: IdType;
  }>();

  formDrawerApi
    .setData({
      type: FormOpenType.EDIT,
      id: row.id,
      channelId,
      driverId,
    })
    .setState({
      title: $t('common.editWithName', { name: row.deviceName }),
    })
    .open();
};

const handleDelete = async (row: DeviceInfo) => {
  confirm({
    content: $t('common.action.deleteConfirm', {
      entityType: $t(`entity.${EntityType.DEVICE.toLowerCase()}`),
      name: row.deviceName,
    }),
    icon: 'warning',
    title: $t('common.tips'),
  })
    .then(async () => {
      await handleRequest(
        () => deleteDevice(row.id),
        async () => {
          message.success(
            $t('common.action.deleteSuccessWithName', { name: row.deviceName }),
          );
        },
      );
      await gridApi.query();
    })
    .catch(() => {});
};

const toggleStatus = async (row: DeviceInfo) => {
  const status =
    row.status === CommonStatus.ENABLED
      ? CommonStatus.DISABLED
      : CommonStatus.ENABLED;
  await handleRequest(
    () => changeDeviceStatus(row.id, status),
    async () => {
      message.success($t('common.action.changeStatusSuccess') as string);
      await gridApi.query();
    },
  );
};

const handleFormSubmit = async (
  type: FormOpenType,
  id: IdType | undefined,
  values: Recordable<any>,
) => {
  const payload = { ...values } as DeviceInfo;
  await (type === FormOpenType.CREATE
    ? handleRequest(
        () => createDevice(payload),
        async () => {
          formDrawerApi.close();
          message.success($t('common.action.createSuccess') as string);
          await gridApi.query();
        },
      )
    : handleRequest(
        () => updateDevice({ ...(payload as any), id } as any),
        async () => {
          formDrawerApi.close();
          message.success($t('common.action.updateSuccess') as string);
          await gridApi.query();
        },
      ));
};
</script>

<template>
  <Modal>
    <Page auto-content-height>
      <Grid>
        <template #status="{ row }">
          <Switch
            :checked="row.status === CommonStatus.ENABLED"
            @update:checked="toggleStatus(row)"
          />
        </template>
        <template #toolbar-tools>
          <Button class="mr-2" type="primary" @click="handleCreate">
            <span>{{
              `${$t('common.createWithName', { name: $t('page.southward.device.title') })}`
            }}</span>
          </Button>
        </template>
      </Grid>
    </Page>
    <FormDrawer @submit="handleFormSubmit" />
  </Modal>
</template>
