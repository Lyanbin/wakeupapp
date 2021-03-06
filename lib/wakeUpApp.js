import Config from './config';
import Ua from 'mobile-useragent-parse';
/**
 * 
 * 
 * 原始的参数为这些：
 * app = {
 *      locate: 'bottom_layer',                             // 导流条位置，必填
 *      page: page,                                         // 有默认，可覆盖
 *      param: {                                            // frs和pb的id，必填，否则进入的是首页
 *          threadId: opts.tid
 *      },
 *      callManufacturer: opts.manufacturerConfig.switch,   // 是否调起厂商
 *      ios9DownUrl: ios9DownUrl,                           // 有默认，可覆盖
 *      iosDownUrl: iosDownUrl,                             // 有默认，可覆盖
 *      androidDownUrl: androidDownUrl,                     // 有默认，可覆盖
 *      from: 'bpush',                                      // 统计参数，大部分都是bpush
 
 *      task: 'H5导流',                                      // h5统计参数，目前没用
 *      isSearch: sessionStorage.getItem('isSearch'),       // h5统计参数，目前没用
 *      searchType: sessionStorage.getItem('pageSource'),   // h5统计参数，目前没用
 *      isLogin: opts.is_login === '1' ? '1' : '0',         // h5统计参数，目前没用
 *      
 *      manufacturer: UaDevice.device.manufacturer,         // 目前没用
 *      obj_source: document.referrer,                      // 目前没用
 *      obj_param2: UaDevice.browser.name                   // 目前没用
 * };
 * 
 * 
 * 目前的参数需要这些，考虑到下载中间页的设计，可以用fr进行映射，后续downloadUrl也没必要传
 * app = {
 *      locate: '',                 // 导流的名字
 *      page: '',                   // 页面名字
 *      param: {
 *          tid: '',                // 帖子id
 *          kw: '',                 // 吧名字
 *      },
 *      noDownload: false,          // 是否下载
 *      callManufacturer: false,    // 是否需要调起厂商的应用商店
 *      ios9DownUrl: ''             // ios9的调起参数
 *      iosDownUrl: ''              // ios的下载链接
 *      androidDownUrl: ''          // android的下载链接
 *      from: 'bpush',              // 统计参数，大部分都是bpush
 * }
 */

class WakeUpApp {

    constructor() {
        this.os = Ua.os.name;
        this.osVersion = parseFloat(Ua.os.version);
        this.browser = Ua.browser.name;
        this.device = Ua.device.name;
    }
    /**
     * 判断ua，进入对应的调起函数
     */

    init(userConfig = {}) {
        // 合并下用户输入的配置
        this.config = Object.assign({}, Config, userConfig);
        if (!userConfig.page) {
            return;
        }
        if (this.browser === 'weixin') {
            this.yingyongbaoOpen();
        } else if (this.os === 'ios' && this.osVersion >= 9) {
            this.universalLinkOpen();
        } else {
            this.schemaOpen();
        }
    }

    /** 
     * android和ios9以下通过schema调起
     */
    schemaOpen() {
        let isAndroid = this.os === 'android';
        let url
        if (isAndroid) {
            url = this.getAndroidSchemaUrl();
            this.callManufacturer();
        } else {
            url = this.getIosSchemaUrl();
        }
        this.lastDate = Date.now();
        this.iframeOpen(url, 'callAppIframe');
        this.callDownLoad(isAndroid);
    }
    /** 
     * ios9以上通过universalLink调起
     */
    universalLinkOpen() {
        if (!this.config.ios9DownUrl) {
            return;
        }
        location.href = this.config.ios9DownUrl;
    }

    /**
     * 如果在微信里就来应用宝
     */
    yingyongbaoOpen() {
        let url = `${this.config.yingyongbaoUrl}&android_schema=${this.getAndroidSchemaUrl()}`;
        if (this.os === 'ios') {
            url = `${this.config.yingyongbaoUrl}&ios_scheme=${this.getIosSchemaUrl()}`;
        }
        location.href = url;
    }

    getReferSource(refer) {
        let source = 'other';
        if (refer === '') {
            source = 'no_refer';
        } else if (refer.indexOf('m.baidu.com') > -1 || refer.indexOf('www.baidu.com') > -1) {
            source = 'baidu';
        } else if (refer.indexOf('sogou.com') > -1) {
            source = 'sogou';
        } else if (refer.indexOf('m.sm.cn') > -1) {
            source = 'shenma';
        } else if (refer.indexOf('bing.com') > -1) {
            source = 'bing';
        } else if (refer.indexOf('google.com') > -1) {
            source = 'google';
        } else if (refer.indexOf('youdao.com') > -1) {
            source = 'youdao';
        } else if (refer.indexOf('so.com') > -1) {
            source = '360';
        }
        return source;
    }


    getAndroidSchemaUrl() {
        let map = this.config.androidSchema;
        let protocol = map[this.config.page].protocol;
        let path = map[this.config.page].path;
        let param = typeof this.config.param === 'object' ? this.config.param : {};
        let paramStr = '';
        for (let key in param) {
            paramStr += `${key}=${param[key]}&`;
        }
        let url = `${protocol}://${path}//${paramStr}`;
        return url;
    }

    getIosSchemaUrl() {
        let map = this.config.iosSchema;
        let protocol = map[this.config.page].protocol;
        let path = map[this.config.page].path;
        let param = typeof this.config.param === 'object' ? this.config.param : {};
        let paramStr = '';
        for (let key in param) {
            paramStr += `${key}=${param[key]}&`;
        }
        return `${protocol}://${path}?${paramStr}`;
    }


    callManufacturer() {
        let androidAppStoreSchema = this.config.androidDeviceAppStore[this.device];
        if (this.config.callManufacturer && androidAppStoreSchema) {
            setTimeout(() => {
                this.iframeOpen(androidAppStoreSchema, 'callAppStore')
            }, 500);
        }
    }

    callDownLoad(isAndroid) {
        let timer;
        let hidden;
        let self = this;
        let eventArr = ['baiduboxappvisibilitychange', 'pagehide', 'visibilitychange', 'mozvisibilitychange', 'msvisibilitychange', 'webkitvisibilitychange'];
        if (typeof document.hidden !== 'undefined') {
            hidden = 'hidden';
        } else if (typeof document.msHidden !== 'undefined') {
            hidden = 'msHidden';
        } else if (typeof document.mozHidden !== 'undefined') {
            hidden = 'mozHidden';
        } else if (typeof document.webkitHidden !== 'undefined') {
            hidden = 'webkitHidden';
        }

        eventArr.map((item) => {
            document.addEventListener(item, e => {
                if (document[hidden] || e.hidden && timer) {
                    clearTimeout(timer);
                    return;
                }
            })
        });

        if (!this.config.noDownload) {
            let url = this.config.iosDownUrl || this.config.defaultDownloadUrl;
            if (isAndroid) {
                url = this.config.androidDownUrl || this.config.defaultDownloadUrl;
            }
            if (url) {
                timer = setTimeout(() => {
                    let now = Date.now();
                    let timeDiff = (now - self.lastDate) / 1000;
                    if (timeDiff > 2.1) {
                        return;
                    }
                    location.href = url;
                }, 1500);
            }
        }
    }

    iframeOpen(url, nodeId) {
        if (!url) {
            return;
        }
        let rawNode = document.querySelector(`#${nodeId}`);
        let body = document.body;
        if (rawNode) {
            body.removeChild(rawNode);
        }
        let node = document.createElement('iframe');
        node.id = nodeId;
        node.style.display = 'none';
        node.src = url;
        body.appendChild(node);
    }

}


export default new WakeUpApp();