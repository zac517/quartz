// pages/guide/guide.ts
Page({
  data: {
    currentIndex: 0,
    colors: [
      '#9370DB',
      '#9e030b',
      '#165DFF',
    ],
    barHeight: 0,
  },
  onLoad() {
    this.setData({
      barHeight: wx.getWindowInfo().statusBarHeight,
    })
  },
  handleChange(e: WechatMiniprogram.SwiperChange) {
    this.setData({
      currentIndex: e.detail.current
    })
  },
  next() {
    if (this.data.currentIndex < this.data.colors.length - 1) {
      this.setData({
        currentIndex: this.data.currentIndex + 1,
      })
    }
    else {
      wx.switchTab({
        url: '/pages/timetable/timetable'
      })
    }
  },
  skip() {
    wx.switchTab({
      url: '/pages/timetable/timetable'
    })
  },
})