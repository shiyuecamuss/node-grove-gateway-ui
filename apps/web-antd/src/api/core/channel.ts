import type {
  ChannelInfo,
  CommonPageRequest,
  CommonPageResponse,
  CommonStatus,
  CommonTimeRangeRequest,
  IdType,
} from '@vben/types';

import { requestClient } from '#/api/request';

export namespace ChannelApi {
  export const base = '/channel';
  export const list = `${base}/list`;
  export const page = `${base}/page`;
  export const deleteChannel = (id: IdType) => `${base}/${id}`;
  export const getById = (id: IdType) => `${base}/detail/${id}`;
  export const changeStatus = `${base}/change-status`;

  /** channel page params */
  export interface ChannelPageParams
    extends CommonPageRequest,
      CommonTimeRangeRequest {
    name?: string;
    status?: (typeof CommonStatus)[keyof typeof CommonStatus];
  }
}

/**
 * fetch channel page
 * @param params - Channel page params
 * @returns Promise with channel page response
 */
export async function fetchChannelPage(params: ChannelApi.ChannelPageParams) {
  return requestClient.get<CommonPageResponse<ChannelInfo>>(ChannelApi.page, {
    params,
  });
}

/**
 * create channel
 * @param data - Channel data
 * @returns Promise with create channel response
 */
export async function createChannel(data: ChannelInfo) {
  return requestClient.post(ChannelApi.base, data);
}

/**
 * update channel
 * @param data - Channel data
 * @returns Promise with update channel response
 */
export async function updateChannel(data: ChannelInfo) {
  return requestClient.put(ChannelApi.base, data);
}

/**
 * delete channel
 * @param id - Channel ID
 * @returns Promise with delete response
 */
export async function deleteChannel(id: IdType) {
  return requestClient.delete(ChannelApi.deleteChannel(id));
}

/**
 * get channel by id
 * @param id - Channel ID
 * @returns Promise with channel response
 */
export async function getChannelById(id: IdType) {
  return requestClient.get<ChannelInfo>(ChannelApi.getById(id));
}

/**
 * change channel status
 * @param id - Channel ID
 * @param status - Channel status
 * @returns Promise with change status response
 */
export async function changeChannelStatus(
  id: IdType,
  status: (typeof CommonStatus)[keyof typeof CommonStatus],
) {
  return requestClient.put(ChannelApi.changeStatus, {
    id,
    status,
  });
}
