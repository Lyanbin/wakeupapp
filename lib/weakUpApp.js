import Config from './config';
import Ua from 'mobile-useragent-parse';
/**
 * 
 * 
 * 
 * app = {
 *      locate: 'bottom_layer',  // 导流条位置，必填
 *      page: page, // 有默认，可覆盖
 *      param: {    // frs和pb的id，必填，否则进入的是首页
 *          threadId: opts.tid
 *      },
 *      callManufacturer: opts.manufacturerConfig.switch, // 是否调起厂商
 *      ios9DownUrl: ios9DownUrl, // 有默认，可覆盖
 *      iosDownUrl: iosDownUrl,   // 有默认，可覆盖
 *      androidDownUrl: androidDownUrl, // 有默认，可覆盖
 *      from: 'bpush', // 统计参数，大部分都是bpush
 
 *      task: 'H5导流',   // h5统计参数，目前没用
 *      isSearch: sessionStorage.getItem('isSearch'), // h5统计参数，目前没用
 *      searchType: sessionStorage.getItem('pageSource'), // h5统计参数，目前没用
 *      isLogin: opts.is_login === '1' ? '1' : '0', // h5统计参数，目前没用
 *      
 *      manufacturer: UaDevice.device.manufacturer, // 目前没用
 *      obj_source: document.referrer, // 目前没用
 *      obj_param2: UaDevice.browser.name // 目前没用
 * };
 *
 */

class WeakUpApp {

    constructor() {
        let bdidReg = document.cookie.match(/\bBAIDUID=([A-Z0-9]+)/);
        this.bdid = bdidReg ? bdidReg[1] : '';
        this.os = Ua.os.name;
        this.osVersion = parseFloat(Ua.os.version);
        this.browser = Ua.browser.name;
        this.device = Ua.device.name;

        // test
        this.init();
    }
    /**
     * 判断ua，进入对应的调起函数
     */

    init(userConfig = {}) {
        // todo 合并下用户输入的配置
        this.config = Object.assign({}, Config, userConfig);
        this.config.obj_source = this.getReferSource(document.referrer);
        if (!userConfig.page) {
            this.config.page = this.getPage();
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
        this.iframeOpen(url, 'tiebaCallAppIframe');
        this.callDownLoad(isAndroid);
    }
    /** 
     * ios9以上通过universalLink调起
     */
    universalLinkOpen() {
        if (!this.config.ios9DownUrl) {
            return;
        }
        let host = 'https://tieba.baidu.com';
        // todo
        let urlPath = '';
        let otherParamStr = `${this.config.ios9DownUrl}&obj_locate=${this.config.locate}&obj_source=${this.config.obj_source}&obj_param2=${this.browser}&bdid=${this.bdid}`;
        if (location.host === 'tieba.baidu.com') {
            host = 'https://wapp.baidu.com';
        }
        location.href = host + urlPath + otherParamStr;
    }
    /**
     * 如果在微信里就来应用宝
     */
    yingyongbaoOpen() {
        location.href = this.config.yingyongbaoUrl;
    }



    getReferSource(refer) {
        var source = 'other';
        switch (refer) {
            case '':
                source = 'no_refer';
                break;
            case refer.indexOf('m.baidu.com') > -1 || refer.indexOf('www.baidu.com') > -1:
                source = 'baidu';
                break;
            case refer.indexOf('sogou.com') > -1:
                source = 'sogou';
                break;
            case refer.indexOf('m.sm.cn') > -1:
                source = 'shenma';
                break;
            case refer.indexOf('bing.com') > -1:
                source = 'bing';
                break;
            case refer.indexOf('google.com') > -1:
                source = 'google';
                break;
            case refer.indexOf('youdao.com') > -1:
                source = 'youdao';
                break;
            case refer.indexOf('so.com') > -1:
                source = '360';
                break;
        }
        return source;
    }


    getPage() {
        let pathname = location.pathname;
        let search = location.search;
        if (pathname === '/') {
            return 'index';
        } else if (pathname === '/f') {
            return 'frs';
        } else if (/\/p\/\d+/.test(pathname)) {
            if (~search.indexOf('fr=share')) {
                return 'pbshare';
            } else {
                return 'pb';
            }
        }
        return 'index';
    }

    getAndroidSchemaUrl() {
        let map = this.config.androidSchema;
        let protocol = map[this.config.page].protocol;
        let path = map[this.config.page].path;
        let param = typeof this.config.param === 'object' ? this.config.param : {};
        let pageKV = map[this.config.page].param;
        let paramStr = '';

        if (typeof pageKV === 'object') {
            for (let key in pageKV) {
                let paramKey = pageKV[key] || '';
                let value = param[paramKey];
                paramStr += (key + '=' + value);
                // 这里是只有一个参数？原来open_app里就这样，不敢动
                break;
            }
        }
        paramStr = `obj_locate=${this.config.locate}&obj_source=${this.config.obj_source}&obj_param2=${this.browser}&bdid=${this.bdid}&fr=${this.config.from}&${paramStr}`;
        let url = `${protocol}://${path}//${paramStr}`;
        return url;
    }

    getIosSchemaUrl() {
        let map = this.config.iosSchema;
        let protocol = map[this.config.page].protocol;
        let path = map[this.config.page].path;
        let param = typeof this.config.param === 'object' ? this.config.param : {};
        let pageKV = map[this.config.page].param;
        let paramStr = '';
        if (typeof pageKV === 'object') {
            for (var key in pageKV) {
                var paramKey = pageKV[key] || '';
                var value = param[paramKey];
                paramStr += (key + '=' + value); // 草踏马这里原open_app写的啥之前
                break;
            }
        }
        paramStr = `${paramStr}&fr=${this.config.from}&obj_locate=${this.config.locate}&obj_source=${this.config.obj_source}&obj_param2=${this.browser}&bdid=${this.bdid}`;
        let url = `${protocol}://${path}?${paramStr}`;
    }

    
    callManufacturer() {
        let androidAppStoreSchema = this.config.androidDeviceAppStore[this.device];
        if (this.config.callManufacturer && androidAppStoreSchema) {
            setTimeout(() => {
                this.iframeOpen(androidAppStoreSchema, 'tiebaCallAppStore')
            }, 1000);
        }
    }

    callDownLoad(isAndroid) {
        if (!this.config.noDownload) {
            let url = this.config.iosDownUrl;
            if (isAndroid) {
                url = this.config.androidDownloadUrl;
            }
            if (url) {
                setTimeout(() => {
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


export default new WeakUpApp();