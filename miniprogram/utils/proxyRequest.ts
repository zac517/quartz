/**
 * 实现代理请求，绕过 referer 限制
 */

 import {decode} from 'base64-arraybuffer'

interface CloudFunctionInnerResult {
  success: boolean;
  statusCode?: number;
  headers?: Record<string, string>;
  data?: any;
  cookies?: string[];
  error?: string;
  errno?: number;
  rawData?: string;
}

/**
 * 代理请求函数 
 * 
 * 实现 wx.request 的核心接口，行为对齐原生API
 * 
 * 暂不支持返回 RequestTask 对象
 * @param option 请求配置参数
 */
function proxyRequest<
  T extends string | WechatMiniprogram.IAnyObject | ArrayBuffer =
  | string
  | WechatMiniprogram.IAnyObject
  | ArrayBuffer
>(
  option: WechatMiniprogram.RequestOption<T>
): void {
  const {
    url,
    data = {},
    header = {},
    timeout = 60000,
    method = 'GET',
    dataType = 'json',
    responseType = 'text',
    success,
    fail,
    complete
  } = option;

  // 无 url 时直接返回失败
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

  // 构建云函数参数
  const cloudParams = {
    url,
    method,
    timeout,
    requestData: data,
    requestHeaders: requestHeader,
    responseType
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
            // 安全转换 Base64 到 ArrayBuffer
            try {
              const bytes = decode(innerResult.rawData);
              responseData = bytes as unknown as T;
            } catch (e) {
              // 转换失败时返回原始数据
              responseData = innerResult.data as unknown as T;
            }
          } else {
            // 兼容无 rawData 的情况
            responseData = innerResult.data as unknown as T;
          }
        } 
        // 处理文本类型数据
        else {
          // 原始数据转换为字符串
          const rawText = typeof innerResult.data === 'string' 
            ? innerResult.data 
            : String(innerResult.data);

          // 根据 dataType 处理 JSON 解析
          if (dataType === 'json') {
            try {
              responseData = JSON.parse(rawText) as T;
            } catch (e) {
              // 解析失败保留原始文本
              responseData = rawText as unknown as T;
            }
          } else {
            responseData = rawText as unknown as T;
          }
        }

        const successRes: WechatMiniprogram.RequestSuccessCallbackResult<T> = {
          data: responseData,
          statusCode: innerResult.statusCode || 200,
          header: innerResult.headers || {},
          cookies: innerResult.cookies || [],
          errMsg: 'proxyRequest: ok',
          profile: null as unknown as WechatMiniprogram.RequestProfile,
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
    