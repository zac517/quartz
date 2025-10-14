// app.ts
import { app } from './storages/config';
App({
  globalData: {},

  async onLaunch() {
    try {
      const isAppInitialized = app.initFlag.value ?? false;

      if (!isAppInitialized) {
        wx.redirectTo({
          url: '/pages/guide/guide'
        })
      }
      else {
        wx.redirectTo({
          url: '/pages/timetable/timetable'
        })
      }
      
    } catch (error) {
      console.error('全局初始化失败:', error);
      wx.showToast({ title: '初始化失败，请重启', icon: 'none' });
    }
  },
})