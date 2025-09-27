/**
 * Cookie 接口定义
 */
interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: Date;
  httpOnly: boolean;
  secure: boolean;
}

/**
 * Cookie 管理器
 */
class CookieStore {
  private cookies: Cookie[] = [];
  private readonly STORAGE_KEY = '__miniprogram_cookies__';

  constructor() {
    this.loadFromStorage();
    this.cleanExpired(); // 初始化时清理过期 Cookie
  }

  /** 从本地加载 Cookie */
  private loadFromStorage(): void {
    try {
      const stored = wx.getStorageSync(this.STORAGE_KEY);
      if (stored) {
        this.cookies = JSON.parse(stored, (key, value) => {
          if (key === 'expires' && value) return new Date(value);
          return value;
        });
      }
    } catch (e) {
      console.error('Failed to load cookies from storage:', e);
    }
  }

  /** 保存 Cookie 到本地存储 */
  private saveToStorage(): void {
    try {
      wx.setStorageSync(this.STORAGE_KEY, JSON.stringify(this.cookies));
    } catch (e) {
      console.error('Failed to save cookies to storage:', e);
    }
  }

  /** 清理过期 Cookie */
  private cleanExpired(): void {
    const now = new Date();
    this.cookies = this.cookies.filter(c => !c.expires || c.expires > now);
  }

  /** 
   * 解析 Set-Cookie 头部
   * 兼容标准分号分隔和非标准逗号分隔的Cookie
   */
  setFromResponse(header: Record<string, any>, url: string): void {
    let setCookieHeaders = [];
    
    // 处理Set-Cookie头部，兼容数组和字符串形式
    if (Array.isArray(header['Set-Cookie'])) {
      setCookieHeaders = header['Set-Cookie'];
    } else if (header['Set-Cookie']) {
      setCookieHeaders = [header['Set-Cookie']];
    }

    // 处理可能用逗号分隔多个Cookie的情况
    const processedHeaders: string[] = [];
    setCookieHeaders.forEach(header => {
      // 分割逗号但保留Cookie属性中的逗号（如expires日期中的逗号）
      const cookies = this.splitCookieHeader(header as string);
      processedHeaders.push(...cookies);
    });

    processedHeaders.forEach(cookieStr => {
      const cookie = this.parseCookie(cookieStr, url);
      if (cookie) {
        // 替换同名同域同路径的旧 Cookie
        this.cookies = this.cookies.filter(c =>
          !(c.name === cookie.name && c.domain === cookie.domain && c.path === cookie.path)
        );
        this.cookies.push(cookie);
      }
    });

    this.cleanExpired();
    this.saveToStorage();
  }

  /**
   * 分割可能用逗号分隔多个Cookie的头部字符串
   * 修复了逗号后字符被误删除的问题，支持复用
   * @param header - 需要分割的Cookie头部字符串
   * @returns 分割后的单个Cookie字符串数组
   */
  public splitCookieHeader(header: string): string[] {
    const cookies = [];
    let currentCookie = [];
    let inQuotes = false;

    // 按字符遍历，智能分割（区分分隔符逗号和属性内逗号）
    for (let i = 0; i < header.length; i++) {
      const char = header[i];
      
      // 检测引号状态（引号内的逗号不视为分隔符）
      if (char === '"') {
        inQuotes = !inQuotes;
        currentCookie.push(char);
        continue;
      }
      
      // 检测逗号作为Cookie分隔符（不在引号内且后面有空格）
      if (char === ',' && !inQuotes) {
        const nextChar = i + 1 < header.length ? header[i + 1] : '';
        
        // 确定是Cookie分隔符，保存当前Cookie并重置
        cookies.push(currentCookie.join('').trim());
        currentCookie = [];
        
        // 仅跳过逗号本身，不跳过后续字符（修复误删问题）
        continue;
      }
      
      currentCookie.push(char);
    }
    
    // 添加最后一个Cookie（避免遗漏）
    if (currentCookie.length > 0) {
      cookies.push(currentCookie.join('').trim());
    }
    
    return cookies;
  }

