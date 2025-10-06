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
    columnScrollTop: 0,
    contentScrollTop: 0,
    isColumnScroll: false,
    isContentScroll: false,
    scrollEndTimer: 0,
  },

  async test() {
    const result = await getTimeTable();
    console.log(result)
  },

  onLoad() {
    this.setData({
      navH: wx.getWindowInfo().statusBarHeight + 46
    })
  },

  onColumnScroll(e: WechatMiniprogram.ScrollViewDragging) {
    if (!this.data.isContentScroll) {
      this.data.isColumnScroll = true;
      this.setData({
        contentScrollTop: e.detail.scrollTop
      });
      clearTimeout(this.data.scrollEndTimer);

      this.data.scrollEndTimer = setTimeout(() => {
        this.data.isColumnScroll = false;
      }, 300);
    }
  },

  onContentScroll(e: WechatMiniprogram.ScrollViewDragging) {
    if (!this.data.isColumnScroll) {
      this.data.isContentScroll = true;
      this.setData({
        columnScrollTop: e.detail.scrollTop
      });

      
    }
  },

})