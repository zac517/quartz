import { request } from '../request'

/**
 * 获取课程表数据
 * 需要 SESSON
 */
export async function getTimeTable() {
  // 获取 SESSON
  return request({
    url: 'https://one.hfut.edu.cn/api/operation/course-timetable/search/1/2025-10-23',
    useProxy: true,
  })
}