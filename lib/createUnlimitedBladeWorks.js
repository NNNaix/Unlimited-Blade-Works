"use strict";
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// 现阶段唯一的作用就是初始化模板.
// 修改该文件的唯一原因是为 `createSwordBone` 添加更多的警告和命令的故障排除信息.
// 尽可能避免添加破坏向前兼容的更改！
// 对新的语言特性也要小心.
//
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = __importDefault(require("commander"));
const envinfo_1 = __importDefault(require("envinfo"));
const child_process_1 = require("child_process");
const semver_1 = __importDefault(require("semver"));
const logs_1 = __importDefault(require("./utils/logs"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const os_1 = __importDefault(require("os"));
const inquirer_1 = __importDefault(require("inquirer"));
const const_1 = require("./utils/const");
const compressing_1 = require("compressing");
const check_1 = require("./utils/check");
const get_1 = require("./utils/get");
inquirer_1.default.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
const { log, warning, info, success, error } = logs_1.default;
let registry;
let enableOffline;
let enableOverride;
async function init() {
    var _a, _b, _c;
    const program = new commander_1.default.Command(const_1.packageJson.name)
        .version(const_1.packageJson.version)
        .usage(`[选项]`)
        // .option('--verbose', '输出更详细的日志')
        .option('--info', '仅输出环境调试信息，不执行初始化')
        .option('--clean', '仅清理本地缓存数据，不执行初始化')
        .option('--registry <registry>', '设置初始化项目过程中使用的注册源')
        .option('--root-directory <rootDirectory>', '设置项目初始化的根目录，<rootDirectory> 为绝对路径')
        .option('--remote-repo <remoteRepo>', '设置项目的 git 远程仓库地址')
        .option('--offline', '启用离线模式，将使用本地缓存数据来替代远程注册源')
        .option('--override', '启用覆写模式，会强制覆盖掉和项目工程模板产生冲突的文件')
        // TODO
        // .option(
        //     '--plugin <alternative-package>',
        //     '使用一个本地的脚手架插件'
        // )
        // .option(
        //     '--local-template <path-to-template>',
        //     '指定一个来自本地的模板'
        // )
        // .option('--use-yarn', '使用 yarn 作为包管理器初始化项目')
        // .option('--use-yarn-pnp', '使用 yarn 作为包管理器同时启用 Plug\'n\'Play\n 安装策略初始化项目 ')
        // .option('--use-pnpm', '使用 pnpm 作为包管理器初始化项目')
        .allowUnknownOption()
        .on('--help', () => {
        log();
        log(`  如果不指定 ${chalk_1.default.green('--registry')}，模板将默认启用注册源自动选择模式，会基于内置注册源列表自动检测可用的注册源进行初始化.`);
        log();
        log(`  如果不指定 ${chalk_1.default.green('--root-directory')}，项目将默认使用当前目录: ${chalk_1.default.green(process.cwd())} 进行初始化.`);
        log();
        log(`  如果不指定 ${chalk_1.default.green('--remote-repo')}，项目将不会进行 git 仓库的同步.`);
        log();
        log(`  如果不指定 ${chalk_1.default.green('--override')}，脚手架将默认使用安全的写入策略，如果项目初始化目录存在白名单以外的文件则警告并终止写入.`);
        // log(`    一个自定义的 ${chalk.cyan('--local-template')} 可以是下列之一:`);
        // log(
        //     `      - 一个发布在 npm 上 @cyber-bones/app-boilerplate 仓库下的自定义模板: ${chalk.green(
        //         'my-custom-template'
        //     )}`
        // );
        // log(
        //     `      - 一个相对当前工作目录的本地路径: ${chalk.green(
        //         'file:../my-custom-template'
        //     )}`
        // );
        log();
        log(`  如果你发现当前功能存在缺陷亦或是对脚手架的后续开发方向有更好的建议, 请联系 ${chalk_1.default.cyan(const_1.packageJson.author.email)} 或直接提出你的 issue:`);
        log(`  ${chalk_1.default.cyan(const_1.packageJson.repository.url)}`);
        log();
    })
        .parse(process.argv);
    const opts = program.opts();
    const rootDirectory = (_a = opts.rootDirectory) !== null && _a !== void 0 ? _a : process.cwd();
    enableOffline = (_b = opts.offline) !== null && _b !== void 0 ? _b : false;
    enableOverride = (_c = opts.override) !== null && _c !== void 0 ? _c : false;
    if (opts.info) {
        log(chalk_1.default.bold('\n 环境信息:'));
        log(`\n ${const_1.packageJson.name} 当前版本: ${const_1.packageJson.version}`);
        log(`  脚手架启动路径： ${process.cwd()}`);
        log(`  项目初始化根目录： ${rootDirectory}`);
        return envinfo_1.default
            .run({
            System: ['OS', 'CPU'],
            Binaries: ['Node', 'npm', 'Yarn', 'pnpm'],
            Browsers: [
                'Chrome',
                'Edge',
                'Internet Explorer',
                'Firefox',
                'Safari',
            ]
        }, {
            duplicates: true,
            showNotFound: true,
        })
            .then(log);
    }
    if (opts.clean) {
        try {
            const cachePath = get_1.getCachePath();
            fs_extra_1.default.removeSync(cachePath);
            success(`缓存已移除: ${cachePath}`);
        }
        catch (err) {
            error(err.message);
        }
        process.exit(1);
    }
    if (!enableOffline) {
        if (opts.registry && (await check_1.checkIfRegistryOnline(opts.registry)).isOnline) {
            registry = opts.registry;
        }
        else {
            const registryOnlineStatusList = await check_1.checkIfBuildInRegistryListOnline();
            registry = registryOnlineStatusList.reduce((p, c) => p !== null && p !== void 0 ? p : (c.isOnline ? c.registry : p), undefined);
            if (!registry) {
                log(`无可用的注册源，请检查当前设备的网络环境以及代理设置或使用 ${chalk_1.default.green('\`--offline\`')} 参数以启用离线模式`);
                process.exit(1);
            }
        }
        log(`正在使用注册源: ${chalk_1.default.green(registry)} 初始化项目.`);
    }
    else {
        log(`正在使用离线模式初始化项目.`);
    }
    // 我们首先直接通过 API 检查注册源 create-web-app 是否是最新版本，如果失败我们尝试性能更差的 `npm view [package] version` 命令.
    // 这对那些处于直接访问 npm 时被防火墙拦截的环境中的用户非常重要, 以及注册源是私有源的情况.
    (!enableOffline ? (check_1.checkForLatestVersion(registry)
        .catch(() => {
        try {
            return child_process_1.execSync(`npm view ${const_1.packageJson.name} version`).toString().trim();
        }
        catch (e) {
            return null;
        }
    })) : Promise.resolve(null)).then((latest) => {
        if (latest && semver_1.default.lt(const_1.packageJson.version, latest)) {
            log();
            warning(chalk_1.default.yellow(`您正在运行 \`${const_1.packageJson.name}\` ${const_1.packageJson.version}, 当前版本落后于最新版本 (${latest}).\n\n` +
                `我们不支持全局安装 \`${const_1.packageJson.name}\`.`));
            log();
            log('请使用下面的命令卸载全局依赖:\n' +
                `- npm uninstall -g ${const_1.packageJson.name}\n` +
                `- yarn global remove ${const_1.packageJson.name}\n` +
                `- pnpm remove -g ${const_1.packageJson.name}`);
            log();
            log('请参考最新的文档创建模板 :\n' +
                `https://www.npmjs.com/package/${const_1.packageJson.name}`);
            log();
            process.exit(1);
        }
        else {
            inquirer_1.default
                .prompt([{
                    type: 'input',
                    name: 'name',
                    message: '项目名称:',
                    prefix: '',
                    validate(name) {
                        return check_1.checkAppName(name);
                    }
                }, {
                    type: 'input',
                    name: 'version',
                    message: '版本:',
                    prefix: '',
                    default: '1.0.0',
                    validate(version) {
                        const isVersionValid = !!semver_1.default.valid(version);
                        !isVersionValid && error(chalk_1.default.red(`无效的版本，请使用符合语义化规范的版本号，更多信息请查看 https://semver.org/`));
                        return isVersionValid;
                    }
                }, {
                    type: 'input',
                    name: 'description',
                    message: '描述:',
                    prefix: '',
                    transformer(description) {
                        return description !== null && description !== void 0 ? description : '';
                    }
                }, {
                    type: 'autocomplete',
                    name: 'template',
                    prefix: '',
                    message: `请选择项目工程模板${enableOffline ? '[离线模式]' : ''}:`,
                    source: (_, template) => get_1.getAvailableTemplateList(registry, template, enableOffline)
                },
            ])
                .then((initParams) => {
                createApp(Object.assign({ remoteRepoUrl: opts.remoteRepo, rootDirectory: rootDirectory, verbose: opts.verbose }, initParams));
            });
        }
    });
}
exports.init = init;
async function createApp({ name, version, description, rootDirectory, verbose, template, remoteRepoUrl, }) {
    const appDirectory = path_1.default.resolve(rootDirectory, name);
    const unsupportedNodeVersion = !semver_1.default.satisfies(process.version, const_1.packageJson.engines.node);
    log();
    log(`当前位于 ${chalk_1.default.green(appDirectory)}，项目正在初始化...`);
    log();
    if (unsupportedNodeVersion) {
        log(chalk_1.default.yellow(`您正在使用的 Node 版本为： ${process.version}， \`${const_1.packageJson.name}\` ，项目将使用不支持的旧版本工具初始化.\n\n` +
            `请更新到 Node ${const_1.packageJson.engines.node} 以获得一个更好的，全面支持的开发体验.\n`));
    }
    if (!const_1.DEFAULT_GIT_REPO_URL) {
        info('没有指定远程仓库，即将跳过 git 初始化，请后续手动执行:\n');
        info(`git init`);
        info(`git remote add origin ${remoteRepoUrl}\n`);
    }
    else if (!enableOffline) {
        try {
            log(child_process_1.execSync(`git clone ${remoteRepoUrl} ${appDirectory}`).toString().trim());
        }
        catch (e) {
            warning('git clone 远程仓库失败，即将跳过 git 初始化，请后续手动执行:\n');
            info(`git init`);
            info(`git remote add origin ${remoteRepoUrl}\n`);
            error(e);
        }
    }
    fs_extra_1.default.ensureDirSync(appDirectory);
    if (!enableOverride && !check_1.isSafeToCreateProjectIn(appDirectory)) {
        process.exit(1);
    }
    process.chdir(appDirectory);
    const cacheTemplatePackagePath = await useCache(template);
    await unpackFromCache(cacheTemplatePackagePath, appDirectory);
    updateAppPackageJson(appDirectory, {
        name,
        version,
        description,
        private: true
    });
    updateNpmrc(appDirectory);
    // install()
    success('项目初始化完成，请参考项目目录下 README.md 进行后续开发.');
}
/**
 * 1. 检查本地缓存是否命中（模板名是否完全匹配，模板名中自带版本）
 * 2. 未命中时下载最新模板并替换旧缓存数据
 * @param template
 */
async function useCache(template) {
    let cacheTemplatePackagePath;
    if (cacheTemplatePackagePath = check_1.checkIfCouldUsingCache(template)) {
        log(`正在使用项目工程模板缓存: ${chalk_1.default.green(cacheTemplatePackagePath)}`);
    }
    else {
        if (enableOffline) {
            error(chalk_1.default.red('无可用的项目工程模板缓存.'));
        }
        else {
            const templateTarballUrl = await get_1.getTemplatePackageTarballUrl(registry, template.name);
            try {
                cacheTemplatePackagePath = await download(templateTarballUrl, template);
            }
            catch (e) {
                error(e.message);
                error(chalk_1.default.red(`项目工程模板下载失败.\n 请检查当前设备的网络环境以及代理设置或使用 ${chalk_1.default.green('\`--offline\`')} 参数以启用离线模式.`));
                process.exit(1);
            }
            // remove out-date template package
            const cachePath = get_1.getCachePath();
            fs_extra_1.default.readdirSync(cachePath).filter(name => {
                name.includes(template.name);
            }).forEach(name => {
                fs_extra_1.default.removeSync(path_1.default.resolve(cachePath, name));
            });
            updateCacheJson(cachePath, template);
        }
    }
    return cacheTemplatePackagePath;
}
async function unpackFromCache(cacheTemplatePackagePath, appDirectory) {
    log('正在解压项目工程模板...');
    return new Promise((resolve) => {
        const cachePath = get_1.getCachePath();
        // unpack to cachePath because npm package wrap files with 'package' folder.
        compressing_1.tgz.uncompress(cacheTemplatePackagePath, cachePath).then(() => {
            const templatePath = path_1.default.resolve(cachePath, 'package');
            fs_extra_1.default.readdirSync(templatePath).forEach(name => {
                // map template files and move it to app directory, if have conflict then overwrite it.
                fs_extra_1.default.moveSync(path_1.default.join(templatePath, name), path_1.default.resolve(appDirectory, name), { overwrite: true });
            });
            // remove 'package' folder
            fs_extra_1.default.removeSync(templatePath);
            resolve();
        }).catch((err) => {
            if (err) {
                error(chalk_1.default.red(`项目工程模板解压失败: \n${err.stack}`));
                process.exit(1);
            }
        });
    });
}
function updateAppPackageJson(appDirectory, overrideAppJson) {
    log('正在更新 package.json...');
    try {
        const appJsonPath = path_1.default.join(appDirectory, 'package.json');
        const oldPackageJson = fs_extra_1.default.readJSONSync(appJsonPath);
        const_1.packageJsonFieldsToExclude.forEach(field => Reflect.deleteProperty(oldPackageJson, field));
        fs_extra_1.default.writeJSONSync(appJsonPath, Object.assign(Object.assign({}, oldPackageJson), overrideAppJson), {
            spaces: 2,
            replacer: null,
            EOL: os_1.default.EOL
        });
    }
    catch (err) {
        error(err.message);
    }
}
function updateCacheJson(cachePath, template) {
    log('正在更新 cache.json...');
    try {
        const cacheJsonPath = path_1.default.resolve(cachePath, const_1.CACHE_JSON_NAME);
        if (!fs_extra_1.default.existsSync(cacheJsonPath)) {
            fs_extra_1.default.outputJSONSync(cacheJsonPath, { _lastModifiedTime: Date() }, {
                spaces: 2,
                replacer: null,
                EOL: os_1.default.EOL
            });
        }
        const oldCacheJson = fs_extra_1.default.readJSONSync(cacheJsonPath);
        fs_extra_1.default.writeJSONSync(cacheJsonPath, Object.assign(Object.assign({}, oldCacheJson), { [get_1.getCacheTemplatePackageName(template.name, template.version)]: template }), {
            spaces: 2,
            replacer: null,
            EOL: os_1.default.EOL
        });
    }
    catch (err) {
        error(err.message);
    }
}
function updateNpmrc(appDirectory) {
    fs_extra_1.default.appendFileSync(path_1.default.resolve(appDirectory, '.npmrc'), 'SASS_BINARY_SITE=http://npm.taobao.org/mirrors/node-sass');
}
async function download(url, template) {
    // download at cache directory
    log('正在下载项目工程模板.\n');
    return new Promise((resolve, reject) => {
        get_1.getHttpClientAdapter(url).get(url, res => {
            if (res.statusCode === 200) {
                try {
                    const cacheTemplatePackagePath = get_1.getCachePath(get_1.getCacheTemplatePackageName(template.name, template.version));
                    success(`模板下载成功，正在写入本地缓存: ${cacheTemplatePackagePath}...\n`);
                    res
                        .pipe(fs_extra_1.default.createWriteStream(cacheTemplatePackagePath))
                        .on("error", (err) => {
                        error('模板写入本地失败\n');
                        error(err.message);
                        reject(err);
                    })
                        .on('close', () => {
                        resolve(cacheTemplatePackagePath);
                    });
                }
                catch (err) {
                    reject(err);
                }
            }
        });
    });
}
//# sourceMappingURL=createUnlimitedBladeWorks.js.map