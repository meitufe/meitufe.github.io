---
title:      '移动端网页调试'
author:     'lcat'
excerpts:   '移动端网页调试汇总'
---


### chrome 模拟器

> 非真机调试，开发期用来调试逻辑、ui适配、性能排查等。

1. pc chrome打开要调试页面
2. 打开chrome DevTools 
3. 选择 `toggle device toolbar`

![](/images/mobile-debugger/41.png)


### 安卓 chrome 浏览器调试

> 安卓 >= 4.0 支持。可能需要翻墙。能在 `chrome` 重现的，都建议在 `chrome` 调试。

1. 安卓打开 `chrome`
2. 安卓设置里打开USB调试，手机连接电脑，电脑安装手机驱动
3. pc `chrome` 打开 `chrome://inspect`
4. 勾选☑️ `Discover USB devices` 
5. 点击 `inspect` 调试

![](/images/mobile-debugger/21.jpg)


### 安卓 webview 调试

> 安卓 >= 4.4 支持。可能需要翻墙。

1. 客户端需要开启webview debugger，[设置方法](https://developers.google.com/web/tools/chrome-devtools/remote-debugging/webviews?hl=zh-cn)
2. 同上 `安卓 chrome 浏览器调试` 一致


### 安卓 x5 内核（微信、QQ 等）

> 接入 x5 内核的 APP 理论上都可以调试

1. [下载](http://bbs.mb.qq.com/thread-1416936-1-1.html)安装 `TBS Studio`
2. 连接手机，允许USB调试
3. 打开要调试的页面
4. 检测是否支持 TBS 
5. 设定 TBS 调试状态
6. 启动检测


### ios safari 浏览器调试

1. ios 设置 -> safari -> 高级 -> ☑️web检查器
2. pc safari 偏好设置 -> 高级 -> ☑️在菜单栏中显示`开发`菜单
3. ios 连接电脑
4. ios safari 打开要调试的页面
5. pc safari 开发 -> ios设备名 -> 选择要调试的页面


### ios webview

1. ios有签名校验机制，正式包不允许 safari 调试，所以必须是测试带签名的包
2. 其他操作同上👆


### [ios-webkit-debug-proxy](https://github.com/google/ios-webkit-debug-proxy)

> 目前只支持UIWebViews 不支持wkwebview


### [remotedebug-ios-webkit-adapter](https://github.com/RemoteDebug/remotedebug-ios-webkit-adapter)

> 基于 `ios-webkit-debug-proxy` 构建


### vConsole

> 一个轻量、可拓展、针对手机网页的前端开发者调试面板。查看是否报错，查看网络请求，cookie localstorage，执行js脚本

1. $ npm i vconsole --save
2. 引入 `vconsole.js` 
3. 初始化 var vConsole = new VConsole();

![](/images/mobile-debugger/31.png)


### spy-debugger

> 封装了 `weinre` `node-mitmproxy` `AnyProxy`。不能断点

1. $ npm i spy-debugger -g
2. 手机跟pc连接同一个wifi
3. $ spy-debugger
4. 手机设置代理
5. 手机访问 `http://s.xxx` 安装证书（用于https）


### charles、fiddle抓包（终极武器）

> 抓取请求resq resp; map remote 替换线上资源文件调试


### 参考

1. [远程调试 Android 设备使用入门 -- by Google](https://developers.google.com/web/tools/chrome-devtools/remote-debugging/?hl=zh-cn)
2. [远程调试 WebView -- by Google](https://developers.google.com/web/tools/chrome-devtools/remote-debugging/webviews?hl=zh-cn)
3. [各种 真机远程调试 方法 汇总](https://github.com/jieyou/remote_inspect_web_on_real_device)
4. [Hello RemoteDebug iOS WebKit Adapter: Debug Safari and iOS WebViews from anywhere 📡📱](https://medium.com/@auchenberg/hello-remotedebug-ios-webkit-adapter-debug-safari-and-ios-webviews-from-anywhere-2a8553df7465)
5. [RemoteDebug iOS Webkit Adapter（适配器）：一个可以让你（随时）随地调试Safari、 iOS WebView（的适配器） 📡📱](https://www.w3ctech.com/topic/2034)


