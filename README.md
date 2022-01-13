# Unlimited Blade Works
<div>

[![NPM version][npm-image]][npm-url] [![NPM downloads][download-image]][npm-url] [![js-standard-style][standard-image]][standard-url] [![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)][repository-url] [![Status](https://img.shields.io/badge/status-active-success.svg)][repository-url]


</div>

> 此身為劍所成
>
> 身若鋼鐵 心如琉璃
>
> 縱橫無數戰場而不敗
>
> 然，此生毫無意義
>
> 其常立於劍丘之巔，獨醉於勝利之中
>
> 未曾一次敗退
>
> 未嘗得一知己
>
> 故如我祈求
>
> "無限劍制"

[npm-image]: http://img.shields.io/npm/v/create-unlimited-blade-works.svg?style=flat-square
[npm-url]: http://npmjs.org/package/create-unlimited-blade-works
[download-image]: https://img.shields.io/npm/dm/create-unlimited-blade-works.svg?style=flat-square
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg
[standard-url]: http://standardjs.com/
[repository-url]: TODO
[dev-doc-url]: TODO
[faq-url]: TODO



无限剑制是一个可以创建任何你需要的东西的脚手架，无需任何外部配置。

 - [开始创建](#user-content--开始创建) - 如何创建一个你想要的项目。
 - [开发者指南][dev-doc-url] -  如何为脚手架添加模板以及功能。

对于 Create Web App 的支持情况：
 - 操作系统：macOS，Windows 以及 Linux
 - 包管理器：npm，yarn，pnpm（不支持 yarn 2 aka yarn berry，原因见 [常见问题列表][faq-url]
 - node版本：>=10（以 package.json 中的 engines.node 字段为准）

## ✨ 功能特性
- 无需任何配置，一键快速创建任意场景的项目。
- 支持智能选择可用的注册源，保证安装流程的稳定性。
- 自动拉取 git 远程仓库。
- 支持缓存以及离线安装模式。
- 安全的写入策略。


## 🏁 快速上手
```zsh
npx create-unlimited-blade-works
```
为了永远使用最新的版本，不要通过全局安装来使用。如果你之前全局安装过 `create-unlimited-blade-works`，我们推荐你使用下面的命令卸载全局的安装：

- **npm**: `npm uninstall -g create-unlimited-blade-works`
- **yarn**: `yarn global remove create-unlimited-blade-works`
- **pnpm**: `pnpm remove -g create-unlimited-blade-works`


##  🌱 开始创建
你可以使用下面任意的方式来创建项目
### npx
```
npx create-unlimited-blade-works
```
_npx 是 npm 版本 >=5.2 后开箱自带的包运行工具，请升级 npm 以满足最低 >= 5.2。_


### npm
```
npm init unlimited-blade-works
```
_npm 版本 >= 6 时 `npm init <initializer>`  可用。_

### yarn
```
 yarn create unlimited-blade-works
```
_Yarn 版本 >= 0.25 时 `yarn create <starter-kit-package>` 可用。_

### pnpm
```
pnpm init @unlimited-blade-works
```
_npm 版本 >= 6 时 `pnpm init <initializer>`  可用。_
## ⚙️ 参数选项

### `--info`
- 参数类型：`boolean`
- 默认值：`false`
- 描述：仅输出环境调试信息，不执行初始化。
- 示例：
  ```
  npx create-unlimited-blade-works --info
  ```
### `--clean`
- 参数类型：`boolean`
- 默认值：`false`
- 描述：仅清理本地缓存数据，不执行初始化。
- 示例：
  ```
  npx create-unlimited-blade-works --clean
  ```

### `--registry <registry>`
- 参数类型：`string`
- 默认值：无默认值，如果没有指定注册源，则启用注册源自动选择模式，详情见参数 `--auto-registry`
- 描述：设置初始化项目过程中使用的注册源。
- 示例
  ```
  npx create-unlimited-blade-works --registry registry.npm.taobao.org
  ```
  


### `--root-directory <rootDirectory>`
- 参数类型：`string`
- 默认值： `process.cwd()` — 脚手架运行时所处目录
- 描述：设置项目初始化的根目录，<rootDirectory> 为绝对路径。
- 示例：
  ```
  npx create-unlimited-blade-works --root-directory /apps
  ```
### `--remote-repo <remoteRepo>`
- 参数类型：`string`
- 默认值：无默认值。
- 描述：设置项目的 git 远程仓库地址。
- 示例：
  ```
  npx create-unlimited-blade-works --remote-repo https://github.com/NNNaix/cyber-bones-cli-web-app-example
  ```


### `--offline`
- 参数类型：`boolean`
- 默认值：`false`
- 描述：脚手架默认基于远程注册源 `registry` 获取数据，为 `true` 时启用离线模式，将使用本地缓存数据来替代远程注册源。
- 示例：
  ```
  npx create-unlimited-blade-works --offline
  ```

### `--override`
- 参数类型：`boolean`
- 默认值：`false`
- 描述：脚手架默认使用安全的写入策略，如果项目初始化目录存在白名单以外的文件则警告并终止写入，为 `true` 时启用覆写模式，会强制覆盖掉和模板产生冲突的文件。
- 示例：
  ```
  npx create-unlimited-blade-works --override
  ```

### `--auto-registry`
- 参数类型：`boolean`
- 默认值：`false`
- 描述：启用注册源自动选择模式，会基于内置注册源列表自动检测可用的注册源进行初始化（作用优先级低于 `--registry`），内置注册源有：
  - `registry.npmjs.org`
  - `registry.npm.taobao.org`
  - `registry.yarnpkg.com`
- 示例：
  ```
  npx create-unlimited-blade-works --auto-registry
  ```
  
## 📖 开发者指南
查看 [开发者指南][dev-doc-url]

## 🗺 路线图
- 检测工程模板中的包管理器类型，并尝试自动安装依赖。
- 增加基于 [PGP signature](https://docs.npmjs.com/verifying-the-pgp-signature-for-a-package-from-the-npm-public-registry)  项目模板完整性校验机制，虽然 TCP 可以保证网络传输中数据的完整性，但我们获取的包仍可能各种风险，更多规范细节请见 [W3C - Subresource Integrity](https://w3c.github.io/webappsec-subresource-integrity/ )。（优先级不高，作为边缘场景）


## 🚨 常见问题
查看 [常见问题列表][faq-url]

## 🎨 设计理念

> "删繁就简，道法自然"

- **至简**：去除繁复，保留核心，不管是模板还是脚手架的设计都遵循该理念，最大限度降低开发者的上手和使用成本。
- **自然**：
    - 技术生态：遵循 npm 生态的[初始化规范]( https://docs.npmjs.com/cli/v7/commands/npm-init )，尊重开发模板的技术栈自由，这是所谓技术生态的自然。
    - [心流]( https://zh.wikipedia.org/wiki/%E5%BF%83%E6%B5%81%E7%90%86%E8%AB%96 )：脚手架应当最大限度帮开发者做好一切原本开发者不需要也不应该关心的决策和辅助，这是所谓心流的自然。

## 🎉 知识
下面是给予了 Unlimited Blade Works 灵感的项目。
- [create-react-app](https://github.com/facebook/create-react-app/tree/master/packages/create-react-app) -  Set up a modern web app by running one command.
- [npm-cli](https://github.com/npm/cli) - the package manager for JavaScript.
- [vue-cli](https://github.com/vuejs/vue-cli) - 🛠️ Standard Tooling for Vue.js Development.
- [angular-cli](https://github.com/angular/angular-cli) - CLI tool for Angular.
