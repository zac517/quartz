import ProxyRequest from '../utils/proxyRequest';
import { withCookie } from '../utils/cookie'

/**
 * 解析响应头中的重定向 URL
 * @param headers 响应头对象
 * @returns 重定向URL（如果存在）
 */
function getRedirectUrl(headers: Record<string, any>): string | null {
  // 标准化响应头键名（忽略大小写）
  const headerKeys = Object.keys(headers);
  const locationKey = headerKeys.find(key => 
    key.toLowerCase() === 'location'
  );
  
  return locationKey ? headers[locationKey] : null;
}

/**
 * 检查状态码是否为需要重定向的状态码
 * @param statusCode HTTP状态码
 * @returns 是否需要重定向
 */
function isRedirectStatusCode(statusCode: number): boolean {
  return [301, 302, 307, 308].includes(statusCode);
}

/**
 * 请求函数
 * @param options 请求配置
 * @returns Promise 对象，包含最终请求结果
 */
export async function request<T extends string | Record<string, any> | ArrayBuffer =
  | string
  | Record<string, any>
  | ArrayBuffer>(
    options: Omit<ProxyRequest.RequestOption<T>, 'success' | 'fail' | 'complete'> & {
      useProxy?: Boolean
    }
  ): Promise<ProxyRequest.RequestSuccessCallbackResult<T>> {
  const { 
    useProxy = false, 
    redirect = 'manual', 
    ...nativeRequestOption 
  } = options;

  // 构建请求头
  const requestHeader: Record<string, any> = {
    ...nativeRequestOption.header,
  };

  // 执行单次请求的内部函数
  const executeRequest = (currentUrl: string): Promise<ProxyRequest.RequestSuccessCallbackResult<T>> => {
    return new Promise((resolve, reject) => {
      // 始终向底层请求函数传递不自动跳转的配置
      const finalRequestOption: ProxyRequest.RequestOption<T> = {
        ...nativeRequestOption,
        url: currentUrl,
        header: requestHeader,
        redirect: 'manual', // 强制使用手动重定向
        success: (res) => resolve(res),
        fail: (res) => reject(res)
      };

      if (useProxy) {
        withCookie<ProxyRequest.RequestSuccessCallbackResult<T>, ProxyRequest.RequestOption<T>>(ProxyRequest.request)(finalRequestOption);
      } else {
        withCookie<WechatMiniprogram.RequestSuccessCallbackResult<T>, WechatMiniprogram.RequestOption<T>, WechatMiniprogram.RequestTask>(wx.request)(finalRequestOption);
      }
    });
  };

  // 执行初始请求
  const initialResponse = await executeRequest(nativeRequestOption.url);

  // 如果需要自动跟随重定向且响应是重定向状态
  if (redirect === 'follow' && isRedirectStatusCode(initialResponse.statusCode)) {
    const redirectUrl = getRedirectUrl(initialResponse.header);
    
    if (redirectUrl) {
      return request<T>({
        ...options,
        url: redirectUrl,
        // 重定向请求通常使用 GET 方法
        method: ['POST', 'PUT', 'DELETE'].includes(options.method || '') ? options.method : 'GET',
        // 重定向请求一般不带请求体
        data: ['POST', 'PUT'].includes(options.method || '') ? options.data : undefined
      });
    }
  }

  // 返回最终响应结果
  return initialResponse;
}

export default request;
