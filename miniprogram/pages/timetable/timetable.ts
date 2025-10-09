// pages/timetable/timetable.ts
import { getTimeTable } from "../../api/jxglstu/course_table"

Page({

  data: {
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
    },
    isMove: false,
    isTouch: false,
    isScroll: false,
    scrollTop: 0,
    currentIndex: 0,
    weeks: [
      // 第一周
      {
        weekNum: 1,
        dates: [
          { day: '一', date: '10/6' },
          { day: '二', date: '10/7' },
          { day: '三', date: '10/8' },
          { day: '四', date: '10/9' },
          { day: '五', date: '10/10' },
          { day: '六', date: '10/11' },
          { day: '日', date: '10/12' }
        ],
        courses: [
          // 周一课程
          { name: '高等数学', info: '一教101', teacher: '李老师', day: 1, rowStart: 1, rowEnd: 3, colorGroup: 1 }, 
          { name: '大学英语', info: '三教301', teacher: '王老师', day: 1, rowStart: 3, rowEnd: 5, colorGroup: 4 }, 
          
          // 周二课程
          { name: '大学物理', info: '二教202', teacher: '张老师', day: 2, rowStart: 1, rowEnd: 3, colorGroup: 2 }, 
          { name: '高等数学', info: '一教101', teacher: '李老师', day: 2, rowStart: 6, rowEnd: 8, colorGroup: 1 }, 
          
          // 周三课程
          { name: '计算机基础', info: '三教303', teacher: '刘老师', day: 3, rowStart: 3, rowEnd: 5, colorGroup: 3 }, 
          { name: '大学英语', info: '三教301', teacher: '王老师', day: 3, rowStart: 8, rowEnd: 10, colorGroup: 4 }, 
          
          // 周五课程
          { name: '体育', info: '操场', teacher: '赵老师', day: 5, rowStart: 11, rowEnd: 14, colorGroup: 5 } 
        ]
      },
      
      // 第二周
      {
        weekNum: 2,
        dates: [
          { day: '一', date: '10/13' },
          { day: '二', date: '10/14' },
          { day: '三', date: '10/15' },
          { day: '四', date: '10/16' },
          { day: '五', date: '10/17' },
          { day: '六', date: '10/18' },
          { day: '日', date: '10/19' }
        ],
        courses: [
          // 周一课程
          { name: '高等数学', info: '一教101', teacher: '李老师', day: 1, rowStart: 1, rowEnd: 3, colorGroup: 1 }, 
          { name: '线性代数', info: '一教105', teacher: '孙老师', day: 1, rowStart: 6, rowEnd: 8, colorGroup: 6 }, 
          
          // 周三课程
          { name: '计算机基础', info: '三教303', teacher: '刘老师', day: 3, rowStart: 3, rowEnd: 5, colorGroup: 3 }, 
          { name: '概率论', info: '二教208', teacher: '陈老师', day: 3, rowStart: 8, rowEnd: 10, colorGroup: 7 }, 
          
          // 周四课程
          { name: '大学英语', info: '三教301', teacher: '王老师', day: 4, rowStart: 1, rowEnd: 3, colorGroup: 4 }, 
          { name: '线性代数', info: '一教105', teacher: '孙老师', day: 4, rowStart: 6, rowEnd: 8, colorGroup: 6 },
          
          // 周六课程
          { name: '选修课', info: '四教402', teacher: '周老师', day: 6, rowStart: 1, rowEnd: 3, colorGroup: 8 } 
        ]
      },
      
      // 第三周
      {
        weekNum: 3,
        dates: [
          { day: '一', date: '10/20' },
          { day: '二', date: '10/21' },
          { day: '三', date: '10/22' },
          { day: '四', date: '10/23' },
          { day: '五', date: '10/24' },
          { day: '六', date: '10/25' },
          { day: '日', date: '10/26' }
        ],
        courses: [
          // 周二课程
          { name: '大学物理', info: '二教202', teacher: '张老师', day: 2, rowStart: 1, rowEnd: 3, colorGroup: 2 }, 
          { name: '数据结构', info: '三教310', teacher: '黄老师', day: 2, rowStart: 6, rowEnd: 8, colorGroup: 9 },
          
          // 周四课程
          { name: '操作系统', info: '四教408', teacher: '吴老师', day: 4, rowStart: 6, rowEnd: 8, colorGroup: 8 }, 
          { name: '大学英语', info: '三教301', teacher: '王老师', day: 4, rowStart: 8, rowEnd: 10, colorGroup: 4 }, 
          
          // 周五课程
          { name: '体育', info: '操场', teacher: '赵老师', day: 5, rowStart: 11, rowEnd: 14, colorGroup: 5 },
          { name: '概率论', info: '二教208', teacher: '陈老师', day: 5, rowStart: 3, rowEnd: 5, colorGroup: 7 }, 
          
          // 周日课程
          { name: '数据库', info: '一教112', teacher: '马老师', day: 7, rowStart: 1, rowEnd: 3, colorGroup: 10 } 
        ]
      }
    ]
  },

  scrollTimeout: 0,

  async test() {
    const result = await getTimeTable();
    console.log(result)
  },

  onLoad() {
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  onMoveStart() {
    if (!this.data.isMove) {
      this.setData({
        isMove: true
      })
    }
  },

  onMoveEnd() {
    this.setData({
      isMove: false
    })
  },

  onScroll(e: WechatMiniprogram.ScrollViewScroll) {
    if (!this.data.isScroll) {
      this.setData({
        isScroll: true,
      })
    }

    clearTimeout(this.scrollTimeout);
    this.data.scrollTop = e.detail.scrollTop;
    this.scrollTimeout = setTimeout(() => {
      this.setData({
        scrollTop: this.data.scrollTop,
      })

      setTimeout(() => {
        this.setData({
          isScroll: false,
        })
      }, 10)
    }, 70);
  },

  onTouchStart() {
    this.setData({
      isTouch: true
    })
  },

  onTouchEnd() {
    this.setData({
      isTouch: false
    })
  },

  onSwiperChange(e: WechatMiniprogram.SwiperChange) {
    this.setData({
      currentIndex: e.detail.current
    });
  },
})