// pages/timetable/timetable.ts
import { getTimeTable } from "../../api/jxglstu/course_table"

// 生成20周的数据（从2024年9月8日开始，周一作为第一天）
function generateWeeksData() {
  const startDate = new Date('2024-09-08'); // 从9月8日（周一）开始
  const weeks = [];
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const dayNames = ['一', '二', '三', '四', '五', '六', '日']; // 周一到周日
  
  // 示例课程数据（实际应该从接口获取）
  const sampleCourses = [
    { name: '高等数学', info: '一教101', teacher: '李老师', day: 1, rowStart: 1, rowEnd: 3, bgColor: 0 },
    { name: '大学英语', info: '三教301', teacher: '王老师', day: 1, rowStart: 3, rowEnd: 5, bgColor: 3 },
    { name: '大学物理', info: '二教202', teacher: '张老师', day: 2, rowStart: 1, rowEnd: 3, bgColor: 1 },
    { name: '计算机基础', info: '三教303', teacher: '刘老师', day: 3, rowStart: 3, rowEnd: 5, bgColor: 2 },
    { name: '体育', info: '操场', teacher: '赵老师', day: 5, rowStart: 11, rowEnd: 14, bgColor: 4 }
  ];

  for (let weekNum = 0; weekNum < 20; weekNum++) {
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(startDate.getDate() + weekNum * 7);
    
    // 获取这周一的月份
    const month = weekStartDate.getMonth() + 1;
    const monthName = monthNames[weekStartDate.getMonth()];
    
    // 生成这一周的7天日期（周一到周日）
    const dates = [];
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(weekStartDate);
      currentDate.setDate(weekStartDate.getDate() + day);
      
      const date = currentDate.getDate();
      
      // 直接使用 day 作为索引，因为 dayNames 已经是周一到周日的顺序
      dates.push({
        day: dayNames[day],
        date: String(date)
      });
    }
    
    weeks.push({
      weekNum: weekNum + 1,
      month: month,
      monthName: monthName,
      dates: dates,
      courses: sampleCourses // 临时使用示例数据
    });
  }
  
  return weeks;
}

Page({

  data: {
    currentIndex: 0,
    weeks: [] as any[],
    colors: [
      '#E8F0FE',
      '#E6F4EA',
      '#FEE0E0',
      '#F3E8FF',
      '#FFF0E0',
      '#DFF6ED',
      '#FEE2E2',
      '#EEF2FF',
      '#FEF3C7',
      '#E0F2FE',
    ],
    timeSlots: {
      morning: [
        { timeStart: '08:00', timeEnd: '08:50' },
        { timeStart: '09:00', timeEnd: '09:50' },
        { timeStart: '10:10', timeEnd: '11:00' },
        { timeStart: '11:10', timeEnd: '12:00' },
      ],
      afternoon: [
        { timeStart: '14:00', timeEnd: '14:50' },
        { timeStart: '15:00', timeEnd: '15:50' },
        { timeStart: '16:00', timeEnd: '16:50' },
        { timeStart: '17:00', timeEnd: '17:50' },
      ],
      evening: [
        { timeStart: '19:00', timeEnd: '19:50' },
        { timeStart: '20:00', timeEnd: '20:50' },
        { timeStart: '21:00', timeEnd: '21:50' },
      ]
    }
  },

  onSwiperChange(e: WechatMiniprogram.SwiperChange) {
    this.setData({
      currentIndex: e.detail.current
    });
  },

  async test() {
    const result = await getTimeTable();
    console.log(result)
  },

  test2() {
    this.setData({
      currentIndex: 2
    })
  },

  onLoad() {
    // 生成20周数据
    const weeks = generateWeeksData();
    this.setData({
      weeks: weeks
    });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },
})