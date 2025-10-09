Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: "/pages/timetable/timetable",
        text: "课表",
        className: 'iconfont icon-table',
      },
      {
        pagePath: "/pages/todo/todo",
        text: "日程",
        className: 'iconfont icon-list',
      },
      {
        pagePath: "/pages/profile/profile",
        text: "我的",
        className: 'iconfont icon-user',
      }
    ]
  },
  methods: {
    switchTab(e: WechatMiniprogram.BaseEvent) {
      const data = e.currentTarget.dataset;
      this.setData({ selected: data.index });
      wx.switchTab({ url: data.path });
    }
  }
})