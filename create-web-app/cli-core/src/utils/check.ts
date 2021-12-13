import path from "path";
import fs from "fs-extra";
import semver from "semver";
import chalk from "chalk";
import validateProjectName from "validate-npm-package-name";
import logger from "./logs";
import https from "https";
import spawn from "cross-spawn";
import {execSync} from "child_process";
import dns from 'dns'
import {URL} from "url";
import {getCachePath, getCacheTemplatePackageName, getHttpClientAdapter, getProxy} from "./get";
import {buildInRegistryList, packageJson} from "./const";
import search from "libnpmsearch";


const {error, log} = logger

export function checkAppName(appName: string, autoExited = true) {
    const validationResult = validateProjectName(appName);
    if (!validationResult.validForNewPackages) {
        log()
        error(
            chalk.red(
                `无法使用 ${chalk.green(
                    `"${appName}"`
                )} 作为名称来创建应用，因为应用命名遵循 npm 命名最佳实践:\n`
            )
        );
        [
            ...(validationResult.errors || []),
            ...(validationResult.warnings || []),
        ].forEach(err => {
            error(chalk.red(`  * ${err}`));
        });
        error(chalk.red('\n请使用一个不同的应用名称.'));
        autoExited && process.exit(1);
    }
    return validationResult.validForNewPackages
    // TODO: there should be a single place that holds the dependencies
}


export function checkPackageNodeVersionSupported(packageName: string) {
    const packageJsonPath = path.resolve(
        process.cwd(),
        'node_modules',
        packageName,
        'package.json'
    );

    if (!fs.existsSync(packageJsonPath)) {
        return;
    }

    const packageJson = require(packageJsonPath);
    if (!packageJson.engines || !packageJson.engines.node) {
        return;
    }

    if (!semver.satisfies(process.version, packageJson.engines.node)) {
        console.error(
            chalk.red(
                'You are running Node %s.\n' +
                'Create Web App requires Node %s or higher. \n' +
                'Please update your version of Node.'
            ),
            process.version,
            packageJson.engines.node
        );
        process.exit(1);
    }
}

// 如果应用创建目录只存在由 Gitlab 等生成的文件，那么就是安全的.
// 同时，如果应用创建目录存在之前安装残留的错误日志，则移除他们.
export function isSafeToCreateProjectIn(root: string) {
    const validFiles = [
        '.DS_Store',
        '.git',
        '.gitattributes',
        '.gitignore',
        '.gitlab-ci.yml',
        '.hg',
        '.hgcheck',
        '.hgignore',
        '.idea',
        '.npmignore',
        '.travis.yml',
        'docs',
        'LICENSE',
        'README.md',
        'mkdocs.yml',
        'Thumbs.db',
    ];
    // 在安装失败后，这些文件应该被允许保留下，但是在下一次安装时会静默的自动移除。
    const errorLogFilePatterns = [
        'npm-debug.log',
        'yarn-error.log',
        'yarn-debug.log',
        'pnpm-debug.log',
    ];
    const isErrorLog = (file: string) => {
        return errorLogFilePatterns.some(pattern => file.startsWith(pattern));
    };

    const conflicts = fs
        .readdirSync(root)
        .filter(file => !validFiles.includes(file))
        // IntelliJ IDEA creates module files before CRA is launched
        .filter(file => !/\.iml$/.test(file))
        // Don't treat log files from previous installation as conflicts
        .filter(file => !isErrorLog(file));

    if (conflicts.length > 0) {
        log(
            `目录 ${chalk.green(path.basename(root))} 存在会造成冲突的文件:`
        );
        log();
        for (const file of conflicts) {
            try {
                const stats = fs.lstatSync(path.join(root, file));
                if (stats.isDirectory()) {
                    log(`  ${chalk.blue(`${file}/`)}`);
                } else {
                    log(`  ${file}`);
                }
            } catch (e) {
                log(`  ${file}`);
            }
        }
        log();
        log(
            `请使用一个新的目录名称，或删除上述文件，或者使用 ${chalk.green('\`--override\`')} 参数以启用覆写模式，将会强制覆盖掉和应用工程模板产生冲突的文件`
        );

        return false;
    }

    // Remove any log files from a previous installation.
    fs.readdirSync(root).forEach(file => {
        if (isErrorLog(file)) {
            fs.removeSync(path.join(root, file));
        }
    });
    return true;
}

export function checkForLatestVersion(registry: string) {
    return new Promise((resolve, reject) => {
            getHttpClientAdapter(registry)
                .get(
                    `${registry}/-/package/${packageJson.name}/dist-tags`,
                    res => {
                        if (res.statusCode === 200) {
                            let body = '';
                            res.on('data', data => (body += data));
                            res.on('end', () => {
                                resolve(JSON.parse(body).latest as string);
                            });
                        } else {
                            reject();
                        }
                    }
                )
                .on('error', () => {
                    reject();
                });
    });
}

