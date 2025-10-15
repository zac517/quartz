// pages/timetable/timetable.ts
import { getTimeTable } from "../../api/jxglstu/course_table"

Page({

  data: {
    currentIndex: 0
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
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },
})