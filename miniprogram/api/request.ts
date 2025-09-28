import proxyRequest from '../utils/proxyRequest';
import { getCookies, cookieStrToObj, withCookie } from '../utils/cookie'

/**
 * 自定义请求函数参数
 */
interface RequestOptions {
  /** 请求 url */
  url: string
  /** 请求的参数 */
  data?: string | WechatMiniprogram.IAnyObject | ArrayBuffer
  /** 设置请求的 header。
   *
   * `content-type` 默认为 `application/json` */
  header?: WechatMiniprogram.IAnyObject
  /** 超时时间，单位为毫秒 */
  timeout?: number
  /** HTTP 请求方法 */
  method?:
  | 'OPTIONS'
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'TRACE'
  | 'CONNECT'
  /** 返回的数据格式
   *
   * 可选值：
   * - 'json': 返回的数据为 JSON，返回后会对返回的数据进行一次 JSON.parse;
   * - '其他': 不对返回的内容进行 JSON.parse; */
  dataType?: 'json' | '其他'
  /** 响应的数据类型
   *
   * 可选值：
   * - 'text': 响应的数据为文本;
   * - 'arraybuffer': 响应的数据为 ArrayBuffer;
   *
   * 最低基础库： `1.7.0` */
  responseType?: 'text' | 'arraybuffer'
  /**
   * 是否使用代理，默认值为 `false`
   * 
   * - `false`: 使用 `wx.request()` 进行请求
   * - `true`: 使用 `proxyRequest()` 进行请求，可绕过 referer 限制
   */
  useProxy?: boolean
  /**
   * 是否自动重定向，默认值为 `manual`
   */
  redirect?: 'follow' | 'manual'
}

/**
 * 获取指定域的 Token
 * @param url - 请求的 URL
 * @returns Token 值（可能为 undefined ）
 */
function getAuthToken(url: string): string | undefined {
  try {
    const cookies = getCookies(url).cookie;
    const cookieObj = cookieStrToObj(cookies);
    return cookieObj.TOKEN;
  } catch (error) {
    console.warn('获取 Token 异常:', error);
    return undefined;
  }
}

/**
 * 请求函数（自动添加 Authorization 头）
 * @param options 请求配置
 * @returns Promise 对象，包含请求结果
 */
export async function request<T extends string | WechatMiniprogram.IAnyObject | ArrayBuffer =
  | string
  | WechatMiniprogram.IAnyObject
  | ArrayBuffer>(
    options: RequestOptions
  ): Promise<WechatMiniprogram.RequestSuccessCallbackResult<T>> {
  const { useProxy = false, ...nativeRequestOptions } = options;

  // 构建请求头
  const requestHeader: WechatMiniprogram.IAnyObject = {
    ...nativeRequestOptions.header,
  };

  // 自动添加 Authorization 头（仅当存在 Token 且未手动指定时）
  const token = getAuthToken(nativeRequestOptions.url);
  if (token && !nativeRequestOptions.header?.Authorization) {
    requestHeader.Authorization = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    const finalRequestOptions: WechatMiniprogram.RequestOption<T> = {
      ...nativeRequestOptions,
      header: requestHeader,
      success: (res) => resolve(res),
      fail: (res) => reject(res)
    };

    if (useProxy) {
      withCookie<WechatMiniprogram.RequestOption<T>, WechatMiniprogram.RequestSuccessCallbackResult<T>>(proxyRequest)(finalRequestOptions);
    } else {
      withCookie<WechatMiniprogram.RequestOption<T>, WechatMiniprogram.RequestSuccessCallbackResult<T>>(wx.request)(finalRequestOptions);
    }
  });
}

export default request;
