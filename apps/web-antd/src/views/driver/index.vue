<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';
import type { DriverInfo, IdType, Recordable, UserInfo } from '@vben/types';

import type { OnActionClickParams, VxeGridProps } from '#/adapter/vxe-table';

import { confirm, Page, useVbenDrawer } from '@vben/common-ui';
import { FormOpenType } from '@vben/constants';
import { useRequestHandler } from '@vben/hooks';
import { $t } from '@vben/locales';
import { EntityType } from '@vben/types';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createUser,
  fetchDriverPage,
  uninstallDriver,
  updateUser,
} from '#/api';

import DriverForm from './modules/form.vue';
import { searchFormSchema, useColumns } from './modules/schemas';

const { handleRequest } = useRequestHandler();

const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: true,
  schema: searchFormSchema,
  // 控制表单是否显示折叠按钮
  showCollapseButton: true,
  // 按下回车时是否提交表单
  submitOnEnter: false,
};

const gridOptions: VxeGridProps<DriverInfo> = {
  checkboxConfig: {
    highlight: true,
    labelField: 'name',
  },
  columns: useColumns(onActionClick),
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
        return await fetchDriverPage({
          page: page.currentPage,
          pageSize: page.pageSize,
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
  formOptions,
  gridOptions,
});

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: DriverForm,
});

function onActionClick({ code, row }: OnActionClickParams<DriverInfo>) {
  switch (code) {
    case 'uninstall': {
      handleUninstall(row);
      break;
    }
    default: {
      break;
    }
  }
}

const handleInstall = () => {
  formDrawerApi
    .setData({
      type: FormOpenType.CREATE,
    })
    .setState({
      title: $t('common.createWithName', {
        name: $t('page.system.user.title'),
      }),
    })
    .open();
};

const handleUninstall = async (row: DriverInfo) => {
  confirm({
    content: $t('common.action.uninstallConfirm', {
      entityType: $t(`entity.${EntityType.DRIVER.toLowerCase()}`),
      name: row.name,
    }),
    icon: 'warning',
    title: $t('common.tips'),
  })
    .then(async () => {
      await handleRequest(
        () => uninstallDriver(row.id),
        (_) => {
          message.success(
            $t('common.action.uninstallSuccessWithName', { name: row.name }),
          );
        },
      );
      await gridApi.query();
    })
    .catch(() => {});
};

const handleFormSubmit = async (
  type: FormOpenType,
  id: IdType | undefined,
  values: Recordable<any>,
) => {
  await (type === FormOpenType.CREATE
    ? handleRequest(
        () => createUser(values as UserInfo),
        (_) => {
          message.success($t('common.action.createSuccess'));
        },
      )
    : handleRequest(
        () =>
          updateUser({
            id,
            ...values,
          } as UserInfo),
        (_) => {
          message.success($t('common.action.updateSuccess'));
        },
      ));
  await gridApi.query();
};
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <Button class="mr-2" type="primary" @click="handleInstall">
          <span>{{
            `${$t('common.installWithName', { name: $t('page.driver.title') })}`
          }}</span>
        </Button>
      </template>
    </Grid>
    <FormDrawer @submit="handleFormSubmit" />
  </Page>
</template>
