// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// create-web-app/cli-core 现阶段唯一的作用就是初始化应用.
// 修改该文件的唯一原因是为 `create-web-app/cli-core` 添加更多的警告和命令的故障排除信息.
// 尽可能避免添加破坏向前兼容的更改！
// 对新的语言特性也要小心.
//
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

import chalk from 'chalk'
import commander from 'commander'
import envinfo from 'envinfo'
import {execSync} from 'child_process'
import semver from 'semver'
import logger from './utils/logs'
import path from "path";
import fs from 'fs-extra'
import os from 'os'
import inquirer from 'inquirer'
import {
    CACHE_JSON_NAME,
    DEFAULT_GIT_REPO_URL,
    PACKAGE_SCOPE,
    packageJson,
    packageJsonFieldsToExclude
} from "./utils/const";
import {tgz} from 'compressing'
import {
    checkAppName,
    checkForLatestVersion,
    checkIfBuildInRegistryListOnline,
    checkIfCouldUsingCache,
    checkIfRegistryOnline,
    isSafeToCreateProjectIn
} from "./utils/check";
import {
    getAvailableTemplateList,
    getCachePath,
    getCacheTemplatePackageName,
    getHttpClientAdapter,
    getTemplatePackageTarballUrl
} from "./utils/get";
import search from "libnpmsearch";

inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

const {log, warning, info, success, error} = logger

let registry: string
let enableOffline: boolean
let enableOverride: boolean

