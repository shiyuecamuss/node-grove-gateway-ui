<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';
import type { AppInfo, IdType, PluginInfo } from '@vben/types';
import type { OnActionClickParams, VxeGridProps } from '#/adapter/vxe-table';

import { confirm, Page } from '@vben/common-ui';
import { useRequestHandler } from '@vben/hooks';
import { $t } from '@vben/locales';
import { CommonStatus, EntityType } from '@vben/types';
import { Switch, message } from 'ant-design-vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  changeAppStatus,
  deleteApp,
  fetchAllPlugins,
  fetchAppPage,
} from '#/api';
import { onMounted, reactive, ref } from 'vue';

import { createSearchFormSchema, useColumns } from './modules/schemas';

defineOptions({
  name: 'NorthwardAppPage',
});

interface SelectOption {
  /**
   * Option label text.
   */
  label: string;
  /**
   * Option underlying value.
   */
  value: IdType;
}

const { handleRequest } = useRequestHandler();

const pluginRecords = ref<PluginInfo[]>([]);
const pluginOptions = reactive<SelectOption[]>([]);

/**
 * Resolve plugin name by identifier.
 * @param pluginId - Plugin identifier.
 */
function resolvePluginName(pluginId: IdType) {
  const record = pluginRecords.value.find((item) => item.id === pluginId);
  return record?.name ?? '-';
}

/**
 * Initialize plugin dropdown options.
 */
async function loadPluginOptions() {
  await handleRequest(
    () => fetchAllPlugins(),
    (data) => {
      pluginRecords.value = data;
      pluginOptions.splice(
        0,
        pluginOptions.length,
        ...data.map<SelectOption>((plugin) => ({
          label: plugin.name,
          value: plugin.id,
        })),
      );
    },
  );
}

const formOptions: VbenFormProps = {
  collapsed: true,
  schema: createSearchFormSchema(pluginOptions),
  showCollapseButton: true,
  submitOnEnter: false,
};

const gridOptions: VxeGridProps<AppInfo> = {
  checkboxConfig: {
    highlight: true,
    labelField: 'name',
  },
  columns: useColumns({
    onActionClick,
    resolvePluginName,
  }),
  exportConfig: {},
  height: 'auto',
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
        return await fetchAppPage({
          page: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
        });
      },
    },
  },
  toolbarConfig: {
    custom: true,
    export: false,
    import: false,
    refresh: true,
    zoom: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});

/**
 * Handle table action button clicks.
 * @param payload - Event payload.
 */
function onActionClick({ code, row }: OnActionClickParams<AppInfo>) {
  switch (code) {
    case 'delete': {
      handleDelete(row);
      break;
    }
    default: {
      break;
    }
  }
}

/**
 * Toggle app enablement status.
 * @param row - Target app row.
 */
async function toggleStatus(row: AppInfo) {
  const status =
    row.status === CommonStatus.ENABLED
      ? CommonStatus.DISABLED
      : CommonStatus.ENABLED;
  await handleRequest(
    () => changeAppStatus(row.id, status),
    async () => {
      message.success($t('common.action.changeStatusSuccess'));
      await gridApi.query();
    },
  );
}

/**
 * Delete app after confirmation.
 * @param row - Target app row.
 */
function handleDelete(row: AppInfo) {
  confirm({
    content: $t('common.action.deleteConfirm', {
      entityType: $t(`entity.${EntityType.APP.toLowerCase()}`),
      name: row.name,
    }),
    icon: 'warning',
    title: $t('common.tips'),
  })
    .then(async () => {
      await handleRequest(
        () => deleteApp(row.id),
        async () => {
          message.success(
            $t('common.action.deleteSuccessWithName', { name: row.name }),
          );
          await gridApi.query();
        },
      );
    })
    .catch(() => {});
}

onMounted(() => {
  void loadPluginOptions();
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #status="{ row }">
        <Switch
          :checked="row.status === CommonStatus.ENABLED"
          @update:checked="toggleStatus(row)"
        />
      </template>
    </Grid>
  </Page>
</template>
