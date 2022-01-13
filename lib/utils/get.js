"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHttpClientAdapter = exports.getCacheTemplatePackageName = exports.getCachePath = exports.getHomeCrossPlatform = exports.getProxy = exports.getAvailableTemplateList = exports.getTemplatePackageTarballUrl = void 0;
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const libnpmsearch_1 = __importDefault(require("libnpmsearch"));
const const_1 = require("./const");
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const logs_1 = __importDefault(require("./logs"));
const { error } = logs_1.default;
function getTemplatePackageTarballUrl(registry, templateName) {
    return new Promise((resolve, reject) => {
        getHttpClientAdapter(registry).get(`${registry}/${templateName}`, res => {
            if (res.statusCode === 200) {
                let body = '';
                res.on('data', data => (body += data));
                res.on('end', () => {
                    const template = JSON.parse(body);
                    resolve(template.versions[template['dist-tags'].latest].dist.tarball);
                });
            }
            else {
                reject(res.statusMessage);
            }
        })
            .on('error', (err) => {
            reject(err);
        });
    });
}
exports.getTemplatePackageTarballUrl = getTemplatePackageTarballUrl;
// 基于选择的模板名称路径获取 package 名称.
// export function getPackageInfo(installPackage) {
//     if (installPackage.match(/^.+\.(tgz|tar\.gz)$/)) {
//         return getTemporaryDirectory()
//             .then(obj => {
//                 let stream;
//                 if (/^http/.test(installPackage)) {
//                     stream = hyperquest(installPackage);
//                 } else {
//                     stream = fs.createReadStream(installPackage);
//                 }
//                 return extractStream(stream, obj.tmpdir).then(() => obj);
//             })
//             .then(obj => {
//                 const { name, version } = require(path.join(
//                     obj.tmpdir,
//                     'package.json'
//                 ));
//                 obj.cleanup();
//                 return { name, version };
//             })
//             .catch(err => {
//                 // The package name could be with or without semver version, e.g. react-scripts-0.2.0-alpha.1.tgz
//                 // However, this function returns package name only without semver version.
//                 console.log(
//                     `Could not extract the package name from the archive: ${err.message}`
//                 );
//                 const assumedProjectName = installPackage.match(
//                     /^.+\/(.+?)(?:-\d+.+)?\.(tgz|tar\.gz)$/
//                 )[1];
//                 console.log(
//                     `Based on the filename, assuming it is "${chalk.cyan(
//                         assumedProjectName
//                     )}"`
//                 );
//                 return Promise.resolve({ name: assumedProjectName });
//             });
//     } else if (installPackage.startsWith('git+')) {
//         // Pull package name out of git urls e.g:
//         // git+https://github.com/mycompany/react-scripts.git
//         // git+ssh://github.com/mycompany/react-scripts.git#v1.2.3
//         return Promise.resolve({
//             name: installPackage.match(/([^/]+)\.git(#.*)?$/)[1],
//         });
//     } else if (installPackage.match(/.+@/)) {
//         // Do not match @scope/ when stripping off @version or @tag
//         return Promise.resolve({
//             name: installPackage.charAt(0) + installPackage.substr(1).split('@')[0],
//             version: installPackage.split('@')[1],
//         });
//     } else if (installPackage.match(/^file:/)) {
//         const installPackagePath = installPackage.match(/^file:(.*)?$/)[1];
//         const { name, version } = require(path.join(
//             installPackagePath,
//             'package.json'
//         ));
//         return Promise.resolve({ name, version });
//     }
//     return Promise.resolve({ name: installPackage });
// }
function getTemplateSelection(tpl) {
    var _a;
    return {
        name: `${tpl.name} ${chalk_1.default.grey(`- ${(_a = tpl.description) !== null && _a !== void 0 ? _a : `v${tpl.version}`}`)}`,
        value: tpl
    };
}
async function getAvailableTemplateList(registry, template = '', isOffline = false) {
    try {
        if (!isOffline) {
            return libnpmsearch_1.default(template || const_1.PACKAGE_SCOPE, { registry })
                .then(list => list
                .filter((tpl) => tpl.name.startsWith(const_1.BOILERPLATE_PREFIX_NAME) && tpl.name.includes(template) && tpl.name !== const_1.packageJson.name)
                .map((tpl) => getTemplateSelection(tpl)))
                .catch(err => {
                error(err.message);
                error(chalk_1.default.red(`获取远程项目工程模板列表失败.\n 请检查当前设备的网络环境以及代理设置或使用 ${chalk_1.default.green('\`--offline\`')} 参数以启用离线模式.`));
            });
        }
        else {
            const cacheJson = fs_extra_1.default.readJSONSync(path_1.default.resolve(getCachePath(), const_1.CACHE_JSON_NAME));
            return fs_extra_1.default.readdirSync(getCachePath(const_1.PACKAGE_SCOPE)).map(name => getTemplateSelection(cacheJson[`${const_1.PACKAGE_SCOPE}/${name}`])).filter(({ name }) => name.includes(template));
        }
    }
    catch (err) {
        error(err.message);
    }
}
exports.getAvailableTemplateList = getAvailableTemplateList;
function getProxy() {
    if (process.env.https_proxy) {
        return process.env.https_proxy;
    }
    else {
        try {
            // Trying to read https-proxy from .npmrc
            let httpsProxy = child_process_1.execSync('npm config get https-proxy').toString().trim();
            return httpsProxy !== 'null' ? httpsProxy : undefined;
        }
        catch (e) {
            return;
        }
    }
}
exports.getProxy = getProxy;
function getHomeCrossPlatform() {
    if (process.env.HOME)
        return process.env.HOME; // Linux
    return process.env.USERPROFILE; // Windows
}
exports.getHomeCrossPlatform = getHomeCrossPlatform;
function getCachePath(template = '') {
    const cacheDirectory = path_1.default.resolve(getHomeCrossPlatform(), const_1.CACHE_FOLDER_NAME);
    fs_extra_1.default.ensureDirSync(path_1.default.resolve(cacheDirectory, const_1.PACKAGE_SCOPE));
    return path_1.default.resolve(cacheDirectory, template);
}
exports.getCachePath = getCachePath;
function getCacheTemplatePackageName(name, version) {
    return `${name}.${version}.tar.gz`;
}
exports.getCacheTemplatePackageName = getCacheTemplatePackageName;
function getHttpClientAdapter(url) {
    return (url.startsWith('https') ? https_1.default : http_1.default);
}
exports.getHttpClientAdapter = getHttpClientAdapter;
// export function getTemplatePackageManager(): SupportedPackageManager{
//
// }
//# sourceMappingURL=get.js.map