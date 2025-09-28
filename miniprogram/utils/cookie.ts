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
   * 解析 set-cookie 头部
   * 兼容标准分号分隔和非标准逗号分隔的 Cookie
   */
  setFromResponse(header: Record<string, any>, url: string): void {
    let setCookieHeaders = [];

    // 处理 set-cookie 头部，兼容数组和字符串形式
    if (Array.isArray(header['set-cookie'])) {
      setCookieHeaders = header['set-cookie'];
    } else if (header['set-cookie']) {
      setCookieHeaders = [header['set-cookie']];
    }

    // 处理可能用逗号分隔多个 Cookie 的情况
    const processedHeaders: string[] = [];
    setCookieHeaders.forEach(header => {
      // 分割逗号但保留 Cookie 属性中的逗号
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
   * 分割 Cookie 头部字符串为单个 Cookie 数组
   * 兼容分号(;)和逗号(,)两种分隔符，忽略引号内的分隔符
   * @param header - 需要分割的 Cookie 头部字符串
   * @returns 分割后的单个 Cookie 字符串数组
   */
  public splitCookieHeader(header: string): string[] {
    const cookies = [];
    let currentCookie = [];
    let inQuotes = false;

    for (let i = 0; i < header.length; i++) {
      const char = header[i];

      // 处理双引号内内容（引号内的分隔符不生效）
      if (char === '"') {
        inQuotes = !inQuotes;
        currentCookie.push(char);
        continue;
      }

      // 遇到分号或逗号且不在引号内时，分割为新 Cookie
      if ((char === ';' || char === ',') && !inQuotes) {
        cookies.push(currentCookie.join('').trim());
        currentCookie = [];
        continue;
      }

      currentCookie.push(char);
    }

    // 添加最后一个 Cookie
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

      // 处理值中包含等号的情况
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

      // 解析 Cookie 扩展属性
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

  /** 设置指定域名的 Cookie */
  setCookieByDomain(domain: string, cookieStr: string): void {
    this.cleanExpired();
    const cookie = this.parseCookie(cookieStr, `http://${domain}`);
    if (cookie) {
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
    // 匹配规则：目标域名是 Cookie 域名的后缀，或完全相等
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

  // 处理协议
  let protocol = match[1] || 'http:';
  if (!protocol.endsWith(':')) protocol += ':';

  // 移除可能的用户名密码前缀（如 user:pass@hostname）
  let hostname = match[2].split('@').pop() || '';

  // 处理路径
  let pathname = match[3] || '/';
  if (!pathname.startsWith('/')) pathname = `/${pathname}`;

  return { protocol, hostname, pathname };
}

// 创建 CookieStore 单例实例
const cookieStore = new CookieStore();

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
 * 获取指定 URL 对应的 cookies 操作实例
 * @param url - 目标 URL
 * @returns 按该 URL 域名操作 Cookie 的 cookies 实例
 * @throws 当无法从 URL 解析域名时抛出错误
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
 * 将 Cookie 字符串转为键值对对象
 * @param cookieStr - 原始 Cookie 字符串（多个 Cookie 用 ; 分隔）
 * @returns 解析后的 Cookie 键值对对象
 */
export function cookieStrToObj(cookieStr: string): { [key: string]: string } {
  const cookieObj: { [key: string]: string } = {};
  if (!cookieStr?.trim()) return cookieObj;

  // 分割并过滤有效 Cookie 键值对
  const validPairs = cookieStore.splitCookieHeader(cookieStr)
    .filter(pair => pair?.trim())
    .map(pair => pair.trim());

  // 解析键值对并存储
  validPairs.forEach(pair => {
    const equalIndex = pair.indexOf('=');
    if (equalIndex <= 0) return;

    const key = pair.slice(0, equalIndex).trim();
    const value = pair.slice(equalIndex + 1).trim();
    if (key) cookieObj[key] = value;
  });

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

/** 请求配置接口 */
export interface CookieRequestOption<T> {
  /** 请求 url */
  url: string;
  /** 请求 header */
  header?: WechatMiniprogram.IAnyObject;
  /** 请求成功的回调函数 */
  success?: (res: T) => void;
  /** 请求失败的回调函数 */
  fail?: (res: WechatMiniprogram.GeneralCallbackResult) => void;
  /** 请求完成的回调函数 */
  complete?: (res: any) => void;
}

/** 响应接口 */
export interface CookieResponseResult {
  /** 响应 header */
  header: Record<string, any>;
  /** 错误信息 */
  errMsg?: string
}

/**
 * 请求函数包装器，为请求函数添加 Cookie 自动管理能力
 * @template TOption - 请求配置的类型，要求至少包含 `url`, `header`, `success`, `fail`, `complete`属性
 * @template TResult - 请求成功回调函数的传入参数类型，要求至少包含 `header`属性
 * @param requestFunc - 原始请求函数（如 wx.request）
 * @returns 带 Cookie 管理的新请求函数
 */
export function withCookie<TOption extends CookieRequestOption<TResult>, TResult extends CookieResponseResult>(
  requestFunc: (options: TOption) => any
) {
  return function wrappedRequest(options: TOption): any {
    const { url, header = {}, success, fail, complete, ...restOptions } = options;

    // 校验核心属性（url 必须存在）
    if (!url) {
      const errMsg = 'request: fail url is required';
      fail?.({ errMsg });
      complete?.({ errMsg });
      return typeof requestFunc({} as TOption) === 'object'
        ? { abort: () => { } } as WechatMiniprogram.RequestTask
        : undefined;
    }

    // 请求前注入 Cookie
    const requestCookies = cookieStore.getForRequest(url);
    const injectedHeader = {
      ...header,
      ...(requestCookies ? { Cookie: requestCookies } : {})
    };

    // 响应后解析 set-cookie
    const wrappedSuccess = (res: TResult) => {
      cookieStore.setFromResponse(res.header, url);
      // 调用原始 success 回调
      success?.(res);
    };

    // 调用原始请求函数
    return requestFunc({
      ...restOptions,
      url,
      header: injectedHeader,
      success: wrappedSuccess,
    } as TOption);
  };
}
