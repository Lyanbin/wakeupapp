import Config from './config';
import Ua from 'mobile-useragent-parse';


class WeakUpApp {

    constructor(config) {
        this.config = Config;
        this.os = Ua.os.name;
        this.osVersion = parseFloat(Ua.os.version);
        this.browser = Ua.browser.name;
        this.init();
        console.log(this);
    }
    /**
     * 判断ua，进入对应的调起函数
     */

    init() {
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
        console.log('其他只能schema！');
    }
    /** 
     * ios9以上通过universalLink调起
     */
    universalLinkOpen() {
        console.log('ios9以上可以进入universalLink！');
    }
    /**
     * 如果在微信里就来应用宝
     */
    yingyongbaoOpen() {
        console.log('微信粑粑只让进入应用宝！');
    }

}


export default new WeakUpApp();