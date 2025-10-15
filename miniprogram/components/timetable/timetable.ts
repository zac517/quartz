// components/timetable/timetable.ts
Component({
  options: {
    pureDataPattern: /^_/ // 指定所有 _ 开头的数据字段为纯数据字段
  },

  /**
   * 组件的属性列表
   */
  properties: {
    current: Number,
  },

  /**
   * 组件的初始数据
   */
  data: {
    timeSlots: {
      morning: [
        { timeStart: '08:00', timeEnd: '08:50' },
        { timeStart: '09:00', timeEnd: '09:50' },
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
    moveMode: 'still',
    scrollTop: 0,
    weeks: [
      // 第一周
      {
        weekNum: 1,
        month: 10,
        monthName: 'OCT',
        dates: [
          { day: '一', date: '6' },
          { day: '二', date: '7' },
          { day: '三', date: '8' },
          { day: '四', date: '9' },
          { day: '五', date: '10' },
          { day: '六', date: '11' },
          { day: '日', date: '12' }
        ],
        courses: [
          // 周一课程
          { name: '高等数学', info: '一教101', teacher: '李老师', day: 1, rowStart: 1, rowEnd: 3, colorGroup: 1 },
          { name: '大学英语', info: '三教301', teacher: '王老师', day: 1, rowStart: 3, rowEnd: 5, colorGroup: 4 },

          // 周二课程
          { name: '大学物理', info: '二教202', teacher: '张老师', day: 2, rowStart: 1, rowEnd: 3, colorGroup: 2 },
          { name: '高等数学', info: '一教101', teacher: '李老师', day: 2, rowStart: 6, rowEnd: 8, colorGroup: 1 },

          // 周三课程
          { name: '计算机基础', info: '三教303', teacher: '刘老师', day: 3, rowStart: 3, rowEnd: 5, colorGroup: 3 },
          { name: '大学英语', info: '三教301', teacher: '王老师', day: 3, rowStart: 8, rowEnd: 10, colorGroup: 4 },

          // 周五课程
          { name: '体育', info: '操场', teacher: '赵老师', day: 5, rowStart: 11, rowEnd: 14, colorGroup: 5 }
        ]
      },

      // 第二周
      {
        weekNum: 2,
        month: 10,
        monthName: 'OCT',
        dates: [
          { day: '一', date: '13' },
          { day: '二', date: '14' },
          { day: '三', date: '15' },
          { day: '四', date: '16' },
          { day: '五', date: '17' },
          { day: '六', date: '18' },
          { day: '日', date: '19' }
        ],
        courses: [
          // 周一课程
          { name: '高等数学', info: '一教101', teacher: '李老师', day: 1, rowStart: 1, rowEnd: 3, colorGroup: 1 },
          { name: '线性代数', info: '一教105', teacher: '孙老师', day: 1, rowStart: 6, rowEnd: 8, colorGroup: 6 },

          // 周三课程
          { name: '计算机基础', info: '三教303', teacher: '刘老师', day: 3, rowStart: 3, rowEnd: 5, colorGroup: 3 },
          { name: '概率论', info: '二教208', teacher: '陈老师', day: 3, rowStart: 8, rowEnd: 10, colorGroup: 7 },

          // 周四课程
          { name: '大学英语', info: '三教301', teacher: '王老师', day: 4, rowStart: 1, rowEnd: 3, colorGroup: 4 },
          { name: '线性代数', info: '一教105', teacher: '孙老师', day: 4, rowStart: 6, rowEnd: 8, colorGroup: 6 },

          // 周六课程
          { name: '选修课', info: '四教402', teacher: '周老师', day: 6, rowStart: 1, rowEnd: 3, colorGroup: 8 }
        ]
      },

      // 第三周
      {
        weekNum: 3,
        month: 10,
        monthName: 'OCT',
        dates: [
          { day: '一', date: '20' },
          { day: '二', date: '21' },
          { day: '三', date: '22' },
          { day: '四', date: '23' },
          { day: '五', date: '24' },
          { day: '六', date: '25' },
          { day: '日', date: '26' }
        ],
        courses: [
          // 周二课程
          { name: '大学物理', info: '二教202', teacher: '张老师', day: 2, rowStart: 1, rowEnd: 3, colorGroup: 2 },
          { name: '数据结构', info: '三教310', teacher: '黄老师', day: 2, rowStart: 6, rowEnd: 8, colorGroup: 9 },

          // 周四课程
          { name: '操作系统', info: '四教408', teacher: '吴老师', day: 4, rowStart: 6, rowEnd: 8, colorGroup: 8 },
          { name: '大学英语', info: '三教301', teacher: '王老师', day: 4, rowStart: 8, rowEnd: 10, colorGroup: 4 },

          // 周五课程
          { name: '体育', info: '操场', teacher: '赵老师', day: 5, rowStart: 11, rowEnd: 14, colorGroup: 5 },
          { name: '概率论', info: '二教208', teacher: '陈老师', day: 5, rowStart: 3, rowEnd: 5, colorGroup: 7 },

          // 周日课程
          { name: '数据库', info: '一教112', teacher: '马老师', day: 7, rowStart: 1, rowEnd: 3, colorGroup: 10 }
        ]
      }
    ],

    _isMove: false,
    _isScrollMove: false,
    _isTouch: false,
    _isScroll: false,
    _scrollTimeout: 0,
    _changeModeTimeout: 0,
  },



  /**
   * 组件的方法列表
   */
  methods: {
    changeMoveMode() {
      if (this.data._isMove) {
        this.setData({
          scrollTop: this.data.scrollTop,
        })
        this.data._changeModeTimeout = setTimeout(() => {
          this.setData({
            moveMode: 'move'
          })
        }, 50)
      }
      else if (this.data._isScroll || this.data._isScrollMove) {
        clearTimeout(this.data._changeModeTimeout);
        this.setData({
          moveMode: 'scroll'
        })
      }
      else if (!(this.data.moveMode == 'scroll' && this.data._isTouch)) {
        this.setData({
          scrollTop: this.data.scrollTop,
        })
        this.data._changeModeTimeout = setTimeout(() => {
          this.setData({
            moveMode: 'still'
          })
        }, 50)
      };
    },

    onMoveStart() {
      if (!this.data._isMove) {
        this.data._isMove = true;
        this.changeMoveMode();
      }
    },

    onMoveEnd() {
      this.data._isMove = false;
      this.changeMoveMode();
    },

    onScrollMoveStart() {
      if (!this.data._isScrollMove) {
        this.data._isScrollMove = true;
        this.changeMoveMode();
      }
    },

    onScrollMoveEnd() {
      this.data._isScrollMove = false;
      this.changeMoveMode();
    },

    onScroll(e: WechatMiniprogram.ScrollViewScroll) {
      if (!this.data._isScroll) {
        this.data._isScroll = true;
        this.changeMoveMode();
      }

      clearTimeout(this.data._scrollTimeout);
      this.data.scrollTop = e.detail.scrollTop;
      this.data._scrollTimeout = setTimeout(() => {
        this.data._isScroll = false;
        this.changeMoveMode();
      }, 100);
    },

    onTouchStart() {
      this.data._isTouch = true;
    },

    onTouchEnd() {
      this.data._isTouch = false;
      this.changeMoveMode();
    },

    catchMove() {
      return true;
    },

    bindchange(e: WechatMiniprogram.SwiperChange) {
      this.triggerEvent('change', e.detail)
    }
  }
})