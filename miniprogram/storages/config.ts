import Storage from '../utils/dataStorage'

export const app = {
  initFlag: new Storage<boolean>('APP_INIT_FLAG'),
}