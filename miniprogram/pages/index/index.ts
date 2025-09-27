// index.ts

import CryptoJS from 'crypto-js'
import {cookies, getCookieValueFromStr} from '../../utils/cookie'

Component({
  data: {
    varCode: '',
    testData: '',
  },
  methods: {
    encryptionPwd(pwd: string) {
      var secretKey = getCookieValueFromStr(cookies('https://cas.hfut.edu.cn/').cookie, "LOGIN_FLAVORING") || '',
          key = CryptoJS.enc.Utf8.parse(secretKey),
          password = CryptoJS.enc.Utf8.parse(pwd),
          encrypted = CryptoJS.AES.encrypt(password, key, {mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7}),
          encryptedPwd = encrypted.toString();
      return encryptedPwd;

    },
    getTime() {
      return new Date().getTime();
    },
    varCodeInput(event: any) {
      this.setData({
        varCode: event.detail.value
      })
    },

    test() {
      wx.request({
        url: 'https://cas.hfut.edu.cn/cas/checkInitParams',
        data: {
          _: this.getTime(),
        },
      });

    },
    login() {
      wx.request({
        url: 'https://cas.hfut.edu.cn/cas/policy/checkUserIdenty',
        data: {
          username: 'test',
          password: this.encryptionPwd('test'),
          capcha: this.data.varCode,
        },
        complete:(res) => {
          this.setData({
            testData: JSON.stringify(res)
          })
        }
      })
    },
  },

  lifetimes: {
    created() {
      wx.cloud.init();
      this.test();
    }
  }
})
