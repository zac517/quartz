// 类型定义
interface TimeSlot {
  timeStart: string;
  timeEnd: string;
}

interface TimeSlots {
  morning: TimeSlot[];
  afternoon: TimeSlot[];
  evening: TimeSlot[];
}

interface DateItem {
  day: string;
  date: string;
}

interface Course {
  name: string;
  info: string;
  teacher: string;
  day: number;
  rowStart: number;
  rowEnd: number;
  bgColor: number;
}

interface Week {
  weekNum: number;
  month: number;
  monthName: string;
  dates: DateItem[];
  courses: Course[];
}

Component({
  options: {
    pureDataPattern: /^_/,
    virtualHost: true
  },

  properties: {
    current: {
      type: Number,
      value: 0
    },
    weeks: {
      type: Array,
      value: [] as Week[]
    },
    colors: {
      type: Array,
      value: [] as string[]
    },
    timeSlots: {
      type: Object,
      value: {} as any
    }
  },

  data: {
    scrollTop: 0,
    isScroll: false,
  },

  methods: {
    /**
     * 阻止事件冒泡，防止滚动时触发 swiper 切换
     */
    catchMove() {
      return true;
    },

    /**
     * Swiper change 事件处理（5页模式）
     * 更新虚拟索引和displayWeeks数据
     */
    onSwiperChange(e: WechatMiniprogram.SwiperChange) {
      // 触发外部的 change 事件
      this.triggerEvent('change', e.detail);
    }
  }
})