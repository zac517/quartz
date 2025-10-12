// pages/guide/guide.ts
Page({
  data: {
    currentIndex: 0,
    backgroundColors: [
      '#9370DB',
      '#9e030b',
      '#165DFF',
    ]
  },
  onLoad() {

  },
  handleChange(e: WechatMiniprogram.SwiperChange) {
    this.setData({
      currentIndex: e.detail.current
    })
  }
})