import { request } from '../request'

const studentId = '';

// 学期 id 是通过 HTML 返回的，这里尝试用一个函数计算出合工大的学期 id
/**
 * 获取学期 id
 * 
 * 暂不实现 2019 年以前的学期 id 查询
 * @param date 传入的日期
 * @returns 学期 id
 */
function getSemesterId(date: Date): number {
  const ruleSplitData = new Date(2019, 9 - 1, 1);
  if (date < ruleSplitData) return 0;
  else {
    const year = date.getFullYear();
    // 日期对象的月份从 0 开始索引
    const springSplitDate = new Date(year, 3 - 1, 1);
    const autumnSplitDate = new Date(year, 9 - 1, 1);
    const position: number = date < springSplitDate ? -1 : (date < autumnSplitDate ? 0 : 1);

    const semesterId = 54 + (year - 2019) * 40 + position * 20;
    return semesterId
  }
}

/**
 * 获取学生 id，通过 302 响应的返回值
 */
function getStudentId(): number {
  return 0;
}

/**
 * 获取课程表数据
 * 需要 SESSON
 */
export async function getTimeTable() {
  return await request({
    url: 'https://jxglstu.hfut.edu.cn/eams5-student/for-std/course-table/get-data',
    data: {
      bizTypeId: 23,
      semesterId: getSemesterId(new Date()),
      dataId: studentId
    },
  })
}