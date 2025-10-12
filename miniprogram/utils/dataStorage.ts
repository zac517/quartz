/**
 * 本地存储项工具类
 */
class Storage<T = any> {
  private key: string;

  /**
   * 构造函数
   * @param key 本地存储键名
   */
  constructor(key: string) {
    this.key = key;
  }

  /**
   * 从本地存储读取值（同步）
   * @returns 解析后的值或默认值
   */
  get value(): T | void {
    try {
      const storedValue = wx.getStorageSync(this.key);
      
      if (storedValue === undefined || storedValue === null) {
        return undefined;
      }

      // 尝试解析JSON
      if (typeof storedValue === 'string') {
        try {
          return JSON.parse(storedValue);
        } catch {}
      }

      // 非字符串类型直接返回
      return storedValue;
    } catch (error) {
      console.error(`[StorageItem] 同步读取失败 (key: ${this.key})`, error);
      throw error;
    }
  }

  /**
   * 写入值到本地存储（同步）
   * @param value 要存储的值
   */
  set value(value: T | void) {
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
      console.error(`[StorageItem] 同步写入失败 (key: ${this.key})`, error);
      throw error;
    }
  }

  /**
   * 从本地存储读取值（异步）
   * @returns Promise<T> 解析后的值或默认值
   */
  async getValueAsync(): Promise<T | void> {
    try {
      const res = await wx.getStorage({ key: this.key });
      const storedValue = res.data;
      
      if (storedValue === undefined || storedValue === null) {
        return undefined;
      }

      if (typeof storedValue === 'string') {
        try {
          return JSON.parse(storedValue);
        } catch {}
      }

      return storedValue;
    } catch (error) {
      console.error(`[StorageItem] 异步读取失败 (key: ${this.key})`, error);
      throw error;
    }
  }

  /**
   * 写入值到本地存储（异步）
   * @param value 要存储的值
   * @returns Promise<void>
   */
  async setValueAsync(value: T): Promise<void> {
    try {
      if (value === null || value === undefined) {
        await wx.removeStorage({ key: this.key });
        return;
      }

      const valueToStore = typeof value === 'string' 
        ? value 
        : JSON.stringify(value);

      await wx.setStorage({ key: this.key, data: valueToStore });
    } catch (error) {
      console.error(`[StorageItem] 异步写入失败 (key: ${this.key})`, error);
      throw error;
    }
  }

  /**
   * 清除当前键的存储（同步）
   */
  clear(): void {
    try {
      wx.removeStorageSync(this.key);
    } catch (error) {
      console.error(`[StorageItem] 同步清除失败 (key: ${this.key})`, error);
      throw error;
    }
  }

  /**
   * 清除当前键的存储（异步）
   * @returns Promise<void>
   */
  async clearAsync(): Promise<void> {
    try {
      await wx.removeStorage({ key: this.key });
    } catch (error) {
      console.error(`[StorageItem] 异步清除失败 (key: ${this.key})`, error);
      throw error;
    }
  }
}

export default Storage;
