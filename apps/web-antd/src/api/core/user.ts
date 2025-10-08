import type {
  CommonPageRequest,
  CommonPageResponse,
  CommonStatus,
  CommonTimeRangeRequest,
  IdType,
  UserInfo,
} from '@vben/types';

import { requestClient } from '#/api/request';

export namespace UserApi {
  export const base = '/user';
  export const info = `${base}/userinfo`;
  export const page = `${base}/page`;
  export const deleteUser = (id: IdType) => `${base}/${id}`;
  export const getById = (id: IdType) => `${base}/detail/${id}`;
  export const changeStatus = `${base}/change-status`;

  /** tenant page params */
  export interface UserPageParams
    extends CommonPageRequest,
      CommonTimeRangeRequest {
    name?: string;
    status?: (typeof CommonStatus)[keyof typeof CommonStatus];
  }
}

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  return requestClient.get<UserInfo>(UserApi.info);
}

/**
 * fetch user page
 * @param params - User page params
 * @returns Promise with user page response
 */
export async function fetchUserPage(params: UserApi.UserPageParams) {
  return requestClient.get<CommonPageResponse<UserInfo>>(UserApi.page, {
    params,
  });
}

/**
 * create tenant
 * @param data - Tenant data
 * @returns Promise with create tenant response
 */
export async function createUser(data: UserInfo) {
  return requestClient.post(UserApi.base, data);
}

/**
 * update tenant
 * @param data - Tenant data
 * @returns Promise with update tenant response
 */
export async function updateUser(data: UserInfo) {
  return requestClient.put(UserApi.base, data);
}

/**
 * delete tenant
 * @param id - Tenant ID
 * @returns Promise with delete response
 */
export async function deleteUser(id: IdType) {
  return requestClient.delete(UserApi.deleteUser(id));
}

/**
 * get tenant by id
 * @param id - Tenant ID
 * @returns Promise with tenant response
 */
export async function getUserById(id: IdType) {
  return requestClient.get<UserInfo>(UserApi.getById(id));
}

/**
 * change tenant status
 * @param id - Tenant ID
 * @param status - Tenant status
 * @returns Promise with change status response
 */
export async function changeUserStatus(
  id: IdType,
  status: (typeof CommonStatus)[keyof typeof CommonStatus],
) {
  return requestClient.put(UserApi.changeStatus, {
    id,
    status,
  });
}
