<script lang="ts" setup>
import type { ChannelInfo, DeviceInfo } from '@vben/types';

import type { MonitorRow } from './modules/types';

import type { VxeGridProps } from '#/adapter/vxe-table';

import { computed, onBeforeUnmount, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Input, Select, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchChannelList, getSubDevicesById } from '#/api';

import { useMonitorColumns } from './modules/schemas';
import { useMonitorWs } from './modules/use-monitor-ws';

const channelOptions = ref<ChannelInfo[]>([]);
const deviceOptions = ref<DeviceInfo[]>([]);
const selectedChannelId = ref<number | undefined>();
const selectedDeviceIds = ref<number[]>([]);
const keyword = ref('');

const {
  status: connectionStatus,
  snapshots,
  subscribe,
  unsubscribe,
  connect,
  disconnect,
} = useMonitorWs();

const gridOptions: VxeGridProps<MonitorRow> = {
  height: 'auto',
  keepSource: true,
  toolbarConfig: {
    custom: true,
    refresh: false,
    zoom: true,
  },
  columns: useMonitorColumns(),
};

const [Grid, gridApi] = useVbenVxeGrid<MonitorRow>({
  gridOptions,
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
      pushRow(k, v, 'clientAttr'),
    );
    Object.entries(snap.sharedAttributes ?? {}).forEach(([k, v]) =>
      pushRow(k, v, 'sharedAttr'),
    );
    Object.entries(snap.serverAttributes ?? {}).forEach(([k, v]) =>
      pushRow(k, v, 'serverAttr'),
    );
  });

  return rows;
}

watch(
  [snapshots, keyword],
  () => {
    gridApi.setGridOptions({
      data: buildRows(),
    });
  },
  { deep: true },
);

async function loadChannels() {
  const resp = await fetchChannelList();
  channelOptions.value = resp ?? [];
}

async function loadDevices() {
  if (!selectedChannelId.value) {
    deviceOptions.value = [];
    return;
  }
  const resp = await getSubDevicesById(selectedChannelId.value);
  deviceOptions.value = resp ?? [];
}

watch(selectedChannelId, async () => {
  selectedDeviceIds.value = [];
  unsubscribe();
  await loadDevices();
});

watch(
  selectedDeviceIds,
  (ids) => {
    if (ids.length === 0) {
      unsubscribe();
      return;
    }
    connect();
    subscribe(ids, selectedChannelId.value);
  },
  { deep: true },
);

onBeforeUnmount(() => {
  unsubscribe();
  disconnect();
});

loadChannels();
</script>

<template>
  <Page auto-content-height>
    <template #header>
      <div class="flex items-center justify-between">
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
            v-model:value="selectedDeviceIds"
            :allow-clear="true"
            mode="multiple"
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
        <Tag :color="statusColor">
          {{ statusText }}
        </Tag>
      </div>
    </template>
    <Grid />
  </Page>
</template>
