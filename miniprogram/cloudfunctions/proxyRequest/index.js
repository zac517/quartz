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
      encoding: responseType === 'arraybuffer' ? null : 'utf8' // 二进制用 buffer
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

    let rawData = undefined;
    if (responseType === 'arraybuffer' && Buffer.isBuffer(response.body)) {
      rawData = response.body.toString('base64'); // 二进制转 Base64
    }

    // 直接返回原始响应体
    return {
      success: true,
      statusCode: response.statusCode,
      headers: response.headers,
      cookies: response.headers['set-cookie'] || [],
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