async function init() {
    const program = new commander.Command(packageJson.name)
        .version(packageJson.version)
        .usage(`[选项]`)
        // .option('--verbose', '输出更详细的日志')
        .option('--info', '仅输出环境调试信息，不执行初始化')
        .option('--clean', '仅清理本地缓存数据，不执行初始化')
        .option('--registry <registry>', '设置初始化应用过程中使用的注册源')
        .option('--root-directory <rootDirectory>', '设置应用初始化的根目录，<rootDirectory> 为绝对路径')
        .option('--remote-repo <remoteRepo>', '设置应用的 git 远程仓库地址')
        .option('--offline', '启用离线模式，将使用本地缓存数据来替代远程注册源')
        .option('--override', '启用覆写模式，会强制覆盖掉和应用工程模板产生冲突的文件')
        // TODO
        // .option(
        //     '--plugin <alternative-package>',
        //     '使用一个本地的脚手架插件'
        // )
        // .option(
        //     '--local-template <path-to-template>',
        //     '指定一个来自本地的应用模板'
        // )
        // .option('--use-yarn', '使用 yarn 作为包管理器初始化项目')
        // .option('--use-yarn-pnp', '使用 yarn 作为包管理器同时启用 Plug\'n\'Play\n 安装策略初始化项目 ')
        // .option('--use-pnpm', '使用 pnpm 作为包管理器初始化项目')
        .allowUnknownOption()
        .on('--help', () => {
            log();
            log(
                `  如果不指定 ${chalk.green('--registry')}，应用将默认启用注册源自动选择模式，会基于内置注册源列表自动检测可用的注册源进行初始化.`
            );
            log();
            log(
                `  如果不指定 ${chalk.green('--root-directory')}，应用将默认使用当前目录: ${chalk.green(process.cwd())} 进行初始化.`
            );
            log();
            log(
                `  如果不指定 ${chalk.green('--remote-repo')}，应用将默认使用 ${chalk.green(`${DEFAULT_GIT_REPO_URL}/<应用名称>`)} 作为 git 远程仓库进行初始化，<应用名称> 来源于运行时交互输入.`
            );
            log();
            log(
                `  如果不指定 ${chalk.green('--override')}，脚手架将默认使用安全的写入策略，如果应用初始化目录存在白名单以外的文件则警告并终止写入.`
            );

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
            log(
                `  如果你发现当前功能存在缺陷亦或是对脚手架的后续开发方向有更好的建议, 请联系 ${chalk.cyan(packageJson.author.email)} 或直接提出你的 issue:`
            );
            log(
                `  ${chalk.cyan(
                    packageJson.repository.url
                )}`
            );
            log();
        })
        .parse(process.argv);

    const opts = program.opts()

    const rootDirectory = opts.rootDirectory ?? process.cwd()
    enableOffline = opts.offline ?? false
    enableOverride = opts.override ?? false

    if (opts.info) {
        log(chalk.bold('\n 环境信息:'));
        log(
            `\n ${packageJson.name} 当前版本: ${packageJson.version}`
        );
        log(`  脚手架启动路径： ${process.cwd()}`);
        log(`  应用初始化根目录： ${rootDirectory}`);
        return envinfo
            .run(
                {
                    System: ['OS', 'CPU'],
                    Binaries: ['Node', 'npm', 'Yarn', 'pnpm'],
                    Browsers: [
                        'Chrome',
                        'Edge',
                        'Internet Explorer',
                        'Firefox',
                        'Safari',
                    ]
                },
                {
                    duplicates: true,
                    showNotFound: true,
                }
            )
            .then(log);
    }


    if (opts.clean) {
        try {
            const cachePath = getCachePath()
            fs.removeSync(cachePath)
            success(`缓存已移除: ${cachePath}`)
        } catch (err) {
            error(err.message)
        }
        process.exit(1)
    }


    if (!enableOffline) {
        if (opts.registry && (await checkIfRegistryOnline(opts.registry)).isOnline) {
            registry = opts.registry
        } else {
            const registryOnlineStatusList = await checkIfBuildInRegistryListOnline()
            registry = registryOnlineStatusList.reduce((p, c) => p ?? (c.isOnline ? c.registry : p), undefined as undefined | string) as string

            if (!registry) {
                log(`无可用的注册源，请检查当前设备的网络环境以及代理设置或使用 ${chalk.green('\`--offline\`')} 参数以启用离线模式`)
                process.exit(1)
            }
        }
        log(
            `正在使用注册源: ${chalk.green(registry)} 初始化应用.`
        )
    } else {
        log(
            `正在使用离线模式初始化应用.`
        )
    }


    // 我们首先直接通过 API 检查注册源 create-web-app 是否是最新版本，如果失败我们尝试性能更差的 `npm view [package] version` 命令.
    // 这对那些处于直接访问 npm 时被防火墙拦截的环境中的用户非常重要, 以及注册源是私有源的情况.
    (!enableOffline ? (checkForLatestVersion(registry as string)
        .catch(() => {
            try {
                return execSync(`npm view ${packageJson.name} version`).toString().trim()
            } catch (e) {
                return null
            }
        })) : Promise.resolve(null)).then((latest) => {
        if (latest && semver.lt(packageJson.version, latest as string)) {
            log();
            warning(
                chalk.yellow(
                    `您正在运行 \`${packageJson.name}\` ${packageJson.version}, 当前版本落后于最新版本 (${latest}).\n\n` +
                    `我们不支持全局安装 \`${packageJson.name}\`.`
                )
            );
            log();
            log(
                '请使用下面的命令卸载全局依赖:\n' +
                `- npm uninstall -g ${packageJson.name}\n` +
                `- yarn global remove ${packageJson.name}\n` +
                `- pnpm remove -g ${packageJson.name}`
            );
            log();
            log(
                '请参考最新的文档创建应用 :\n' +
                `https://www.npmjs.com/package/${packageJson.name}`
            );
            log();
            process.exit(1);
        } else {
            inquirer
                .prompt([{
                    type: 'input',
                    name: 'name',
                    message: '应用名称:',
                    prefix: '',
                    validate(name: string) {
                        return checkAppName(name)
                    }
                }, {
                    type: 'input',
                    name: 'version',
                    message: '版本:',
                    prefix: '',
                    default: '1.0.0',
                    validate(version: string) {
                        const isVersionValid = !!semver.valid(version)
                        !isVersionValid && error(chalk.red(`无效的版本，请使用符合语义化规范的版本号，更多信息请查看 https://semver.org/`))
                        return isVersionValid
                    }
                }, {
                    type: 'input',
                    name: 'description',
                    message: '描述:',
                    prefix: '',
                    transformer(description) {
                        return description ?? ''
                    }
                }, {
                    type: 'autocomplete',
                    name: 'template',
                    prefix: '',
                    message: `请选择应用工程模板${enableOffline ? '[离线模式]' : ''}:`,
                    source: (_: string, template: string) => getAvailableTemplateList(registry as string, template, enableOffline)
                },
                ])
                .then((initParams: { name: string, version: string, template: search.Result, description: string }) => {
                    createApp({
                        remoteRepoUrl: opts.remoteRepo,
                        rootDirectory: rootDirectory as string,
                        verbose: opts.verbose,
                        ...initParams,
                    })
                });
        }
    })
}

