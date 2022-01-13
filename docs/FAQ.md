# 常见问题列表
# 为什么不支持 Yarn 2 aka Yarn Berry
首先，yarn berry 并不保证向前兼容 yarn，新的 feature 也并不是那么稳定，而且他的有些技术路线并不适合中小型项目，这是最主要的原因。

其次，个人认为未来前端包管理器的发展方向是
1. 更安全
2. 更快速

纵观官方的 `node_modules` 的依赖结构设计，由之前的黑洞般的树状结构到现在扁平化结构，只是修补，并没有解决根本问题。
扁平化后依赖提升导致的 Phantom dependencies 和 Doppelgangers 会造成安全隐患和性能问题。

目前能够解决上述问题的其实只有 `pnpm`的开创性的安装策略 和 `Yarn Berry` 的 Plug'n'Play 安装策略。
但 `pnpm` 性能比 `Yarn` 以及 `Yarn PnP` 更好.

`npm`、`Yarn`、`Yarn PnP`、`pnpm` 的benchmark对比请见 [pnpm benchmark](https://pnpm.io/benchmark) 。
故并没有非常充分的理由将旧有项目迁移到 `Yarn Berry` 或在新项目上使用它，`pnpm` 是一个更好的选择。

虽然的确要承认，`pnpm` 并没有完全解决非法访问的问题，如果在最安全的角度来讲，传统的 monorepo 管理工具在项目根目录都会使用 `package.json`，虽然他们往往会把名称置空，
设置为私有等等方式来“遮丑”，但只要在其中声明了一些依赖，就不可避免的在单个工作区中允许了非法访问的发生，尽管工作区中的 `package.json` 并没有声明这些依赖。
这是 `node` 的依赖解析机制导致的。

在这个角度，`rush` 比其他的任何 monorepo 方案更有优势，我相信这也是未来的前端 `monorepo` 工具的主流方向。
`rush` 的野心很大，想成为规范、最佳实践的制定者，但目前来看技术生态确实存在欠缺，不过仍旧可谓未来可期。

比如起 `yarn berry` 的功能大杂烩加鼓励 DIY 的路线，个人认为 `pnpm` 结合 `rush` 是对于研发流程标准化更好，技术上限更高的方案。

相关阅读推荐：
1. [关于现代包管理器的深度思考——为什么现在我更推荐 pnpm 而不是 npm/yarn?](https://juejin.cn/post/6932046455733485575)
2. [Why should we use pnpm?](https://www.kochan.io/nodejs/why-should-we-use-pnpm.html)
3. [Phantom dependencies](https://rushjs.io/pages/advanced/phantom_deps/)
4. [NPM doppelgangers](https://rushjs.io/pages/advanced/npm_doppelgangers/)