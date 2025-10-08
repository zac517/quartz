// pages/timetable/timetable.ts
import { getTimeTable } from "../../api/jxglstu/course_table"

Page({

  data: {
    navH: 0,
    timeSlots: {
      morning: [
        { timeStart: '8:00', timeEnd: '8:50' },
        { timeStart: '9:00', timeEnd: '9:50' },
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
  },

  scrollTimeout: 0,

  async test() {
    const result = await getTimeTable();
    console.log(result)
  },

  onLoad() {
    this.setData({
      navH: wx.getWindowInfo().statusBarHeight + 46
    })
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
})