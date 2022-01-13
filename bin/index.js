#!/usr/bin/env node
'use strict';

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   /!\ 禁止修改此文件 /!\
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// create-web-app 唯一的功能就是初始化仓库.
// 修改该文件的唯一原因是为 `create-web-app` 添加更多的警告和命令的故障排除信息.
// 尽可能避免添加破坏向前兼容的更改！！
// 对新的语言特性也要小心.
//
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   /!\ 禁止修改此文件 /!\
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


// 为 `ps` 命令显示的进程提供一个标题.
// 不要以 Symbol 开头，因为 mac 存在模糊的 bug.
try {
    process.title = 'create-unlimited-blade-works ' + Array.from(process.argv).slice(2).join(' ');
} catch (_) {
    // If an error happened above, use the most basic title.
    process.title = 'create-unlimited-blade-works';
}

// 旧版本 node 可能不支持 let 或 const.
var chalk = require('chalk')
var semver = require('semver')
var supportedNodeVersion = require('../package.json').engines.node
var currentNodeVersion = process.versions.node;
var major = currentNodeVersion.split('.')[0];
var tipsColor = chalk.hex('#ADADADCE')
var linkColor = chalk.hex('#5F9EA0')
var versionColor = chalk.hex('#008080')
if (semver.satisfies(major, supportedNodeVersion)) {
    console.error(
        '\n' +
        '您当前运行的 Node 版本为：' + versionColor.bold(currentNodeVersion) +
        '.\n' +
        chalk.yellow('创建项目需要 Node 版本为：' + chalk.yellowBright.bold(supportedNodeVersion) + ' ，请升级 Node 至脚手架支持的最低版本.') +
        '\n\n' +
        tipsColor('您可以访问 ' + linkColor('https://nodejs.org/en/') + ' 以获得 Node 的升级引导.\n') +
        tipsColor('推荐您使用 nvm 来更好的管理 Node 版本.\n') +
        tipsColor('  - Windows 用户可以访问 ' + linkColor('https://github.com/coreybutler/nvm-windows') + ' 获得安装引导.\n') +
        tipsColor('  - Unix, MacOS 等用户可以访问 ' + linkColor('https://github.com/nvm-sh/nvm') + ' 获得安装引导.')
    );
    process.exit(1);
}

const {init} = require('../lib/createUnlimitedBladeWorks.js');

init()


