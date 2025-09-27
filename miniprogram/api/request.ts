import proxyRequest from '../utils/proxyRequest';

/**
 * 通用请求函数：自动添加 Authorization 头 + 支持代理开关
 * @param options 请求配置：包含 useProxy 开关 + wx.request 所有原生参数
 * @returns RequestTask 对象（兼容原生，支持 abort 取消）
 */
function request<T = any>(
  options: WechatMiniprogram.RequestOption<T> & {
    useProxy?: boolean; // 新增：是否使用代理（默认 false，直接调用 wx.request）
  }
): void {
  // 解构参数：分离自定义的 useProxy 与原生请求参数
  const { useProxy = false, ...nativeRequestOptions } = options;

  // 1. 自动添加 Authorization 头：优先使用用户传入的头，无则补充默认值
  const requestHeader = {
    ...nativeRequestOptions.header, // 保留用户自定义请求头
    // 从本地存储获取 Token（实际项目可根据 Token 存储位置调整）
    Authorization: nativeRequestOptions.header?.Authorization || `Bearer ${getAuthToken()}`
  };

  // 2. 组装完整请求参数：合并头信息与原生参数
  const finalRequestOptions: WechatMiniprogram.RequestOption<T> = {
    ...nativeRequestOptions,
    header: requestHeader
  };

  // 3. 根据 useProxy 选择请求方式
  if (useProxy) {
    // 启用代理：调用已实现的 proxyRequest 函数（通过云函数转发）
    return proxyRequest(finalRequestOptions);
  } else {
    // 不启用代理：直接调用原生 wx.request
    wx.request(finalRequestOptions);
    return;
  }
}

/**
 * 辅助函数：获取认证 Token
 * 从本地存储读取 Token（实际项目可根据 Token 存储逻辑调整）
 * @returns 认证 Token（无则返回空字符串）
 */
function getAuthToken(): string {
  try {
    // 示例：从 wx.getStorageSync 读取 Token（可替换为其他存储方式）
    return wx.getStorageSync('user_auth_token') || '';
  } catch (error) {
    console.error('获取 Token 失败：', error);
    return '';
  }
}

// 导出通用请求函数：供项目各模块调用
export default request;