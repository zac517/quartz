import { app } from '../../storages/config'

Page({
  data: {
    currentIndex: 0,
    colors: [
      '#9370DB',
      '#ae2126',
      '#165DFF',
    ],
    barHeight: 0,
    images: [
      {
        loaded: false,
        src: 'cloud://cloud1-5g87ixg4fca1088e.636c-cloud1-5g87ixg4fca1088e-1332869741/logo.png',
        style: 'opacity: 0.2;',
      },
      {
        loaded: false,
        src: 'cloud://cloud1-5g87ixg4fca1088e.636c-cloud1-5g87ixg4fca1088e-1332869741/hfut.png',
        style: 'opacity: 0.1;'
      },
    ],


    isLogin: true,
    useCloud: true,
  },
  
  showImg(e: WechatMiniprogram.BaseEvent) {
    const { index } = e.currentTarget.dataset;
    this.data.images[index].loaded = true;
    this.setData({
      'images': this.data.images,
    })
  },

  onLoad() {
    const { isLogin, useCloud } = app;
    this.setData({
      barHeight: wx.getWindowInfo().statusBarHeight,
      isLogin: isLogin.value,
      useCloud: useCloud.value,
    });
    wx.getImageInfo({
      src: 'cloud://cloud1-5g87ixg4fca1088e.636c-cloud1-5g87ixg4fca1088e-1332869741/bingtang.jpg'
    })
  },

  onshow() {

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
      this.skip();
    }
  },

  skip() {
    const { initFlag } = app;
    initFlag.value = true;
    wx.switchTab({
      url: '/pages/timetable/timetable'
    })
  },

  login() {
    wx.navigateTo({
      url: '/pages/login/login',
      events: {
        isLogin: () => {
          this.setData({
            isLogin: true,
          })
        }
      }
    })
  },

  auth() {
    const { useCloud } = app;
    useCloud.value = true;
    this.setData({
      useCloud: useCloud.value,
    });
  }
})