export function checkThatNpmCanReadCwd() {
    const cwd = process.cwd();
    let childOutput = null;
    try {
        // Note: intentionally using spawn over exec since
        // the problem doesn't reproduce otherwise.
        // `npm config list` is the only reliable way I could find
        // to reproduce the wrong path. Just printing process.cwd()
        // in a Node process was not enough.
        childOutput = spawn.sync('npm', ['config', 'list']).output.join('');
    } catch (err) {
        // Something went wrong spawning node.
        // Not great, but it means we can't do this check.
        // We might fail later on, but let's continue.
        return true;
    }
    if (typeof childOutput !== 'string') {
        return true;
    }
    const lines = childOutput.split('\n');
    // `npm config list` output includes the following line:
    // "; cwd = C:\path\to\current\dir" (unquoted)
    // I couldn't find an easier way to get it.
    const prefix = '; cwd = ';
    const line = lines.find(line => line.startsWith(prefix));
    if (typeof line !== 'string') {
        // Fail gracefully. They could remove it.
        return true;
    }
    const npmCWD = line.substring(prefix.length);
    if (npmCWD === cwd) {
        return true;
    }
    error(
        chalk.red(
            `Could not start an npm process in the right directory.\n\n` +
            `The current directory is: ${chalk.bold(cwd)}\n` +
            `However, a newly started npm process runs in: ${chalk.bold(
                npmCWD
            )}\n\n` +
            `This is probably caused by a misconfigured system terminal shell.`
        )
    );
    if (process.platform === 'win32') {
        error(
            chalk.red(`On Windows, this can usually be fixed by running:\n\n`) +
            `  ${chalk.cyan(
                'reg'
            )} delete "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n` +
            `  ${chalk.cyan(
                'reg'
            )} delete "HKLM\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n\n` +
            chalk.red(`Try to run the above two lines in the terminal.\n`) +
            chalk.red(
                `To learn more about this problem, read: https://blogs.msdn.microsoft.com/oldnewthing/20071121-00/?p=24433/`
            )
        );
    }
    return false;
}

export function checkNpmVersion() {
    let hasMinNpm = false;
    let npmVersion = null;
    try {
        npmVersion = execSync('npm --version').toString().trim();
        hasMinNpm = semver.gte(npmVersion, '6.0.0');
    } catch (err) {
        // ignore
    }
    return {
        hasMinNpm: hasMinNpm,
        npmVersion: npmVersion,
    };
}

export function checkYarnVersion() {
    const minYarnPnp = '1.12.0';
    const maxYarnPnp = '2.0.0';
    let hasMinYarnPnp = false;
    let hasMaxYarnPnp = false;
    let yarnVersion = null;
    try {
        yarnVersion = execSync('yarnpkg --version').toString().trim();
        if (semver.valid(yarnVersion)) {
            hasMinYarnPnp = semver.gte(yarnVersion, minYarnPnp);
            hasMaxYarnPnp = semver.lt(yarnVersion, maxYarnPnp);
        } else {
            // Handle non-semver compliant yarn version strings, which yarn currently
            // uses for nightly builds. The regex truncates anything after the first
            // dash. See #5362.
            const trimmedYarnVersionMatch = /^(.+?)[-+].+$/.exec(yarnVersion);
            if (trimmedYarnVersionMatch) {
                const trimmedYarnVersion = trimmedYarnVersionMatch.pop()!;
                hasMinYarnPnp = semver.gte(trimmedYarnVersion, minYarnPnp);
                hasMaxYarnPnp = semver.lt(trimmedYarnVersion, maxYarnPnp);
            }
        }
    } catch (err) {
        // ignore
    }
    return {
        hasMinYarnPnp,
        hasMaxYarnPnp,
        yarnVersion,
    };
}

export function checkPnpmVersion() {
    let hasMinPnpm = false;
    let pnpmVersion = null
    try {
        pnpmVersion = execSync('pnpm --version').toString().trim()
        hasMinPnpm = semver.gte(pnpmVersion, '6.0.0');
    } catch (err) {
        // ignore
    }
    return {
        hasMinPnpm,
        pnpmVersion
    }
}


export function checkIfBuildInRegistryListOnline(): Promise<RegistryStatus[]> {
    // 我们会按检测开发者所在环境是否可以访问下列三个注册源
    return Promise.allSettled(buildInRegistryList.map(registry => checkIfRegistryOnline(registry))).then((registryOnlineStatusList: any) => {
        return registryOnlineStatusList.map((status: PromiseFulfilledResult<RegistryStatus>) => status.value)
    })
}

interface RegistryStatus {
    registry: string
    isOnline: boolean
}

export function checkIfRegistryOnline(registry: string) {
    log(`正在检测注册源 ${registry} 的可用情况.`)
    return new Promise<RegistryStatus>(resolve => {
        dns.lookup((new URL(registry)).hostname, err => {
            let proxy;
            if (err != null && (proxy = getProxy())) {
                // If a proxy is defined, we likely can't resolve external hostnames.
                // Try to resolve the proxy name as an indication of a connection.
                dns.lookup(new URL(proxy).hostname, proxyErr => {
                    resolve({
                        registry,
                        isOnline: proxyErr == null
                    });
                });
            } else {
                resolve({
                    registry,
                    isOnline: err == null
                });
            }
        });
    }).then((registryStatus) => {
        log(chalk.green(`${registryStatus.registry}: ${registryStatus.isOnline ? '可用' : '不可用'}`))
        return registryStatus
    })
}

export function checkIfCouldUsingCache(template: search.Result) {
    const templatePackageCachePath = getCachePath(getCacheTemplatePackageName(template.name, template.version))
    if (fs.existsSync(templatePackageCachePath)) {
        return templatePackageCachePath
    } else {
        return false
    }
}