  /** 解析 Cookie 字符串 */
  private parseCookie(cookieStr: string, url: string): Cookie | null {
    const { hostname } = parseUrl(url);
    try {
      const parts = cookieStr.split(';').map(p => p.trim());
      const [nameValue] = parts;
      if (!nameValue) return null;

      // 处理值中包含等号的情况（如 value=abc=123）
      const [name, ...valueParts] = nameValue.split('=');
      const value = valueParts.join('=').replace(/^"/, '').replace(/"$/, ''); // 移除可能的引号

      const cookie: Partial<Cookie> = {
        name,
        value,
        domain: hostname, // 默认绑定请求域名
        path: '/',        // 默认路径为根路径
        httpOnly: false,  // 默认非 HttpOnly
        secure: false     // 默认非 Secure
      };

      // 解析 Cookie 扩展属性（domain/path/expires等）
      parts.slice(1).forEach(part => {
        const [key, val] = part.split('=').map(p => p.toLowerCase());
        switch (key) {
          case 'domain':
            cookie.domain = val ? val.replace(/^"/, '').replace(/"$/, '') : hostname;
            break;
          case 'path':
            cookie.path = val ? val.replace(/^"/, '').replace(/"$/, '') : '/';
            break;
          case 'expires':
            cookie.expires = val ? new Date(val.replace(/^"/, '').replace(/"$/, '')) : undefined;
            break;
          case 'max-age':
            if (val) cookie.expires = new Date(Date.now() + parseInt(val, 10) * 1000);
            break;
          case 'httponly':
            cookie.httpOnly = true;
            break;
          case 'secure':
            cookie.secure = true;
            break;
        }
      });

      return cookie as Cookie;
    } catch (e) {
      console.error('Failed to parse cookie:', e, 'Cookie string:', cookieStr);
      return null;
    }
  }

  /** 获取指定域名的非 HttpOnly Cookie */
  getCookiesByDomain(domain: string): string {
    this.cleanExpired();
    return this.cookies
      .filter(c => !c.httpOnly && this.isDomainMatch(c.domain, domain))
      .map(c => `${c.name}=${c.value}`)
      .join('; ');
  }

  /** 设置指定域名的 Cookie（删除原 parseCookieForDomain 调用，直接调用 parseCookie） */
  setCookieByDomain(domain: string, cookieStr: string): void {
    this.cleanExpired();
    // 直接拼接 http 协议的 URL 传给 parseCookie，替代原 parseCookieForDomain 方法
    const cookie = this.parseCookie(cookieStr, `http://${domain}`);
    if (cookie) {
      // 替换旧 Cookie（同名同域同路径）
      this.cookies = this.cookies.filter(c =>
        !(c.name === cookie.name && c.domain === cookie.domain && c.path === cookie.path)
      );
      this.cookies.push(cookie);
      this.saveToStorage();
    }
  }

  /** 检查域名匹配（支持子域名匹配） */
  private isDomainMatch(cookieDomain: string, targetDomain: string): boolean {
    const normalizedCookie = cookieDomain.startsWith('.') ? cookieDomain.slice(1) : cookieDomain;
    const normalizedTarget = targetDomain.startsWith('.') ? targetDomain.slice(1) : targetDomain;
    // 匹配规则：目标域名是Cookie域名的后缀，或完全相等
    return normalizedTarget.endsWith(normalizedCookie) || normalizedTarget === normalizedCookie;
  }

  /** 获取请求对应的 Cookie（自动匹配协议、域名、路径） */
  getForRequest(url: string): string {
    this.cleanExpired();
    const { protocol, hostname, pathname } = parseUrl(url);
    return this.cookies
      .filter(c => {
        // 过滤条件：未过期 + 协议匹配（secure仅HTTPS） + 域名匹配 + 路径匹配
        if (c.expires && c.expires <= new Date()) return false;
        if (c.secure && protocol !== 'https:') return false;
        if (!this.isDomainMatch(c.domain, hostname)) return false;
        if (!pathname.startsWith(c.path)) return false;
        return true;
      })
      .map(c => `${c.name}=${c.value}`)
      .join('; ');
  }
}

/** 
 * 解析 URL（提取协议、主机名、路径）
 * @param url - 待解析的URL字符串
 * @returns 包含协议、主机名、路径的对象
 * @throws {Error} 当URL格式无效或无法解析主机名时抛出错误
 */
