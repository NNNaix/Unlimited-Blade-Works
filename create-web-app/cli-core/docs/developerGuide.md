# 开发者指南

## 如何为脚手架添加一个新的应用工程模板？

必要的脚手架接入流程是：

1. 新建一个 git 仓库并任意选择一个包管理（`npm`,`yarn`,`pnpm`）初始化
2. `package.json` 中的 `name` 字段为 `@cbim/create-<template-name>`
3. 将该包发布到私有源： 请联系基础设施维护人员 `gengpc@cbim.com.cn` 进行发布。

完成上述流程只是表示添加了一个模板在脚手架的应用工程模板列表里，能够使用脚手架初始化该模板。 但模板本身是否能够正常的接入平台，需要模板的开发者对接实现 Cbim 平台的集成方案。

## 应用模板如何管理？

个人管理：如果是任意非正式场景导致不需要长期维护该模板（测试学习等），可以使用个人源码仓库进行管理。

官方管理：如果有任意正式项目需要使用，建议在基础设施项目的 `/create-cbim-app/cbim-app-boilerplate/` 目录下新建一个名为 `<template-name>` 的文件夹以后进行统一管理。
这种方式最大的好处在于如果应用工程模板依赖的一些基础设施项目比如设计体系，rpc sdk 有新版本时可以联合发布。

## 应用模板的最佳实践

### 应用模板命名

`<template-name>`命名通常情况下应由 UI 框架和 BFF 框架组成，如 `react-nest-app` 或`vue-springboot-app`。

如果发现你自定义的应用模板按上述命名规范得出的命名和已有应用模板名称冲突，那么要确认你的应用模板提供的使用场景是否和已有模板有本质区别：

- 如果有本质的场景区别，可以通过为模板名称加入具体的场景描述词来区分，如 `<ui>-<bff>-<scenario>-app`
- 如果没有本质场景区别，那么请使用之前存在的模板。

### 应用模板描述

`package.json` 中的 `description` 字段会作为 _**模板选项的提示**_，对于应用模板其他的信息补充可以添加在这里。

### 支持情况

`package.json` 中的 `engines` 字段会用来在安装时校验用户运行时环境是否符合应用模板的有效版本支持区间。

示例：

```json
{
  "engines": {
    "node": "^14.16.0",
    "pnpm": ">=5"
  }
}

```

### 维护者

`package.json` 中的 `maintainers` 字段可以帮助用户在相关模板存在缺陷或有功能建议时可以联系到应用模板的负责人。

