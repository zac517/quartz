import { decode } from 'base64-arraybuffer';

interface CloudFunctionInnerResult {
  success: boolean;
  statusCode?: number;
  headers?: Record<string, string>;
  data?: string;
  cookies?: string[];
  error?: string;
  errno: number;
  rawData?: string;
}

export namespace ProxyRequest {
  export type RequestOption<T> = Pick<WechatMiniprogram.RequestOption<T>, 'url' | 'data' | 'dataType' | 'header' | 'method' | 'redirect' | 'responseType' | 'timeout'> & {
    success?: (res: RequestSuccessCallbackResult<
      T>) => void
    fail?: (res: {errMsg: string}) => void
    complete?: (res: {errMsg: string}) => void
  }

  export type RequestSuccessCallbackResult<
    T extends string | Record<string, any> | ArrayBuffer =
    | string
    | Record<string, any>
    | ArrayBuffer
    > = Pick<WechatMiniprogram.RequestSuccessCallbackResult<T>, 'header' | 'cookies' | 'data' | 'statusCode' | 'errMsg'>

  /**
 * 代理请求函数，通过云函数转发请求以绕过 referer 限制
 */
  export function request<
    T extends string | Record<string, any> | ArrayBuffer =
    | string
    | Record<string, any>
    | ArrayBuffer
  >(
    option: RequestOption<T>
  ): void {
    const {
      url,
      data = {},
      header = {},
      timeout = 60000,
      method = 'GET',
      dataType = 'json',
      responseType = 'text',
      redirect = 'manual',
      success,
      fail,
      complete,
    } = option;

    if (!url) {
      const error = {
        errMsg: 'proxyRequest: fail url is required',
        errno: 1001
      };
      fail?.(error);
      complete?.(error);
      return;
    }

    const requestHeader = {
      'content-type': 'application/json',
      ...header
    };

    const cloudParams = {
      url,
      method,
      timeout,
      requestData: data,
      requestHeaders: requestHeader,
      responseType,
      redirect
    };

    wx.cloud.callFunction({
      name: 'proxyRequest',
      data: cloudParams,
      success: (cloudRes) => {
        const innerResult = cloudRes.result as CloudFunctionInnerResult;

        if (innerResult.success) {
          let responseData: T;

          if (responseType === 'arraybuffer') {
            if (typeof innerResult.rawData === 'string') {
              try {
                const bytes = decode(innerResult.rawData);
                responseData = bytes as T;
              } catch {
                responseData = innerResult.data as T;
              }
            } else {
              responseData = innerResult.data as T;
            }
          } else {
            const rawText = innerResult.data || '';

            if (dataType === 'json') {
              try {
                responseData = rawText.trim() ? JSON.parse(rawText) as T : rawText as T;
              } catch {
                responseData = rawText as T;
              }
            } else {
              responseData = rawText as T;
            }
          }

          const successRes: RequestSuccessCallbackResult<T> = {
            data: responseData,
            statusCode: innerResult.statusCode || 200,
            header: innerResult.headers || {},
            cookies: innerResult.cookies || [],
            errMsg: 'proxyRequest: ok',
          };
          success?.(successRes);
          complete?.(successRes);
          return;
        }

        const failRes = {
          errMsg: `proxyRequest: fail ${innerResult.error || 'unknown error'}`,
        };
        fail?.(failRes);
        complete?.(failRes);
      },
      fail: (cloudErr) => {
        const failRes = {
          errMsg: `proxyRequest: cloud function failed - ${cloudErr.errMsg}`,
        };
        fail?.(failRes);
        complete?.(failRes);
      }
    });
  }
}

export default ProxyRequest;
