import Storage from '../utils/dataStorage'

export const app = {
  initFlag: new Storage<boolean>('APP_INIT_FLAG'),
  isLogin: new Storage<boolean>('APP_IS_LOGIN'),
  useCloud: new Storage<boolean>('APP_USE_CLOUD'),
}