### 安装依赖
[only-allow](https://www.npmjs.com/package/only-allow) 会强制在项目中使用你指定的包管理器。

所以在`package.json` 中的 `scripts` 中加入一条脚本 `"preinstall": "npx only-allow <package-manager>"
`，可以强制在执行安装依赖之前检测当前的包管理器是否是模板指定的，这样可以避免原本指定的包管理器的 lock 文件失效导致可能的初始化失败。

示例：

```json
{
  "scripts": {
    "preinstall": "npx only-allow pnpm"
  }
}
```

### 包管理器选型

建议使用 `pnpm`，更安全，更快，占用磁盘空间更少，与其他包管理器的性能对比测试请看 [benchmark](https://pnpm.io/benchmark) 。

## 如何为应用实现代码质量保证工程？

### 为什么要做代码质量保证工程？

- 代码规范落地难：现成的代码规范必然会降低工程师实际开发过程中的效率，以换取更高的代码健壮性。但是缺乏强制性和有效提示的代码规范一方面提高了工程师开发过程中理解和遵守的成本，另一方面也在增加了审查人员和团队其他工程师阅读和沟通代码的成本。
- 代码审查反馈链路过长：任何一位拥有代码库权限的工程师都可以直接向远程仓库推入代码，如果这些代码是带有一些低级的风格错误，那么在 Review 时会消耗审查人员无意义的精力，并且延长反馈链路。如果发生代码冲突时则可能导致灾难性的后果。

### 核心原则

**在研发流程上，在更早的环节做更多的质量保证工作**。

理想情况下，reviewer 应当只侧重审查代码的设计与实现，而非编程规范。

### 以下主要涉及概念：

- [Lint](https://en.wikipedia.org/wiki/Lint_(software))
- [Git Stage](https://stackoverflow.com/questions/49228209/whats-the-use-of-the-staging-area-in-git)
- [Git Hook](https://git-scm.com/book/zh/v2/%E8%87%AA%E5%AE%9A%E4%B9%89-Git-Git-%E9%92%A9%E5%AD%90#_git_hooks)

### 技术选型：

#### [ESLint](https://eslint.org/) : 检查符合 TC39 Ecmascript 规范定义的语言

特性：

- 通过静态分析代码，构建 AST 以快速发现问题。
- 部分问题支持自动修复。
- 规则支持灵活的定制化。

配置思路： 社区最主流的方案主要是三种

- [Airbnb Coding Style](https://github.com/airbnb/javascript)
- [Google Coding Style](https://google.github.io/styleguide/jsguide.html)
- [Standard Coding Style](https://standardjs.com/)

三种方案大同小异，以 [create-react-nest-app](https://git.cbim.org.cn/cbim-platform/cbim-platform-infrastructure/tree/develop-alpha/create-cbim-app/cbim-app-boilerplate/create-react-nest-app)
应用模板为例，选择了社区采用率最高的 Airbnb 风格，又由于使用了 Typescript，所以还要加入 Typescript 推荐风格，最后补齐 react 和 react hook 风格。

示例配置：[.eslintrc.js](https://git.cbim.org.cn/cbim-platform/cbim-platform-infrastructure/tree/develop-alpha/create-cbim-app/cbim-app-boilerplate/create-react-nest-app/.eslintrc.js)

#### [Stylelint](https://stylelint.io/) : 检查样式语言

特性：

- 支持最新的CSS语法，包括自定义属性和CSS4
- 支持类CSS语法： SCSS, Sass, Less 和 SugarSS
- 自动修复大多数问题
- 支持自定义规则插件

配置思路：CSS 由于是 DSL，所以规范比较统一，跟着社区主流方案走即可。我们使用了 SCSS 作为 类 CSS 的预编译语言，所以要补上 SCSS 相关的检查支持。

示例配置：[.stylelintrc.json](https://git.cbim.org.cn/cbim-platform/cbim-platform-infrastructure/tree/develop-alpha/create-cbim-app/cbim-app-boilerplate/create-react-nest-app/.stylelintrc.json)

#### [Commitlint](https://commitlint.js.org/#/) : 检查 Git Commit 的提交信息

配置思路： 基于社区规范 [Conventional Commit Specification](https://www.conventionalcommits.org/en/v1.0.0/)
和 [Angular Commit Guideline](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit)  以及自定义规则来检查 commit
message。

示例配置：[.commitlintrc.js](https://git.cbim.org.cn/cbim-platform/cbim-platform-infrastructure/tree/develop-alpha/create-cbim-app/cbim-app-boilerplate/create-react-nest-app/.commitlintrc.js )

#### [Prettier](https://prettier.io/) : 一个 Opinionated 的代码格式化工具

可能有同学会问，我们的 lint 明明支持自动修复问题，为什么还要 prettier。首先一方面 lint 工具最主要还是发现问题，并且多个 lint
工具自身的插件的自动修复可能会产生不可控的冲突，出于解耦和安全的考虑，我认为根据规范格式化的功能应该交给 prettier 来处理。同时由于 prettier 是 Opinionated，所以只需要少部分配置就能完成非常理想的格式化效果。

配置思路：配合 ESLint 和 Stylelint 的配置，保证风格美化后的代码与检查要求一致。

示例配置：[.prettierrc](https://git.cbim.org.cn/cbim-platform/cbim-platform-infrastructure/tree/develop-alpha/create-cbim-app/cbim-app-boilerplate/create-react-nest-app/.prettierrc)

#### [Lint-Staged](https://github.com/okonet/lint-staged) : 帮助我们聚焦检查 Git Stage 区的文件

基于我们的实践原则，我们可以认为仓库中的代码是符合规范的，那么我们只需要检查我们改动的部分，或者说是本次需要提交的部分，从而缩小检查范围，提升开发效率。

示例配置：[package.json](https://git.cbim.org.cn/cbim-platform/cbim-platform-infrastructure/tree/develop-alpha/create-cbim-app/cbim-app-boilerplate/create-react-nest-app/package.json)
中的 lint-staged 字段

#### [Husky](https://github.com/typicode/husky) : 帮助我们更简单的注册 Git Hook

我们希望在每次 commit 时都能触发 lint 的任务流，所以我们使用了 husky 来注册 pre-commit hook ，配合 lint-stage 来检查 stage 区的代码和 commit message。

示例配置：[package.json](https://git.cbim.org.cn/cbim-platform/cbim-platform-infrastructure/tree/develop-alpha/create-cbim-app/cbim-app-boilerplate/create-react-nest-app/package.json)
中的 husky 字段

#### 总结：

通过上面的代码检查工作流，我们可以做到在每一次 Commit 时都会

- 检查代码风格
- 自动美化代码来保持风格一致
- 检查 Commit Message 风格
- 依赖完整性校验，避免因为本地开发中新增了依赖包却因为某种原因没有写入依赖管理文件中的问题（如果使用 pnpm 则不需要这一步，其他包管理器需要基于自身的命令实现，例如`yarn check --integrity`）。

我们的 lint 工作流内置于项目，即工程师克隆仓库到本地，并且执行初始化命令后，无需任何手动操作，可以无痛无感直接开发。最终本地提交代码到分支时，只有通过了这四项才会允许。在本地开发过程中节省大量精力和时间，因为 lint
会自动提醒错误以及提示可用的修复方案，在代码审查过程中只需要针对功能性而无需关注规范，避免了因为代码风格重构而导致产生冲突的问题。

最后，社区的最佳实践并非一成不变，如果您有更好的建议和实践思考，非常欢迎提出 issue 来讨论 :p。