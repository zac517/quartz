## 接口
### `GET` 获取 SECSSION 

 `https://jxglstu.hfut.edu.cn/eams5-student/neusoft-sso/login`

查询字符串参数
```
ticket=
```

### `GET` 获取课程数据
详细，用于显示课程表

 `https://jxglstu.hfut.edu.cn/eams5-student/for-std/course-table/get-data`

请求 Cookie:
```
SESSION
```

查询字符串参数
```
bizTypeId=23
semesterId=
dataId=
```

### `POST` 获取课程数据
用于显示课程列表

`https://jxglstu.hfut.edu.cn/eams5-student/ws/schedule-table/datum`

请求 Cookie:
```
SESSION
```

请求负载:
``` json
{
  lessonIds: [],
  studentId: ,
  weekIndex: "",
}
```