function parseUrl(url: string): { protocol: string; hostname: string; pathname: string } {
  const urlRegex = /^([a-zA-Z][a-zA-Z0-9+.-]*:)?\/{0,2}([^/?#]+)?([^?#]*)?/;
  const match = url.match(urlRegex);

  if (!match) throw new Error('Invalid URL format');
  if (!match[2]) throw new Error('Failed to resolve hostname');

  // 处理协议：默认http，确保结尾带冒号
  let protocol = match[1] || 'http:';
  if (!protocol.endsWith(':')) protocol += ':';

  // 处理主机名：移除可能的用户名密码前缀（如 user:pass@hostname）
  let hostname = match[2].split('@').pop() || '';

  // 处理路径：默认根路径，确保以/开头
  let pathname = match[3] || '/';
  if (!pathname.startsWith('/')) pathname = `/${pathname}`;

  return { protocol, hostname, pathname };
}

// 创建 CookieStore 单例实例
const cookieStore = new CookieStore();

// 保存原生 wx.request 引用
const originalWxRequest = wx.request;

// 重写 wx.request
wx.request = function <
  T extends string | Record<string, any> | ArrayBuffer
>(option: WechatMiniprogram.RequestOption<T>): WechatMiniprogram.RequestTask {
  const { url, header = {}, success, ...rest } = option;

  // 校验 URL 必填
  if (!url) {
    const errMsg = 'request: fail url is required';
    option.fail?.({ errMsg });
    option.complete?.({ errMsg });
    return { abort: () => {} } as WechatMiniprogram.RequestTask;
  }

  // 构建请求头，自动添加匹配的 Cookie
  const requestCookies = cookieStore.getForRequest(url);
  const requestHeader = {
    ...header,
    ...(requestCookies ? { Cookie: requestCookies } : {})
  };

  // 处理响应，自动解析 Set-Cookie 并更新存储
  const handleSuccess = (res: WechatMiniprogram.RequestSuccessCallbackResult<T>) => {
    cookieStore.setFromResponse(res.header, url);
    success?.call(this, res);
  };

  // 调用原生请求方法并返回任务对象
  return originalWxRequest.call(wx, {
    ...rest,
    url,
    header: requestHeader,
    success: handleSuccess as WechatMiniprogram.RequestSuccessCallback,
    fail: option.fail,
    complete: option.complete
  });
};

/**
 * 按域名操作 Cookie 的便捷类
 */
class cookies {
  private domain: string;

  constructor(domain: string) {
    this.domain = domain;
  }

  /**
   * 通过赋值和读取此值设置/获取指定域的非 HttpOnly Cookie
   * - 读取：返回该域名下所有非 HttpOnly Cookie 的字符串（格式：name1=value1; name2=value2）
   * - 赋值：传入 Cookie 字符串（支持单个或多个，如 "name=value; domain=xxx"）更新存储
   */
  get cookie(): string {
    return cookieStore.getCookiesByDomain(this.domain);
  }

  set cookie(value: string) {
    cookieStore.setCookieByDomain(this.domain, value);
  }
}

/**
 * 获取指定URL对应的cookies操作实例
 * @param url - 目标URL
 * @returns 按该URL域名操作Cookie的cookies实例
 * @throws {Error} 当无法从URL解析域名时抛出错误
 */
export function getCookies(url: string): cookies {
  try {
    const { hostname } = parseUrl(url);
    return new cookies(hostname);
  } catch (e) {
    throw new Error('Failed to resolve domain from url');
  }
}

/**
 * 将 Cookie 字符串解析为对象
 * 支持逗号和分号分隔的 Cookie 格式，正确处理值中包含逗号或分号的情况
 * @param cookieStr - 完整的 Cookie 字符串
 * @returns 解析后的 Cookie 对象 { [key: string]: string }
 */
export function cookieStrToObj(cookieStr: string): { [key: string]: string } {
  const cookieObj: { [key: string]: string } = {};
  if (!cookieStr.trim()) return cookieObj;

  // 复用 CookieStore 的 splitCookieHeader 逻辑来正确分割 Cookie
  const cookiePairs = cookieStore.splitCookieHeader(cookieStr);

  for (const pair of cookiePairs) {
    // 处理键值对（支持值中包含等号）
    const [cookieKey, ...cookieValueParts] = pair.split('=');
    if (!cookieKey) continue;

    // 清理键的前后空格
    const key = cookieKey.trim();
    // 连接值的各个部分（处理值中包含等号的情况）
    const value = cookieValueParts.join('=').trim();

    cookieObj[key] = value;
  }

  return cookieObj;
}

/**
 * 将 Cookie 对象转换为标准 Cookie 字符串
 * 使用分号分隔各个键值对，符合 Cookie 标准格式
 * @param cookieObj - 要转换的 Cookie 对象
 * @returns 转换后的 Cookie 字符串
 */
export function cookieObjToStr(cookieObj: { [key: string]: string }): string {
  return Object.entries(cookieObj)
    .map(([key, value]) => {
      // 对值进行简单转义，避免包含分号等特殊字符
      const escapedValue = String(value).replace(/;/g, encodeURIComponent);
      return `${key}=${escapedValue}`;
    })
    .join('; ');
}
