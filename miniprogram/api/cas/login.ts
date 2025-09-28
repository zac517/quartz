import {request} from '../request'
import CryptoJS from 'crypto-js'
import {getCookies, cookieStrToObj} from '../../utils/cookie'

/**
 * 网页用的加密函数
 */
function encryptionPwd(pwd: string) {
  var secretKey = cookieStrToObj(getCookies('https://cas.hfut.edu.cn/').cookie)["LOGIN_FLAVORING"] || '',
    key = CryptoJS.enc.Utf8.parse(secretKey),
    password = CryptoJS.enc.Utf8.parse(pwd),
    encrypted = CryptoJS.AES.encrypt(password, key, {mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7}),
    encryptedPwd = encrypted.toString();
    console.log(getCookies('https://cas.hfut.edu.cn/').cookie, cookieStrToObj(getCookies('https://cas.hfut.edu.cn/').cookie), 'secretKey', secretKey)
  return encryptedPwd;
}

/**
 * 解析 execution
 */
function getExecution(html: string) {
  // 定位 name="execution" 位置
  const nameIndex = html.indexOf('name="execution"');
  if (nameIndex === -1) return '';

  // 从 name 后定位 value=" 位置
  const valueStart = html.indexOf('value="', nameIndex + 15);
  if (valueStart === -1) return '';

  // 截取 value 内容
  const valueEnd = html.indexOf('"', valueStart + 7);
  return valueEnd > valueStart ? html.slice(valueStart + 7, valueEnd) : '';
}

interface LoginOptions {
  username: string
  capcha: string
  password: string
}




/**
 * 登录统一身份认证平台
 * @param options 登录选项
 */
export async function login(options: LoginOptions) {
  const {username, capcha, password: pwd } = options;

  // 获取 CAS 的 SESSION 和 execution
  const response = await request({
    url: 'https://cas.hfut.edu.cn/cas/login',
  })
  const execution = getExecution(response.data as string);
  console.log('execution:', execution)

  // 获取 JSESSIONID 和 LOGIN_FLAVORING
  await request({
    url: 'https://cas.hfut.edu.cn/cas/checkInitParams',
    data: {
      _: new Date().getTime(),
    }
  })

  // 加密密码
  const password = encryptionPwd(pwd);
  
  return await request({
    url: 'https://cas.hfut.edu.cn/cas/login',
    method: 'POST',
    data: {
      username,
      capcha,
      password,
      execution,
      _eventId: 'submit',
      geolocation: '',
    },
    header: {
      'content-type': 'application/x-www-form-urlencoded'
    },
  })
}