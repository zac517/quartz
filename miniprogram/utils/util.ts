/** 
 * 解析 URL
 */
export function parseUrl(url: string): { protocol: string; hostname: string; pathname: string } {
  const urlRegex = /^([a-zA-Z][a-zA-Z0-9+.-]*:)?\/{0,2}([^/?#]+)?([^?#]*)?/;
  const match = url.match(urlRegex);

  if (!match) throw new Error('Invalid URL format');
  if (!match[2]) throw new Error('Failed to resolve hostname');

  // 协议：默认 http:
  let protocol = match[1] || 'http:';
  if (!protocol.endsWith(':')) protocol += ':';

  // 主机名：移除用户名密码前缀
  let hostname = match[2].split('@').pop() || '';

  // 路径：默认 /
  let pathname = match[3] || '/';
  if (!pathname.startsWith('/')) pathname = `/${pathname}`;

  return { protocol, hostname, pathname };
}