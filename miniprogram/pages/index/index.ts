import { app } from '../../storages/config';

Page({
  data: {
  },

  onLoad() {
    try {
      const initFlag = app.initFlag.value ?? false;

      if (!initFlag) {
        wx.switchTab({
          url: '/pages/timetable/timetable'
        })
      }
      else {
        wx.switchTab({
          url: '/pages/timetable/timetable'
        })
      }
      
    } catch (error) {
      console.error('全局初始化失败:', error);
      wx.showToast({ title: '初始化失败，请重启', icon: 'none' });
    }
  },
})