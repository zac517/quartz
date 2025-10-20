// login.ts
import { request } from '../../api/request'
import { login } from '../../api/cas/login'
import { encode } from 'base64-arraybuffer'
import { app } from '../../storages/config'

Page({
  data: {
    varCode: '',
    username: '',
    password: '',
    imageUrl: '',
    unHint: '',
    pwHint: '',
    vcHint: '',
    available: false,
    index: -1,
    loaded: false,
  },

  getTime() {
    return new Date().getTime();
  },

  checkValid() {
    if (this.data.username.length == 10 && this.data.password != '' && this.data.varCode.length == 4) {
      this.setData({
        available: true,
      })
    }
    else {
      this.setData({
        available: false,
      })
    }
  },

  unInput(event: WechatMiniprogram.Input) {
    const value = event.detail.value;
    if (value.length == 0) {
      this.setData({
        unHint: '请输入学号'
      })
    }
    else if (value.length != 10) {
      this.setData({
        unHint: '学号格式有误'
      })
    }
    else {
      this.setData({
        unHint: ''
      })
    }
    this.checkValid();
  },

  pwInput(event: WechatMiniprogram.Input) {
    const value = event.detail.value;
    if (value.length == 0) {
      this.setData({
        pwHint: '请输入密码'
      })
    }
    else {
      this.setData({
        pwHint: ''
      })
    }
    this.checkValid();
  },

  vcInput(event: WechatMiniprogram.Input) {
    const value = event.detail.value;
    if (value.length == 0) {
      this.setData({
        vcHint: '请输入验证码'
      })
    }
    else if (value.length != 4) {
      this.setData({
        vcHint: '验证码格式有误'
      })
    }
    else {
      this.setData({
        vcHint: ''
      })
    }
    this.checkValid();
  },

  unFocus() {
    this.setData({
      unHint: ''
    })
  },
  
  pwFocus() {
    this.setData({
      pwHint: ''
    })
  },

  vcFocus() {
    this.setData({
      vcHint: ''
    })
  },

  async login() {
    await wx.showLoading({
      title: '登录中',
      mask: true,
    });
    const result = await login({
      username: this.data.username,
      password: this.data.password,
      capcha: this.data.varCode
    })
    await wx.hideLoading();
    if (result) {
      await wx.showToast({
        title: '登录成功',
        icon: 'success',
        mask: true,
      });
      const { isLogin } = app;
      isLogin.value = true;

      
      setTimeout(() => {
        wx.hideToast();
        wx.navigateBack({
          complete: () => {
            const eventChannel = this.getOpenerEventChannel() as WechatMiniprogram.EventChannel;
            eventChannel?.emit('isLogin')
          }
        })
      }, 1000);
    }
    else {
      await wx.showToast({
        title: '登录失败',
        icon: 'error',
        duration: 1000,
        mask: true,
      })
    }
  },

  async onLoad() {
    wx.cloud.init();
    await this.freshVarCode();
  },

  inputConfirm(event: WechatMiniprogram.InputConfirm) {
    this.setData({
      index: event.currentTarget.dataset.id + 1,
    })
  },

  async freshVarCode() {
    const res = await request({
      url: `https://cas.hfut.edu.cn/cas/vercode?time=${this.getTime()}`,
      responseType: 'arraybuffer',
    })
    const base64 = encode(res.data as ArrayBuffer);
    const imgUrl = 'data:image/jpeg;base64,' + base64;
    this.setData({
      imageUrl: imgUrl
    });
  },

  showImg() {
    this.setData({
      loaded: true
    })
  },
})
