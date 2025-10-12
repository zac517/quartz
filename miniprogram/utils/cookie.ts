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
  private static instance: CookieStore; // 静态实例存储
  private cookies: Cookie[] = [];
  private readonly STORAGE_KEY = '__miniprogram_cookies__';

  // 私有构造函数
  private constructor() {
    this.loadFromStorage();
    this.cleanExpired(); // 初始化时清理过期 Cookie
  }

  // 获取唯一单例实例
  public static getInstance(): CookieStore {
    if (!CookieStore.instance) {
      CookieStore.instance = new CookieStore();
    }
    return CookieStore.instance;
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
    let setCookieHeaders: string[] = [];

    // 处理 set-cookie 头部，兼容数组和字符串形式
    if (Array.isArray(header['set-cookie'])) {
      setCookieHeaders = header['set-cookie'];
    } else if (header['set-cookie']) {
      setCookieHeaders = [header['set-cookie']];
    }

    // 处理可能用逗号分隔多个 Cookie 的情况
    const processedHeaders: string[] = [];
    setCookieHeaders.forEach(header => {
      const cookies = this.splitCookieHeader(header);
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
   */
  public splitCookieHeader(header: string): string[] {
    const cookies = [];
    let currentCookie = [];
    let inQuotes = false;

    for (let i = 0; i < header.length; i++) {
      const char = header[i];

      if (char === '"') {
        inQuotes = !inQuotes;
        currentCookie.push(char);
        continue;
      }

      if ((char === ';' || char === ',') && !inQuotes) {
        cookies.push(currentCookie.join('').trim());
        currentCookie = [];
        continue;
      }

      currentCookie.push(char);
    }

    if (currentCookie.length > 0) {
      cookies.push(currentCookie.join('').trim());
    }

    return cookies;
  }

  /** 解析 Cookie 字符串 */
  private parseCookie(cookieStr: string, url: string): Cookie | null {
    try {
      // 捕获 parseUrl 可能抛出的错误
      const { hostname } = parseUrl(url);
      const parts = cookieStr.split(';').map(p => p.trim());
      const [nameValue] = parts;
      if (!nameValue) return null;

      // 处理值中包含等号的情况
      const [name, ...valueParts] = nameValue.split('=');
      const value = valueParts.join('=').replace(/^"/, '').replace(/"$/, '');

      const cookie: Cookie = {
        name,
        value,
        domain: hostname,
        path: '/',
        httpOnly: false,
        secure: false
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
            if (val) {
              const rawDate = val.replace(/^"/, '').replace(/"$/, '');
              const expiresDate = new Date(rawDate);
              // 校验日期是否有效（排除 Invalid Date）
              cookie.expires = !isNaN(expiresDate.getTime()) ? expiresDate : undefined;
            }
            break;
          case 'max-age':
            if (val) {
              const maxAgeSec = parseInt(val, 10);
              // 校验 max-age 是否为有效数字（排除 NaN、负数）
              if (!isNaN(maxAgeSec) && maxAgeSec >= 0) {
                cookie.expires = new Date(Date.now() + maxAgeSec * 1000);
              }
            }
            break;
          case 'httponly':
            cookie.httpOnly = true;
            break;
          case 'secure':
            cookie.secure = true;
            break;
        }
      });

      return cookie;
    } catch (e) {
      console.error('Failed to parse cookie:', e, 'Cookie string:', cookieStr, 'Url:', url);
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
    return normalizedTarget.endsWith(normalizedCookie) || normalizedTarget === normalizedCookie;
  }

  /** 获取请求对应的 Cookie */
  getForRequest(url: string): string {
    try {
      this.cleanExpired();
      const { protocol, hostname, pathname } = parseUrl(url);
      return this.cookies
        .filter(c => {
          if (c.expires && c.expires <= new Date()) return false;
          if (c.secure && protocol !== 'https:') return false;
          if (!this.isDomainMatch(c.domain, hostname)) return false;
          if (!pathname.startsWith(c.path)) return false;
          return true;
        })
        .map(c => `${c.name}=${c.value}`)
        .join('; ');
    } catch (e) {
      console.error('Failed to get cookies for request:', e, 'Url:', url);
      return '';
    }
  }

  /** 清空所有 Cookie */
  public clearAllCookies(): void {
    this.cookies = [];
    this.saveToStorage();
  }

  /** 清理指定域名的 Cookie */
  public clearCookiesByDomain(domain: string): void {
    this.cookies = this.cookies.filter(c => !this.isDomainMatch(c.domain, domain));
    this.saveToStorage();
  }
}

/** 
 * 解析 URL（提取协议、主机名、路径）
 * @throws {Error} 当URL格式无效或无法解析主机名时抛出错误
 */
function parseUrl(url: string): { protocol: string; hostname: string; pathname: string } {
  const urlRegex = /^([a-zA-Z][a-zA-Z0-9+.-]*:)?\/{0,2}([^/?#]+)?([^?#]*)?/;
  const match = url.match(urlRegex);

  if (!match) throw new Error(`Invalid URL format: ${url}`);
  if (!match[2]) throw new Error(`Failed to resolve hostname from url: ${url}`);

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

// 创建 CookieStore 单例实例（通过静态方法获取）
const cookieStore = CookieStore.getInstance();

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
 */
export function getCookies(url: string): cookies {
  try {
    const { hostname } = parseUrl(url);
    return new cookies(hostname);
  } catch (e) {
    throw new Error(`Failed to resolve domain from url: ${url}`);
  }
}

/**
 * 将 Cookie 字符串转为键值对对象
 */
export function cookieStrToObj(cookieStr: string): { [key: string]: string } {
  const cookieObj: { [key: string]: string } = {};
  if (!cookieStr?.trim()) return cookieObj;

  const validPairs = cookieStore.splitCookieHeader(cookieStr)
    .filter(pair => pair?.trim())
    .map(pair => pair.trim());

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
interface CookieRequestOption<T> {
  url: string;
  header?: Record<string, any>;
  success?: (res: T) => void;
  fail?: (res: any) => void;
  complete?: (res: any) => void;
}

/** 请求结果接口 */
interface CookieRequestResult {
  header: Record<string, any>;
}

/**
 * 请求函数包装器，为请求函数添加 Cookie 自动管理能力
 */
export function withCookie<
  TResult extends CookieRequestResult,
  TOption extends CookieRequestOption<TResult>,
  TReturn = void
>(
  requestFunc: (option: TOption) => TReturn
) {
  return function wrappedRequest(option: TOption): TReturn | void {
    const { url, header = {}, success, fail, complete } = option;

    // 校验核心属性
    if (!url) {
      const errMsg = 'cookie: fail url is required';
      fail?.({ errMsg });
      complete?.({ errMsg });
      return;
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
      success?.(res);
    };

    // 调用原始请求函数
    return requestFunc({
      ...option,
      header: injectedHeader,
      success: wrappedSuccess,
    });
  };
}