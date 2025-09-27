const request = require('request-promise-native') 

exports.main = async (event, context) => {
  try {
    const {
      url,
      method = 'GET',
      timeout = 60000,
      requestData = {},
      requestHeaders = {},
      responseType = 'text'
    } = event;

    const requestOptions = {
      url,
      method,
      timeout,
      headers: requestHeaders,
      resolveWithFullResponse: true,
      encoding: responseType === 'arraybuffer' ? null : 'utf8'
    };

    // 处理请求参数
    if (method.toUpperCase() === 'GET') {
      requestOptions.qs = requestData;
    } else {
      requestOptions.body = requestData;
      if (typeof requestData === 'object' && !Buffer.isBuffer(requestData)) {
        requestOptions.json = true;
      }
    }

    // 发起请求
    const response = await request(requestOptions);

    // 标准化响应头为小写字母键
    const normalizedHeaders = {};
    Object.entries(response.headers).forEach(([key, value]) => {
      normalizedHeaders[key.toLowerCase()] = value;
    });

    // 确保Set-Cookie始终为数组格式
    let cookies = normalizedHeaders['set-cookie'] || [];
    if (!Array.isArray(cookies)) {
      cookies = [cookies];
    }

    let rawData = undefined;
    if (responseType === 'arraybuffer' && Buffer.isBuffer(response.body)) {
      rawData = response.body.toString('base64');
    }

    return {
      success: true,
      statusCode: response.statusCode,
      headers: normalizedHeaders,
      cookies: cookies,
      data: response.body,
      rawData: rawData
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      statusCode: error.statusCode || 500,
      errno: error.errno || 1
    };
  }
};
