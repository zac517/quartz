class StorageItem<T = any> {
  private key: string;

  /**
   * 构造函数
   * @param key 本地存储键名
   * @param defaultValue 默认值（当存储中无数据时返回）
   */
  constructor(key: string, private defaultValue?: T) {
    this.key = key;
  }

  /**
   * 读取存储的值
   * @returns 解析后的值（类型为T）
   */
  get value(): T {
    try {
      const storedValue = wx.getStorageSync(this.key);
      
      if (storedValue === undefined || storedValue === null) {
        return this.defaultValue as T;
      }

      // 尝试解析JSON（处理对象/数组类型）
      if (typeof storedValue === 'string') {
        try {
          return JSON.parse(storedValue) as T;
        } catch {
          // 解析失败说明是原始字符串，直接返回
          return storedValue as unknown as T;
        }
      }

      // 非字符串类型直接返回（如number、boolean）
      return storedValue as T;
    } catch (error) {
      console.error(`[StorageItem] 读取失败 (key: ${this.key})`, error);
      return this.defaultValue as T;
    }
  }

  /**
   * 写入值到存储
   * @param value 要存储的值
   */
  set value(value: T) {
    try {
      // 处理 null / undefined
      if (value === null || value === undefined) {
        wx.removeStorageSync(this.key);
        return;
      }

      // 序列化对象 / 数组为 JSON 字符串
      const valueToStore = typeof value === 'string' 
        ? value 
        : JSON.stringify(value);

      wx.setStorageSync(this.key, valueToStore);
    } catch (error) {
      console.error(`[StorageItem] 写入失败 (key: ${this.key})`, error);
      wx.showToast({ title: '数据存储失败', icon: 'none', duration: 2000 });
    }
  }

  /**
   * 清除当前键的存储
   */
  clear(): void {
    try {
      wx.removeStorageSync(this.key);
    } catch (error) {
      console.error(`[StorageItem] 清除失败 (key: ${this.key})`, error);
    }
  }
}

export default StorageItem;