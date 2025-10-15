import type {
  CommonPageRequest,
  CommonPageResponse,
  CommonStatus,
  CommonTimeRangeRequest,
  DriverInfo,
  IdType,
} from '@vben/types';

import { requestClient } from '#/api/request';

export namespace DriverApi {
  export const base = '/driver';
  export const list = `${base}/list`;
  export const page = `${base}/page`;
  export const install = `${base}/install`;
  export const uninstall = (id: IdType) => `${base}/${id}`;
  export const getById = (id: IdType) => `${base}/detail/${id}`;

  /** driver page params */
  export interface DriverPageParams
    extends CommonPageRequest,
      CommonTimeRangeRequest {
    name?: string;
    status?: (typeof CommonStatus)[keyof typeof CommonStatus];
  }
}

/**
 * fetch driver page
 * @param params - Driver page params
 * @returns Promise with driver page response
 */
export async function fetchDriverPage(params: DriverApi.DriverPageParams) {
  return requestClient.get<CommonPageResponse<DriverInfo>>(DriverApi.page, {
    params,
  });
}

/**
 * install driver
 * @param data - Driver data
 * @returns Promise with install driver response
 */
export async function installDriver(data: DriverInfo) {
  return requestClient.post(DriverApi.install, data);
}

/**
 * uninstall driver
 * @param id - Driver ID
 * @returns Promise with uninstall response
 */
export async function uninstallDriver(id: IdType) {
  return requestClient.delete(DriverApi.uninstall(id));
}

/**
 * get driver by id
 * @param id - Driver ID
 * @returns Promise with driver response
 */
export async function getDriverById(id: IdType) {
  return requestClient.get<DriverInfo>(DriverApi.getById(id));
}
