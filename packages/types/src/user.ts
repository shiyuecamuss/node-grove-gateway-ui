import type { BasicUserInfo } from '@vben-core/typings';

/** 用户信息 */
interface UserInfo extends BasicUserInfo {
  /**
   * 手机号码
   */
  phone?: string;
  /**
   * 邮箱
   */
  email?: string;
}

export type { UserInfo };
