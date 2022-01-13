"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CACHE_JSON_NAME = exports.packageJsonFieldsToExclude = exports.DEFAULT_GIT_REPO_URL = exports.CACHE_FOLDER_NAME = exports.buildInRegistryList = exports.BOILERPLATE_PREFIX_NAME = exports.PACKAGE_SCOPE = exports.SupportedPackageManager = exports.LoggerType = exports.packageJson = void 0;
exports.packageJson = require("../../package.json");
var LoggerType;
(function (LoggerType) {
    LoggerType["info"] = "info";
    LoggerType["error"] = "error";
    LoggerType["warning"] = "warning";
    LoggerType["log"] = "log";
    LoggerType["success"] = "success";
})(LoggerType = exports.LoggerType || (exports.LoggerType = {}));
var SupportedPackageManager;
(function (SupportedPackageManager) {
    SupportedPackageManager["npm"] = "npm";
    SupportedPackageManager["yarn"] = "yarn";
    SupportedPackageManager["pnpm"] = "pnpm";
    SupportedPackageManager["yarn_pnpm"] = "yarn_pnpm";
})(SupportedPackageManager = exports.SupportedPackageManager || (exports.SupportedPackageManager = {}));
exports.PACKAGE_SCOPE = '@unlimited-blade-work';
exports.BOILERPLATE_PREFIX_NAME = `${exports.PACKAGE_SCOPE}/create-`;
exports.buildInRegistryList = [
    'https://registry.npmjs.org',
    'https://registry.npm.taobao.org',
    'https://registry.yarnpkg.com',
];
exports.CACHE_FOLDER_NAME = '.unlimited-blade-works';
exports.DEFAULT_GIT_REPO_URL = 'https://github.com/NNNaix/unlimited-blade-works';
exports.packageJsonFieldsToExclude = ['author', 'homepage', 'repository', 'license', 'funding', 'contributors', 'bugs', 'maintainers'];
exports.CACHE_JSON_NAME = 'cache.json';
//# sourceMappingURL=const.js.map