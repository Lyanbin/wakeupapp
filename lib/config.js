/**
 * @file index
 * @author lyb
 */

export default {
    androidSchema: {
        frs: {
            protocol: 'tbfrs',
            path: 'tieba.bai' + 'du.com',
        },
        pb: {
            protocol: 'tbpb',
            path: 'tieba.bai' + 'du.com',
        },
        index: {
            protocol: 'tbmaintab',
            path: 'tieba.bai' + 'du.com',
        }
    },
    iosSchema: {
        frs: {
            protocol: 'com.baidu.tieba',
            path: 'jumptoforum',
        },
        pb: {
            protocol: 'com.baidu.tieba',
            path: 'jumptoforum',
        },
        index: {
            protocol: 'com.baidu.tieba',
            path: 'jumptoforum'
        }
    },
    defaultDownloadUrl: 'http://c.tieba.baidu.com/c/s/download/wap',
    yingyongbaoUrl: 'http://a.app.qq.com/o/simple.jsp?pkgname=com.baidu.tieba',
    androidDeviceAppStore: {
        huawei: 'appmarket://details?id=com.baidu.tieba',
        oppo: 'oppomarket://details?packagename=com.baidu.tieba',
        vivo: 'vivomarket://details?id=com.baidu.tieba',
        xiaomi: 'mimarket://details?id=com.baidu.tieba&back=true',
        samsung: 'samsungapps://ProductDetail/com.baidu.tieba'
    }
};