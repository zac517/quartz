import { getTimeTable } from "../../api/one/course_table"

Page({
  data: {
    tableList: [
      {
        name: '课程表1',
        id: '1',
      },
      {
        name: '课程表2',
        id: '2',
      },
      {
        name: '课程表3',
        id: '3',
      },
    ],
    showOptions: false
  },

  onLoad() {

  },
  
  showOption() {
    this.setData({
      showOptions: true
    })
  },

  hideOption() {
    this.setData({
      showOptions: false
    })
  },

  stopPropagation() {
    return false;
  },

  async test() {
    const result = await getTimeTable();
    console.log(result)
  },
})