const axios = require('axios');
const cloud = require('wx-server-sdk')

cloud.init()

exports.main = async (event, context) => {
  try {
    const {
      url,
      method = 'GET',
      timeout = 60000,
      requestData = {},
      requestHeaders = {},
      responseType = 'text',
      redirect = 'follow'
    } = event;

    // 配置请求参数
    const axiosConfig = {
      url,
      method,
      timeout,
      headers: requestHeaders,
      responseType,
      // 根据 redirect 参数配置重定向行为
      maxRedirects: redirect === 'follow' ? 5 : 0,
      validateStatus: status => {
        // manual 模式下不验证状态码，直接返回原始响应
        if (redirect === 'manual') return true;
        // follow 模式下仅验证 2xx 状态码
        return status >= 200 && status < 300;
      }
    };

    // 根据请求方法处理数据
    if (method.toUpperCase() === 'GET') {
      axiosConfig.params = requestData;
    } else {
      if (typeof requestData === 'object' && !(requestData instanceof Buffer)) {
        axiosConfig.data = requestData;
      } else {
        axiosConfig.data = requestData;
        axiosConfig.transformRequest = [data => data];
      }
    }

    // 发起请求
    const response = await axios(axiosConfig);

    // 标准化响应头为小写键名
    const normalizedHeaders = {};
    Object.entries(response.headers).forEach(([key, value]) => {
      normalizedHeaders[key.toLowerCase()] = value;
    });

    // 处理 Cookie 确保数组格式
    let cookies = normalizedHeaders['set-cookie'] || [];
    if (!Array.isArray(cookies)) {
      cookies = [cookies];
    }

    // 处理二进制数据
    let rawData = undefined;
    if (responseType === 'arraybuffer' && response.data instanceof Buffer) {
      rawData = response.data.toString('base64');
    }

    return {
      success: true,
      statusCode: response.status,
      headers: normalizedHeaders,
      cookies: cookies,
      data: response.data,
      rawData: rawData,
      errno: 0,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      statusCode: error.response?.status || 500,
      errno: error.errno || 1
    };
  }
};
