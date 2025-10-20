/**
 * Cookie 接口定义
 */
interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: Date;
  secure: boolean;
}

/**
 * 独立工具函数
 */
function parseUrl(url: string): { protocol: string; hostname: string; pathname: string } {
  const urlRegex = /^([a-zA-Z][a-zA-Z0-9+.-]*:)?\/{0,2}([^/?#]+)?([^?#]*)?/;
  const match = url.match(urlRegex);

  if (!match || !match[2]) throw new Error(`Invalid URL: ${url}`);

  let protocol = match[1] || 'http:';
  if (!protocol.endsWith(':')) protocol += ':';

  const hostname = match[2].split('@').pop() || '';
  const pathname = match[3] || '/';

  return { protocol, hostname, pathname };
}

export function cookieStrToObj(cookieStr: string): { [key: string]: string } {
  const obj: { [key: string]: string } = {};
  if (!cookieStr.trim()) return obj;

  splitByTopLevelSeparator(cookieStr, ';').forEach(pair => {
    const trimmed = pair.trim();
    if (!trimmed) return;

    const equalIndex = trimmed.indexOf('=');
    if (equalIndex <= 0) return;

    const key = trimmed.slice(0, equalIndex).trim();
    const value = trimmed.slice(equalIndex + 1).trim();
    obj[key] = value;
  });

  return obj;
}

function splitByTopLevelSeparator(str: string, separator: string): string[] {
  const result = [];
  let current = [];
  let inQuotes = false;

  for (const char of str) {
    if (char === '"') {
      inQuotes = !inQuotes;
      current.push(char);
      continue;
    }
    if (char === separator && !inQuotes) {
      result.push(current.join('').trim());
      current = [];
      continue;
    }
    current.push(char);
  }

  if (current.length > 0) result.push(current.join('').trim());
  return result;
}

function inferDefaultPath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  const lastSlashIndex = pathname.lastIndexOf('/');
  return lastSlashIndex === 0 ? '/' : pathname.slice(0, lastSlashIndex + 1);
}

/**
 * Cookie 管理器（单例）
 */
class CookieStore {
  private static instance: CookieStore;
  private cookies: Cookie[] = [];
  private readonly STORAGE_KEY = '__miniprogram_cookies__';

  private constructor() {
    this.loadFromStorage();
    this.cleanExpired();
  }

  public static getInstance(): CookieStore {
    if (!CookieStore.instance) {
      CookieStore.instance = new CookieStore();
    }
    return CookieStore.instance;
  }

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

  private saveToStorage(): void {
    try {
      wx.setStorageSync(this.STORAGE_KEY, JSON.stringify(this.cookies));
    } catch (e) {
      console.error('Failed to save cookies to storage:', e);
    }
  }

  private cleanExpired(): void {
    const now = new Date();
    this.cookies = this.cookies.filter(c => !c.expires || c.expires > now);
  }

  public setFromResponse(header: Record<string, any>, url: string): void {
    const setCookieHeaders = this.extractSetCookieHeaders(header);
    const processedCookies = this.splitCookieHeaders(setCookieHeaders);

    processedCookies.forEach(cookieStr => {
      const cookie = this.parseCookie(cookieStr, url);
      if (cookie) this.upsertCookie(cookie);
    });

    this.cleanExpired();
    this.saveToStorage();
  }

  /** 核心修复：统一响应头字段名大小写 */
  private extractSetCookieHeaders(header: Record<string, any>): string[] {
    // 字段名转为小写映射
    const lowerCaseHeader: Record<string, any> = {};
    Object.entries(header).forEach(([key, value]) => {
      lowerCaseHeader[key.toLowerCase()] = value;
    });

    if (Array.isArray(lowerCaseHeader['set-cookie'])) {
      return lowerCaseHeader['set-cookie'];
    } else if (lowerCaseHeader['set-cookie']) {
      return [lowerCaseHeader['set-cookie']];
    }
    return [];
  }

  private splitCookieHeaders(headers: string[]): string[] {
    const result: string[] = [];
    headers.forEach(header => {
      splitByTopLevelSeparator(header, ',').forEach(cookieStr => {
        if (cookieStr.trim()) result.push(cookieStr.trim());
      });
    });
    return result;
  }

  private parseCookie(cookieStr: string, url: string): Cookie | null {
    try {
      const { hostname, pathname } = parseUrl(url);
      const parts = splitByTopLevelSeparator(cookieStr, ';')
        .map(p => p.trim())
        .filter(p => p);

      const [nameValue] = parts;
      if (!nameValue) return null;

      const equalIndex = nameValue.indexOf('=');
      if (equalIndex === -1) return null;
      const name = nameValue.slice(0, equalIndex).trim();
      const value = nameValue.slice(equalIndex + 1).trim().replace(/^"/, '').replace(/"$/, '');

      const cookie: Cookie = {
        name,
        value,
        domain: hostname,
        path: inferDefaultPath(pathname),
        secure: false
      };

      parts.slice(1).forEach(part => {
        const [key, val] = part.split('=').map(p => p.toLowerCase().trim());
        switch (key) {
          case 'domain':
            cookie.domain = val ? val.replace(/^"/, '').replace(/"$/, '') : hostname;
            break;
          case 'path':
            cookie.path = val ? val.replace(/^"/, '').replace(/"$/, '') : inferDefaultPath(pathname);
            break;
          case 'expires':
            if (val) {
              const date = new Date(val.replace(/^"/, '').replace(/"$/, ''));
              cookie.expires = !isNaN(date.getTime()) ? date : undefined;
            }
            break;
          case 'max-age':
            if (val) {
              const maxAge = parseInt(val, 10);
              if (!isNaN(maxAge) && maxAge >= 0) {
                cookie.expires = new Date(Date.now() + maxAge * 1000);
              }
            }
            break;
          case 'secure':
            cookie.secure = true;
            break;
        }
      });

      return cookie;
    } catch (e) {
      console.error('Failed to parse cookie:', e, 'Cookie string:', cookieStr);
      return null;
    }
  }

  private upsertCookie(newCookie: Cookie): void {
    this.cookies = this.cookies.filter(c =>
      !(c.name === newCookie.name && c.domain === newCookie.domain && c.path === newCookie.path)
    );
    this.cookies.push(newCookie);
  }

  public replaceCookiesByDomain(domain: string, cookieStr: string, originalUrl: string): void {
    this.cleanExpired();
    const newCookieObj = cookieStrToObj(cookieStr);
    const { pathname, protocol } = parseUrl(originalUrl);
    const isHttps = protocol === 'https:';

    // 完整替换：先删除旧Cookie
    this.cookies = this.cookies.filter(c => !this.isDomainMatch(c.domain, domain));

    // 添加新Cookie
    Object.entries(newCookieObj).forEach(([name, value]) => {
      const oldCookie = this.getCookiesForUrl(originalUrl).find(c => c.name === name);
      const newCookie: Cookie = {
        name,
        value,
        domain,
        path: oldCookie?.path || inferDefaultPath(pathname),
        secure: oldCookie?.secure ?? isHttps,
        expires: oldCookie?.expires
      };
      this.upsertCookie(newCookie);
    });

    this.saveToStorage();
  }

  private getCookiesForUrl(url: string): Cookie[] {
    try {
      this.cleanExpired();
      const { protocol, hostname, pathname } = parseUrl(url);
      return this.cookies.filter(c => {
        if (c.expires && c.expires <= new Date()) return false;
        if (c.secure && protocol !== 'https:') return false;
        if (!this.isDomainMatch(c.domain, hostname)) return false;
        return pathname.startsWith(c.path);
      });
    } catch (e) {
      console.error('Failed to get cookies for url:', e, 'Url:', url);
      return [];
    }
  }

  public getCookiesStringByDomain(domain: string): string {
    return this.getCookiesForDomain(domain)
      .map(c => `${c.name}=${c.value}`)
      .join('; ');
  }

  private getCookiesForDomain(domain: string): Cookie[] {
    this.cleanExpired();
    return this.cookies.filter(c => this.isDomainMatch(c.domain, domain));
  }

  private isDomainMatch(cookieDomain: string, targetDomain: string): boolean {
    const normalizedCookie = cookieDomain.startsWith('.') ? cookieDomain.slice(1) : cookieDomain;
    const normalizedTarget = targetDomain.startsWith('.') ? targetDomain.slice(1) : targetDomain;
    return normalizedTarget.endsWith(normalizedCookie) || normalizedTarget === normalizedCookie;
  }

  public getRequestCookies(url: string): string {
    return this.getCookiesForUrl(url)
      .map(c => `${c.name}=${c.value}`)
      .join('; ');
  }

  public clearAll(): void {
    this.cookies = [];
    this.saveToStorage();
  }

  public clearByDomain(domain: string): void {
    this.cookies = this.cookies.filter(c => !this.isDomainMatch(c.domain, domain));
    this.saveToStorage();
  }
}

/** Cookie操作工具类 */
class CookieDomainHelper {
  private domain: string;
  private originalUrl: string;

  constructor(domain: string, originalUrl: string) {
    this.domain = domain;
    this.originalUrl = originalUrl;
  }

  get cookie(): string {
    return CookieStore.getInstance().getCookiesStringByDomain(this.domain);
  }

  set cookie(value: string) {
    CookieStore.getInstance().replaceCookiesByDomain(this.domain, value, this.originalUrl);
  }
}

/** 对外导出工具函数 */
export function getCookies(url: string): CookieDomainHelper {
  try {
    const { hostname } = parseUrl(url);
    return new CookieDomainHelper(hostname, url);
  } catch (e) {
    console.error('Failed to resolve cookies for url:', e, 'Url:', url);
    throw new Error(`Failed to resolve cookies for url: ${url}`);
  }
}

export function cookieObjToStr(cookieObj: { [key: string]: string }): string {
  return Object.entries(cookieObj)
    .map(([key, value]) => `${key}=${String(value).replace(/;/g, encodeURIComponent)}`)
    .join('; ');
}

/** 请求包装器 */
interface CookieRequestOption<T> {
  url: string;
  header?: Record<string, any>;
  success?: (res: T) => void;
  fail?: (res: any) => void;
  complete?: (res: any) => void;
}

interface CookieRequestResult {
  header: Record<string, any>;
}

export function withCookie<
  TResult extends CookieRequestResult,
  TOption extends CookieRequestOption<TResult>,
  TReturn = void
>(
  requestFunc: (option: TOption) => TReturn
) {
  return function wrappedRequest(option: TOption): TReturn | void {
    const { url, header = {}, success, fail, complete } = option;
    if (!url) {
      const err = { errMsg: 'cookie: url is required' };
      fail?.(err);
      complete?.(err);
      return;
    }

    const requestCookies = CookieStore.getInstance().getRequestCookies(url);
    const injectedHeader = {
      ...header,
      ...(requestCookies ? { Cookie: requestCookies } : {})
    };

    const wrappedSuccess = (res: TResult) => {
      CookieStore.getInstance().setFromResponse(res.header, url);
      success?.(res);
    };

    return requestFunc({
      ...option,
      header: injectedHeader,
      success: wrappedSuccess,
    });
  };
}