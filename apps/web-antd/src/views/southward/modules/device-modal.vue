<script lang="ts" setup>
import type { DeviceInfo, IdType, Recordable } from '@vben/types';

import type { OnActionClickParams, VxeGridProps } from '#/adapter/vxe-table';

import { Page, useVbenModal } from '@vben/common-ui';
import { FormOpenType } from '@vben/constants';
import { useRequestHandler } from '@vben/hooks';
import { $t } from '@vben/locales';
import { CommonStatus } from '@vben/types';

import { Button, message, Switch } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  changeDeviceStatus,
  createDevice,
  deleteDevice,
  fetchDevicePage,
  updateDevice,
} from '#/api';

import DeviceForm from './device-form.vue';
import { deviceSearchFormSchema } from './schemas/search-form';
import { useDeviceColumns } from './schemas/table-columns';

defineOptions({ name: 'SouthwardDeviceModal' });

const { handleRequest } = useRequestHandler();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: DeviceForm,
  destroyOnClose: true,
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-4/5',
  destroyOnClose: true,
  onCancel() {
    modalApi.close();
  },
  onOpenChange: async (isOpen: boolean) => {
    if (isOpen) {
      await gridApi.query();
    }
  },
});

const gridOptions: VxeGridProps<DeviceInfo> = {
  columns: useDeviceColumns(onActionClick),
  height: 'auto',
  keepSource: true,
  proxyConfig: {
    autoLoad: false,
    response: { result: 'records', total: 'total', list: 'records' },
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
    import: false,
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
  const { channelId } = modalApi.getData<{ channelId: IdType }>();
  formModalApi
    .setData({
      type: FormOpenType.CREATE,
      channelId,
    })
    .setState({
      title: $t('common.createWithName', {
        name: $t('page.southward.device.title'),
      }),
    })
    .open();
};

const handleEdit = (row: DeviceInfo) => {
  formModalApi
    .setData({
      type: FormOpenType.EDIT,
      id: row.id,
    })
    .setState({
      title: $t('common.editWithName', { name: row.deviceName }),
    })
    .open();
};

const handleDelete = async (row: DeviceInfo) => {
  await handleRequest(
    () => deleteDevice(row.id),
    async () => {
      message.success(
        $t('common.action.deleteSuccessWithName', {
          name: row.deviceName,
        }) as string,
      );
      await gridApi.query();
    },
  );
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
          formModalApi.close();
          message.success($t('common.action.createSuccess') as string);
          await gridApi.query();
        },
      )
    : handleRequest(
        () => updateDevice({ ...(payload as any), id } as any),
        async () => {
          formModalApi.close();
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
    <FormModal @submit="handleFormSubmit" />
  </Modal>
</template>
