import wakeupapp from './wakeupapp.min.js';
let btn = document.querySelector('#btn');
btn.addEventListener('click', () => {
    wakeupapp.init({
        page: 'pb',
        from: 'bpush',
        ios9DownUrl: '/mo/q/activityDiversion/download?fr=bpushTopBannerOpenApp',       // ios9的调起参数fr=？
        iosDownUrl: 'https://itunes.apple.com/app/apple-store/id477927812?pt=328057&ct=bottom_layer&mt=8',             // ios的下载链接
        androidDownUrl: 'https://downpack.baidu.com/baidutieba_AndroidPhone_v9.3.8.0(9.3.8.0)_1015363f.apk',         // android的下载链接
        param: {
            tid: '5582054069'
        }
    });
});
