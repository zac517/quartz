// login.ts
import {request} from '../../api/request'
import {login} from '../../api/cas/login'
import {encode} from 'base64-arraybuffer'

Page({
  data: {
    varCode: '',
    testData: '',
    username: '',
    password: '',
    imageUrl: '',
  },
  
  getTime() {
    return new Date().getTime();
  },

  varCodeInput(event: any) {
    this.setData({
      varCode: event.detail.value
    })
  },

  async test() {
    const result = await login({
      username: this.data.username,
      password: this.data.password,
      capcha: this.data.varCode
    })

    console.log('登录结果：', result)
  },

  async onLoad() {
    wx.cloud.init();
    const res = await request({
      url: `https://cas.hfut.edu.cn/cas/vercode?time=${this.getTime()}`,
      responseType: 'arraybuffer',
    })
    const base64 = encode(res.data as ArrayBuffer);
      const imgUrl = 'data:image/jpeg;base64,' + base64;
      this.setData({
          imageUrl: imgUrl
      });
  }
})
