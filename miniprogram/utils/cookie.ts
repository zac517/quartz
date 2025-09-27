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
    console.log(processedHeaders)

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
   * 修复了逗号后字符被误删除的问题
   */
  private splitCookieHeader(header: string): string[] {
    const cookies = [];
    let currentCookie = [];
    let inQuotes = false;

    // 按字符遍历，智能分割
    for (let i = 0; i < header.length; i++) {
      const char = header[i];
      
      // 检测引号状态
      if (char === '"') {
        inQuotes = !inQuotes;
        currentCookie.push(char);
        continue;
      }
      
      // 检测逗号作为Cookie分隔符（不在引号内且后面有空格）
      if (char === ',' && !inQuotes) {
        // 检查下一个字符是否是空格（Cookie分隔符通常是 ", "）
        const nextChar = i + 1 < header.length ? header[i + 1] : '';
        
        // 确定是Cookie分隔符
        cookies.push(currentCookie.join('').trim());
        currentCookie = [];
        
        // 仅跳过逗号本身，不跳过后续字符（修复误删问题）
        continue;
      }
      
      currentCookie.push(char);
    }
    
    // 添加最后一个Cookie
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

      // 解析 Cookie 属性
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
    const cookie = this.parseCookieForDomain(cookieStr, domain);
    if (cookie) {
      // 替换旧 Cookie
      this.cookies = this.cookies.filter(c =>
        !(c.name === cookie.name && c.domain === cookie.domain && c.path === cookie.path)
      );
      this.cookies.push(cookie);
      this.saveToStorage();
    }
  }

  /** 为指定域名解析手动设置的 Cookie */
  private parseCookieForDomain(cookieStr: string, domain: string): Cookie | null {
    return this.parseCookie(cookieStr, `http://${domain}`);
  }

  /** 检查域名匹配 */
  private isDomainMatch(cookieDomain: string, targetDomain: string): boolean {
    const normalizedCookie = cookieDomain.startsWith('.') ? cookieDomain.slice(1) : cookieDomain;
    const normalizedTarget = targetDomain.startsWith('.') ? targetDomain.slice(1) : targetDomain;
    return normalizedTarget.endsWith(normalizedCookie) || normalizedTarget === normalizedCookie;
  }

  /** 获取请求对应的 Cookie */
  getForRequest(url: string): string {
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
  }
}

/** 
 * 解析 URL
 */
function parseUrl(url: string): { protocol: string; hostname: string; pathname: string } {
  const urlRegex = /^([a-zA-Z][a-zA-Z0-9+.-]*:)?\/{0,2}([^/?#]+)?([^?#]*)?/;
  const match = url.match(urlRegex);

  if (!match) throw new Error('Invalid URL format');
  if (!match[2]) throw new Error('Failed to resolve hostname');

  // 协议：默认 http:
  let protocol = match[1] || 'http:';
  if (!protocol.endsWith(':')) protocol += ':';

  // 主机名：移除用户名密码前缀
  let hostname = match[2].split('@').pop() || '';

  // 路径：默认 /
  let pathname = match[3] || '/';
  if (!pathname.startsWith('/')) pathname = `/${pathname}`;

  return { protocol, hostname, pathname };
}

// 创建 CookieStore 实例
const cookieStore = new CookieStore();

// 保存原生 wx.request 引用
const originalWxRequest = wx.request;

// 重写 wx.request
wx.request = function <
  T extends string | Record<string, any> | ArrayBuffer
>(option: WechatMiniprogram.RequestOption<T>): WechatMiniprogram.RequestTask {
  const { url, header = {}, success, ...rest } = option;

  if (!url) {
    const errMsg = 'request: fail url is required';
    option.fail?.({ errMsg });
    option.complete?.({ errMsg });
    return { abort: () => {} } as WechatMiniprogram.RequestTask;
  }

  // 构建请求头，自动添加 Cookie
  const requestCookies = cookieStore.getForRequest(url);
  const requestHeader = {
    ...header,
    ...(requestCookies ? { Cookie: requestCookies } : {})
  };

  const handleSuccess = (res: WechatMiniprogram.RequestSuccessCallbackResult<T>) => {
    cookieStore.setFromResponse(res.header, url);
    success?.call(this, res);
  };

  return originalWxRequest.call(wx, {
    ...rest,
    url,
    header: requestHeader,
    success: handleSuccess as WechatMiniprogram.RequestSuccessCallback,
    fail: option.fail,
    complete: option.complete
  });
};

interface BrowserLikeSite {
  cookie: string;
}

class SiteImpl implements BrowserLikeSite {
  private domain: string;

  constructor(domain: string) {
    this.domain = domain;
  }

  get cookie(): string {
    return cookieStore.getCookiesByDomain(this.domain);
  }

  set cookie(value: string) {
    cookieStore.setCookieByDomain(this.domain, value);
  }
}

/**
 * 获取指定 url 对应的 cookie
 * @param url 
 */
export function cookies(url: string): BrowserLikeSite {
  try {
    const { hostname } = parseUrl(url);
    return new SiteImpl(hostname);
  } catch (e) {
    throw new Error('Failed to resolve domain from url');
  }
}

/**
 * 从 Cookie 字符串中提取指定键的值
 * @param cookieStr - 完整的 Cookie 字符串
 * @param key - 要提取的 Cookie 键名
 * @returns 对应的值
 */
export function getCookieValueFromStr(cookieStr: string, key: string): string | null {
  // 同时支持分号和逗号分隔的Cookie
  const separators = /[,;]\s*/;
  const cookiePairs = cookieStr.split(separators);
  
  for (const pair of cookiePairs) {
    const [cookieKey, ...cookieValueParts] = pair.split('=');
    if (cookieKey.trim() === key) {
      return cookieValueParts.join('=') || '';
    }
  }
  
  return null;
}
    