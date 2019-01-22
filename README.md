# 通用H5唤起NA组件
## 使用方式
基本的使用方式为

```
import wakeUpApp from 'wakeupapp';
const config = {
    locate: '',                 // 导流的名字
    page: '',                   // 页面名字
    param: {
        tid: '',                // 帖子id
        kw: '',                 // 吧名字
    },
    noDownload: false,          // 是否下载
    callManufacturer: false,    // 是否需要调起厂商的应用商店
    ios9DownUrl: ''             // ios9的调起参数
    iosDownUrl: ''              // ios的下载链接
    androidDownUrl: ''          // android的下载链接
    from: 'bpush',              // 统计参数，大部分都是bpush
}
wakeUpApp.init(config);
```
因为每个app的调起参数差异很大，另外关于调起的打点统计差异很大，请自己行`clone`后随意修改。
其中配置文件在`config.js`中