import { decode } from 'base64-arraybuffer';

interface CloudFunctionInnerResult {
  success: boolean;
  statusCode?: number;
  headers?: Record<string, string>;
  data?: string;
  cookies?: string[];
  error?: string;
  errno?: number;
  rawData?: string;
}

/**
 * 代理请求函数，通过云函数转发请求以绕过 referer 限制
 */
function proxyRequest<
  T extends string | WechatMiniprogram.IAnyObject | ArrayBuffer =
  | string
  | WechatMiniprogram.IAnyObject
  | ArrayBuffer
>(
  option: WechatMiniprogram.RequestOption<T> & {
    /** 重定向处理模式：'follow' 自动跟随，'manual' 手动处理 */
    redirect?: 'follow' | 'manual';
  }
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
    complete
  } = option;

  if (!url) {
    const failRes: WechatMiniprogram.GeneralCallbackResult = {
      errMsg: 'proxyRequest: fail 缺少必填参数 "url"'
    };
    fail?.(failRes);
    complete?.(failRes);
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

        // 处理二进制数据
        if (responseType === 'arraybuffer') {
          if (typeof innerResult.rawData === 'string') {
            try {
              const bytes = decode(innerResult.rawData);
              responseData = bytes as unknown as T;
            } catch {
              responseData = innerResult.data as unknown as T;
            }
          } else {
            responseData = innerResult.data as unknown as T;
          }
        } 
        // 处理文本及 JSON 数据
        else {
          const rawText = innerResult.data || '';

          if (dataType === 'json') {
            try {
              responseData = rawText.trim() ? JSON.parse(rawText) as T : rawText as unknown as T;
            } catch {
              responseData = rawText as unknown as T;
            }
          } else {
            responseData = rawText as unknown as T;
          }
        }

        // 构造与原生请求一致的响应结构
        const successRes: WechatMiniprogram.RequestSuccessCallbackResult<T> = {
          data: responseData,
          statusCode: innerResult.statusCode || 200,
          header: innerResult.headers || {},
          cookies: innerResult.cookies || [],
          errMsg: 'proxyRequest: ok',
          profile: undefined as unknown as WechatMiniprogram.RequestProfile,
        };
        success?.(successRes);
        complete?.(successRes);
        return;
      }

      const failRes: WechatMiniprogram.GeneralCallbackResult = {
        errMsg: `proxyRequest: fail ${innerResult.error || '未知错误'}`
      };
      fail?.(failRes);
      complete?.(failRes);
    },
    fail: (cloudErr: WechatMiniprogram.GeneralCallbackResult) => {
      const failRes: WechatMiniprogram.GeneralCallbackResult = {
        errMsg: `proxyRequest: fail 云函数调用失败: ${cloudErr.errMsg}`
      };
      fail?.(failRes);
      complete?.(failRes);
    }
  });
}

export default proxyRequest;