async function createApp({
                             name,
                             version,
                             description,
                             rootDirectory,
                             verbose,
                             template,
                             remoteRepoUrl,
                         }:
                             {
                                 name: string,
                                 version: string,
                                 description: string,
                                 rootDirectory: string,
                                 verbose: boolean,
                                 template: search.Result,
                                 remoteRepoUrl: string,
                             }) {
    const appDirectory = path.resolve(rootDirectory, name);
    const unsupportedNodeVersion = !semver.satisfies(process.version, packageJson.engines.node);


    log();
    log(`当前位于 ${chalk.green(appDirectory)}，Web 应用正在初始化...`);
    log();

    if (unsupportedNodeVersion) {
        log(
            chalk.yellow(
                `您正在使用的 Node 版本为： ${process.version}， \`${packageJson.name}\` ，应用将使用不支持的旧版本工具初始化.\n\n` +
                `请更新到 Node ${packageJson.engines.node} 以获得一个更好的，全面支持的开发体验.\n`
            )
        );
    }

    if (!enableOffline) {
        try {
            log(execSync(`git clone ${remoteRepoUrl} ${appDirectory}`).toString().trim())
        } catch (e) {
            warning('git clone 远程仓库失败，即将跳过 git 初始化，请后续手动执行:\n')
            info(`git init`)
            info(`git remote add origin ${remoteRepoUrl}\n`)
            error(e)
        }
    }

    fs.ensureDirSync(appDirectory);
    if (!enableOverride && !isSafeToCreateProjectIn(appDirectory)) {
        process.exit(1);
    }
    process.chdir(appDirectory);

    const cacheTemplatePackagePath = await useCache(template)

    await unpackFromCache(cacheTemplatePackagePath, appDirectory)

    updateAppPackageJson(appDirectory, {
        name,
        version,
        description,
        private: true
    })
    updateNpmrc(appDirectory)

    // install()

    success('应用初始化完成，请参考应用目录下 README.md 进行后续开发.')

}

/**
 * 1. 检查本地缓存是否命中（模板名是否完全匹配，模板名中自带版本）
 * 2. 未命中时下载最新模板并替换旧缓存数据
 * @param template
 */
async function useCache(template: search.Result) {
    let cacheTemplatePackagePath: string
    if (cacheTemplatePackagePath = checkIfCouldUsingCache(template) as string) {
        log(`正在使用应用工程模板缓存: ${chalk.green(cacheTemplatePackagePath)}`)
    } else {
        if (enableOffline) {
            error(chalk.red('无可用的应用工程模板缓存.'))
        } else {
            const templateTarballUrl = await getTemplatePackageTarballUrl(registry as string, template.name)
            try {
                cacheTemplatePackagePath = await download(templateTarballUrl, template)
            } catch (e) {
                error(e.message)
                error(chalk.red(`应用工程模板下载失败.\n 请检查当前设备的网络环境以及代理设置或使用 ${chalk.green('\`--offline\`')} 参数以启用离线模式.`))
                process.exit(1)
            }


            // remove out-date template package
            const cachePath = getCachePath()
            fs.readdirSync(cachePath).filter(name => {
                name.includes(template.name)
            }).forEach(name => {
                fs.removeSync(path.resolve(cachePath, name))
            })
            updateCacheJson(cachePath, template)
        }
    }
    return cacheTemplatePackagePath
}

async function unpackFromCache(cacheTemplatePackagePath: string, appDirectory: string) {
    log('正在解压应用工程模板...')
    return new Promise<void>((resolve) => {
        const cachePath = getCachePath()
        // unpack to cachePath because npm package wrap files with 'package' folder.
        tgz.uncompress(cacheTemplatePackagePath, cachePath).then(() => {
            const templatePath = path.resolve(cachePath, 'package')
            fs.readdirSync(templatePath).forEach(name => {
                // map template files and move it to app directory, if have conflict then overwrite it.
                fs.moveSync(path.join(templatePath, name), path.resolve(appDirectory, name), {overwrite: true})
            })
            // remove 'package' folder
            fs.removeSync(templatePath)

            resolve()
        }).catch((err) => {
            if (err) {
                error(chalk.red(`应用工程模板解压失败: \n${err.stack}`))
                process.exit(1)
            }
        })
    })
}


function updateAppPackageJson(appDirectory: string, overrideAppJson: JSONType) {
    log('正在更新 package.json...')
    try {
        const appJsonPath = path.join(appDirectory, 'package.json')
        const oldPackageJson = fs.readJSONSync(appJsonPath,)

        packageJsonFieldsToExclude.forEach(field =>
            Reflect.deleteProperty(oldPackageJson, field)
        )
        fs.writeJSONSync(
            appJsonPath,
            {...oldPackageJson, ...overrideAppJson}, {
                spaces: 2,
                replacer: null,
                EOL: os.EOL
            }
        );
    } catch (err) {
        error(err.message)
    }
}

function updateCacheJson(cachePath: string, template: search.Result) {
    log('正在更新 cache.json...')
    try {
        const cacheJsonPath = path.resolve(cachePath, CACHE_JSON_NAME)
        if (!fs.existsSync(cacheJsonPath)) {
            fs.outputJSONSync(
                cacheJsonPath,
                {_lastModifiedTime: Date()},
                {
                    spaces: 2,
                    replacer: null,
                    EOL: os.EOL
                }
            );
        }
        const oldCacheJson = fs.readJSONSync(cacheJsonPath)

        fs.writeJSONSync(
            cacheJsonPath,
            {...oldCacheJson, ...{[getCacheTemplatePackageName(template.name, template.version)]: template}}, {
                spaces: 2,
                replacer: null,
                EOL: os.EOL
            }
        );
    } catch (err) {
        error(err.message)
    }
}

