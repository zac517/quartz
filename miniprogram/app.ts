import { app } from './storages/config';

App({
  globalData: {},
  onLaunch() {
    wx.onBeforeAppRoute(res => {
      const initFlag = app.initFlag.value;
      if (res.path !== 'pages/guide/guide' && !initFlag) {
        // 重写路由事件
        wx.rewriteRoute({
          url: '/pages/guide/guide',
          fail(res) {
            console.log('路由重写失败', res)
            wx.redirectTo({
              url: '/pages/guide/guide',
            })
          }
        })
        return
      }
    })
  }
})