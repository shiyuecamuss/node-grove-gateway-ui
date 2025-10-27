import type {
  CommonPageRequest,
  CommonPageResponse,
  CommonStatus,
  CommonTimeRangeRequest,
  DeviceInfo,
  IdType,
} from '@vben/types';

import { requestClient } from '#/api/request';

export namespace DevicelApi {
  export const base = '/device';
  export const list = `${base}/list`;
  export const page = `${base}/page`;
  export const deleteDevice = (id: IdType) => `${base}/${id}`;
  export const getById = (id: IdType) => `${base}/detail/${id}`;
  export const changeStatus = `${base}/change-status`;

  /** device page params */
  export interface DevicePageParams
    extends CommonPageRequest,
      CommonTimeRangeRequest {
    deviceName?: string;
    deviceType?: string;
    channelId?: IdType;
    status?: (typeof CommonStatus)[keyof typeof CommonStatus];
  }
}

/**
 * fetch device page
 * @param params - Device page params
 * @returns Promise with device page response
 */
export async function fetchDevicePage(params: DevicelApi.DevicePageParams) {
  return requestClient.get<CommonPageResponse<DeviceInfo>>(DevicelApi.page, {
    params,
  });
}

/**
 * create device
 * @param data - Device data
 * @returns Promise with create device response
 */
export async function createDevice(data: DeviceInfo) {
  return requestClient.post(DevicelApi.base, data);
}

/**
 * update device
 * @param data - Device data
 * @returns Promise with update device response
 */
export async function updateDevice(data: DeviceInfo) {
  return requestClient.put(DevicelApi.base, data);
}

/**
 * delete device
 * @param id - Device ID
 * @returns Promise with delete response
 */
export async function deleteDevice(id: IdType) {
  return requestClient.delete(DevicelApi.deleteDevice(id));
}

/**
 * get device by id
 * @param id - Device ID
 * @returns Promise with device response
 */
export async function getDeviceById(id: IdType) {
  return requestClient.get<DeviceInfo>(DevicelApi.getById(id));
}

/**
 * change device status
 * @param id - Device ID
 * @param status - Device status
 * @returns Promise with change status response
 */
export async function changeDeviceStatus(
  id: IdType,
  status: (typeof CommonStatus)[keyof typeof CommonStatus],
) {
  return requestClient.put(DevicelApi.changeStatus, {
    id,
    status,
  });
}