function updateNpmrc(appDirectory: string) {
    fs.appendFileSync(path.resolve(appDirectory, '.npmrc'), 'SASS_BINARY_SITE=http://npm.taobao.org/mirrors/node-sass')
}

async function download(url: string, template: search.Result) {
    // download at cache directory
    log('正在下载应用工程模板.\n');
    return new Promise<string>((resolve, reject) => {
        getHttpClientAdapter(url).get(url, res => {
            if (res.statusCode === 200) {
                try {
                    const cacheTemplatePackagePath = getCachePath(getCacheTemplatePackageName(template.name, template.version))
                    success(`模板下载成功，正在写入本地缓存: ${cacheTemplatePackagePath}...\n`)
                    res
                        .pipe(fs.createWriteStream(cacheTemplatePackagePath))
                        .on("error", (err) => {
                            error('模板写入本地失败\n')
                            error(err.message)
                            reject(err)
                        })
                        .on('close', () => {
                            resolve(cacheTemplatePackagePath)
                        })
                } catch (err) {
                    reject(err)
                }
            }
        })
    })
}

// async function install() {
//     const pm = checkPackageNodeVersionSupported()
//
//     if (pm === SupportedPackageManager.npm && !checkThatNpmCanReadCwd()) {
//         process.exit(1);
//     }
// // 对不同的包管理器及安装策略进行校验
//     switch (pm) {
//         case SupportedPackageManager.yarn_pnpm: {
//             const yarnInfo = checkYarnVersion();
//             if (yarnInfo.yarnVersion) {
//                 if (!yarnInfo.hasMinYarnPnp) {
//                     log(
//                         chalk.yellow(
//                             `您正在使用 Yarn ${yarnInfo.yarnVersion} 并启用了 --use-pnpm 选项， 但是 Plug'n'Play 特性仅 1.12 之后发布的版本支持. 应用将使用不支持的旧版本工具初始化.\n\n` +
//                             `请更新到 Yarn 1.12 或更高的版本以获得一个更好的，全面支持的开发体验.\n`
//                         )
//                     );
//                     // 1.11 had an issue with webpack-dev-middleware, so better not use PnP with it (never reached stable, but still)
//                     pm = SupportedPackageManager.yarn;
//                 }
//                 if (!yarnInfo.hasMaxYarnPnp) {
//                     log(
//                         chalk.yellow(
//                             '--use-pnp 在 yarn 2 中不再是必需的选项，在 yarn 2 未来的版本中将会被废弃并移除.\n'
//                         )
//                     );
//                     // 2 supports PnP by default and breaks when trying to use the flag
//                     pm = SupportedPackageManager.yarn;
//                 }
//             }
//             // 这里不 break，因为 pnp 是 yarn 的特殊安装策略，同样需要执行下面的 yarn 的校验。
//         }
//         case SupportedPackageManager.yarn: {
//             let yarnUsesDefaultRegistry = true;
//             try {
//                 yarnUsesDefaultRegistry =
//                     execSync('yarnpkg config get registry').toString().trim() ===
//                     'https://registry.yarnpkg.com';
//             } catch (e) {
//                 // ignore
//             }
//             if (yarnUsesDefaultRegistry) {
//                 fs.copySync(
//                     require.resolve('./yarn.lock.cached'),
//                     path.join(root, 'yarn.lock')
//                 );
//             }
//             break
//         }
//
//         case SupportedPackageManager.pnpm: {
//             const pnpmInfo = checkPnpmVersion()
//             if (!pnpmInfo.hasMinPnpm) {
//                 if (pnpmInfo.pnpmVersion) {
//                     log(
//                         chalk.yellow(
//                             `您正在使用 Pnpm ${pnpmInfo.pnpmVersion}，应用将使用不支持的旧版本工具初始化.\n\n` +
//                             `请跟新到 Pnpm 6.0.0 或更高的版本以获得一个更好的，全面支持的开发体验.\n`
//                         )
//                     );
//                 }
//             }
//             break
//         }
//         default: {
//             const npmInfo = checkNpmVersion();
//             if (!npmInfo.hasMinNpm) {
//                 if (npmInfo.npmVersion) {
//                     log(
//                         chalk.yellow(
//                             `您正在使用 Npm ${npmInfo.npmVersion}，应用将使用不支持的旧版本工具初始化.\n\n` +
//                             `请跟新到 Npm 6.0.0 或更高的版本以获得一个更好的，全面支持的开发体验.\n`
//                         )
//                     );
//                 }
//             }
//             break
//         }
//     }
//
//     log('正在安装应用依赖，过程可能会花费数分钟.');
//
// }

export {
    init
}