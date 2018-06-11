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
 *      page: '',                   // 页面名字，pb，frs，index
 *      param: {
 *          tid: '',                // 帖子id
 *          kw: '',                 // 吧名字
 *      },
 *      noDownload: false,          // 是否下载
 *      callManufacturer: false,    // 是否需要调起厂商的应用商店
 *      ios9DownUrl: ''             // ios9的调起参数fr=？
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
        let bdidReg = document.cookie.match(/\bBAIDUID=([A-Z0-9]+)/);
        this.bdid = bdidReg ? bdidReg[1] : '';
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
        let host = 'https://bbs.baidu.com';
        let urlPath = '/mo/q/activityDiversion/download?';
        if (this.config.page === 'pb' && this.config.param.tid) {
            urlPath = `/p/${this.config.param.tid}?`;
        } else if (this.config.page === 'frs' && this.config.param.kw) {
            urlPath = `/f?kw=${this.config.param.kw}&`
        }
        let ownStatParam = `obj_locate=${this.config.locate}&obj_source=${this.config.obj_source}&obj_param2=${this.browser}&bdid=${this.bdid}`;
        let otherParamStr = `${this.config.ios9DownUrl}&${ownStatParam}`;
        // if (location.host === 'tieba.baidu.com') {
        //     host = 'https://wapp.baidu.com';
        // }
        location.href = `${host}${urlPath || '?'}${otherParamStr}`;
    }

    /**
     * 假如给定url，则该方法转换链接
     */
    getUniversalLink(targetUrl) {
        let httpReg = /^(?:http|https):/;
        if (!httpReg.test(targetUrl)) {
            targetUrl = `https://${targetUrl}`;
        }
        let reg = /^(?:http|https):\/\/tieba\.baidu\.com/;
        let newUrl = '';
        if (reg.test(targetUrl)) {
            newUrl = targetUrl.replace(reg, 'https://bbs.baidu.com');
        } else {
            newUrl = targetUrl.replace(/^(?:http|https):\/\/[a-z.]+?\.baidu\.com/, 'https://tieba.baidu.com');
        }
        let bdidReg = document.cookie.match(/\bBAIDUID=([A-Z0-9]+)/);
        let bdid = bdidReg ? bdidReg[1] : '';
        newUrl = newUrl.indexOf('?') > -1 ? `${newUrl}&bdid=${bdid}` : `${newUrl}?bdid=${bdid}`;
        return newUrl;
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
        let paramStr = '';
        for (let key in param) {
            paramStr += `${key}=${param[key]}&`;
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
        let paramStr = '';
        for (let key in param) {
            paramStr += `${key}=${param[key]}&`;
        }
        paramStr = `${paramStr}&fr=${this.config.from}&obj_locate=${this.config.locate}&obj_source=${this.config.obj_source}&obj_param2=${this.browser}&bdid=${this.bdid}`;
        let url = `${protocol}://${path}?${paramStr}`;
    }


    callManufacturer() {
        let androidAppStoreSchema = this.config.androidDeviceAppStore[this.device];
        if (this.config.callManufacturer && androidAppStoreSchema) {
            setTimeout(() => {
                this.iframeOpen(androidAppStoreSchema, 'tiebaCallAppStore')
            }, 500);
        }
    }

    callDownLoad(isAndroid) {
        if (!this.config.noDownload) {
            let url = this.config.iosDownUrl || this.config.defaultDownloadUrl;
            if (isAndroid) {
                url = this.config.androidDownUrl || this.config.defaultDownloadUrl;
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


export default new WekeUpApp();