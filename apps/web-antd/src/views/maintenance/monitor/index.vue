<script lang="ts" setup>
import type { ChannelInfo, DeviceInfo } from '@vben/types';

import type { MonitorRow } from './modules/types';

import type { VxeGridListeners, VxeGridProps } from '#/adapter/vxe-table';

import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';

import { Page } from '@vben/common-ui';
import { useRequestHandler } from '@vben/hooks';
import { $t } from '@vben/locales';

import { Input, Select, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchChannelList, getSubDevicesById } from '#/api';

import { useMonitorColumns } from './modules/schemas';
import { useMonitorWs } from './modules/use-monitor-ws';

const channelOptions = ref<ChannelInfo[]>([]);
const deviceOptions = ref<DeviceInfo[]>([]);
const selectedChannelId = ref<number | undefined>();
const selectedDeviceId = ref<number | undefined>();
const keyword = ref('');

const pager = ref({
  currentPage: 1,
  pageSize: 20,
  total: 0,
});

const {
  status: connectionStatus,
  snapshots,
  subscribe,
  unsubscribe,
  connect,
  disconnect,
} = useMonitorWs();

const { handleRequest } = useRequestHandler();

const gridOptions: VxeGridProps<MonitorRow> = {
  height: 'auto', // 如果设置为 auto，则必须确保存在父节点且不允许存在相邻元素，否则会出现高度闪动问题
  keepSource: true,
  pagerConfig: {},
  toolbarConfig: {
    custom: true,
    refresh: false,
    zoom: true,
  },
  columns: useMonitorColumns(),
};

const gridEvents: VxeGridListeners<MonitorRow> = {
  pageChange({ currentPage, pageSize }) {
    pager.value.currentPage = currentPage;
    pager.value.pageSize = pageSize;
    updateGridData();
  },
};

const [Grid, gridApi] = useVbenVxeGrid<MonitorRow>({
  gridOptions,
  gridEvents,
});

const statusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': {
      return $t('page.monitor.realtime.status.connected');
    }
    case 'connecting': {
      return $t('page.monitor.realtime.status.connecting');
    }
    case 'reconnecting': {
      return $t('page.monitor.realtime.status.reconnecting');
    }
    default: {
      return $t('page.monitor.realtime.status.disconnected');
    }
  }
});

const statusColor = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': {
      return 'success';
    }
    case 'connecting': {
      return 'processing';
    }
    case 'reconnecting': {
      return 'warning';
    }
    default: {
      return 'default';
    }
  }
});

function buildRows(): MonitorRow[] {
  const rows: MonitorRow[] = [];
  const kw = keyword.value.trim().toLowerCase();

  snapshots.value.forEach((snap) => {
    const pushRow = (
      key: string,
      value: unknown,
      sourceType: MonitorRow['sourceType'],
    ) => {
      if (kw && !key.toLowerCase().includes(kw)) return;
      rows.push({
        id: `${snap.deviceId}-${sourceType}-${key}`,
        deviceId: snap.deviceId,
        deviceName: snap.deviceName,
        key,
        value,
        sourceType,
        lastUpdate: snap.lastUpdate,
      });
    };

    Object.entries(snap.telemetry ?? {}).forEach(([k, v]) =>
      pushRow(k, v, 'telemetry'),
    );
    Object.entries(snap.clientAttributes ?? {}).forEach(([k, v]) =>
      pushRow(k, v, 'attributes'),
    );
    Object.entries(snap.sharedAttributes ?? {}).forEach(([k, v]) =>
      pushRow(k, v, 'attributes'),
    );
    Object.entries(snap.serverAttributes ?? {}).forEach(([k, v]) =>
      pushRow(k, v, 'attributes'),
    );
  });

  return rows;
}

function updateGridData() {
  const allRows = buildRows();

  pager.value.total = allRows.length;

  let { currentPage, pageSize } = pager.value;

  const maxPage =
    allRows.length === 0
      ? 1
      : Math.max(1, Math.ceil(allRows.length / pageSize));
  if (currentPage > maxPage) {
    currentPage = maxPage;
    pager.value.currentPage = maxPage;
  }

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const pageRows = allRows.slice(startIndex, endIndex);

  gridApi.setGridOptions({
    data: pageRows,
    pagerConfig: {
      ...gridOptions.pagerConfig,
      currentPage,
      pageSize,
      total: pager.value.total,
    },
  });
}

watch(
  [snapshots, keyword],
  ([, newKeyword], [, oldKeyword]) => {
    // 只有在搜索关键字变化时才重置到第一页；普通数据刷新保持当前页
    if (newKeyword !== oldKeyword) {
      pager.value.currentPage = 1;
    }
    updateGridData();
  },
  { deep: true },
);

async function loadChannels() {
  await handleRequest(
    () => fetchChannelList(),
    (resp) => {
      channelOptions.value = resp ?? [];
    },
  );
}

async function loadDevices() {
  if (!selectedChannelId.value) {
    deviceOptions.value = [];
    return;
  }
  await handleRequest(
    () => getSubDevicesById(selectedChannelId.value!),
    (resp) => {
      deviceOptions.value = resp ?? [];
    },
  );
}

watch(selectedChannelId, async () => {
  selectedDeviceId.value = undefined;
  unsubscribe();
  await loadDevices();
});

watch(
  selectedDeviceId,
  (id) => {
    if (!id) {
      unsubscribe();
      return;
    }
    connect();
    subscribe([id], selectedChannelId.value);
  },
  { deep: true },
);

onBeforeUnmount(() => {
  unsubscribe();
  disconnect();
});

onMounted(async () => {
  await nextTick();
  await loadChannels();
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <Tag :color="statusColor" class="text-[13px]">
          {{ statusText }}
        </Tag>
      </template>
      <template #toolbar-tools>
        <div class="flex items-center gap-3">
          <Select
            v-model:value="selectedChannelId"
            :allow-clear="true"
            :options="
              channelOptions.map((c) => ({
                label: c.name,
                value: c.id,
              }))
            "
            class="w-52"
            :placeholder="$t('page.monitor.realtime.channel')"
          />
          <Select
            v-model:value="selectedDeviceId"
            :allow-clear="true"
            :disabled="!selectedChannelId"
            :options="
              deviceOptions.map((d) => ({
                label: d.deviceName,
                value: d.id,
              }))
            "
            class="w-72"
            :placeholder="$t('page.monitor.realtime.device')"
          />
          <Input
            v-model:value="keyword"
            :placeholder="$t('page.monitor.realtime.searchPlaceholder')"
            class="w-64"
            allow-clear
          />
        </div>
      </template>
    </Grid>
  </Page>
</template>
