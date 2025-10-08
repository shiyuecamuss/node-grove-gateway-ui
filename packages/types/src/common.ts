interface CommonPageRequest {
  /**
   * 页码
   */
  page: number;
  /**
   * 分页数量
   */
  pageSize: number;
}

interface CommonTimeRangeRequest {
  startTime?: number;
  endTime?: number;
}

interface CommonSortRequest {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface CommonPageResponse<T> {
  /**
   * 页码
   */
  page: number;
  /**
   * 分页数量
   */
  pageSize: number;
  /**
   * 总数
   */
  total: number;
  /**
   * 总页数
   */
  pages: number;
  /**
   * 数据
   */
  records: T[];
}

export type {
  CommonPageRequest,
  CommonPageResponse,
  CommonSortRequest,
  CommonTimeRangeRequest,
};
