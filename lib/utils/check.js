"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkIfCouldUsingCache = exports.checkIfRegistryOnline = exports.checkIfBuildInRegistryListOnline = exports.checkPnpmVersion = exports.checkYarnVersion = exports.checkNpmVersion = exports.checkThatNpmCanReadCwd = exports.checkForLatestVersion = exports.isSafeToCreateProjectIn = exports.checkPackageNodeVersionSupported = exports.checkAppName = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const semver_1 = __importDefault(require("semver"));
const chalk_1 = __importDefault(require("chalk"));
const validate_npm_package_name_1 = __importDefault(require("validate-npm-package-name"));
const logs_1 = __importDefault(require("./logs"));
const cross_spawn_1 = __importDefault(require("cross-spawn"));
const child_process_1 = require("child_process");
const dns_1 = __importDefault(require("dns"));
const url_1 = require("url");
const get_1 = require("./get");
const const_1 = require("./const");
const { error, log } = logs_1.default;
function checkAppName(appName, autoExited = true) {
    const validationResult = validate_npm_package_name_1.default(appName);
    if (!validationResult.validForNewPackages) {
        log();
        error(chalk_1.default.red(`无法使用 ${chalk_1.default.green(`"${appName}"`)} 作为名称来创建项目，因为项目命名遵循 npm 命名最佳实践:\n`));
        [
            ...(validationResult.errors || []),
            ...(validationResult.warnings || []),
        ].forEach(err => {
            error(chalk_1.default.red(`  * ${err}`));
        });
        error(chalk_1.default.red('\n请使用一个不同的项目名称.'));
        autoExited && process.exit(1);
    }
    return validationResult.validForNewPackages;
    // TODO: there should be a single place that holds the dependencies
}
exports.checkAppName = checkAppName;
function checkPackageNodeVersionSupported(packageName) {
    const packageJsonPath = path_1.default.resolve(process.cwd(), 'node_modules', packageName, 'package.json');
    if (!fs_extra_1.default.existsSync(packageJsonPath)) {
        return;
    }
    const packageJson = require(packageJsonPath);
    if (!packageJson.engines || !packageJson.engines.node) {
        return;
    }
    if (!semver_1.default.satisfies(process.version, packageJson.engines.node)) {
        console.error(chalk_1.default.red('You are running Node %s.\n' +
            'Unlimited Blade Works requires Node %s or higher. \n' +
            'Please update your version of Node.'), process.version, packageJson.engines.node);
        process.exit(1);
    }
}
exports.checkPackageNodeVersionSupported = checkPackageNodeVersionSupported;
// 如果项目创建目录只存在由 Gitlab 等生成的文件，那么就是安全的.
// 同时，如果项目创建目录存在之前安装残留的错误日志，则移除他们.
function isSafeToCreateProjectIn(root) {
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
    const isErrorLog = (file) => {
        return errorLogFilePatterns.some(pattern => file.startsWith(pattern));
    };
    const conflicts = fs_extra_1.default
        .readdirSync(root)
        .filter(file => !validFiles.includes(file))
        // IntelliJ IDEA creates module files before CRA is launched
        .filter(file => !/\.iml$/.test(file))
        // Don't treat log files from previous installation as conflicts
        .filter(file => !isErrorLog(file));
    if (conflicts.length > 0) {
        log(`目录 ${chalk_1.default.green(path_1.default.basename(root))} 存在会造成冲突的文件:`);
        log();
        for (const file of conflicts) {
            try {
                const stats = fs_extra_1.default.lstatSync(path_1.default.join(root, file));
                if (stats.isDirectory()) {
                    log(`  ${chalk_1.default.blue(`${file}/`)}`);
                }
                else {
                    log(`  ${file}`);
                }
            }
            catch (e) {
                log(`  ${file}`);
            }
        }
        log();
        log(`请使用一个新的目录名称，或删除上述文件，或者使用 ${chalk_1.default.green('\`--override\`')} 参数以启用覆写模式，将会强制覆盖掉和项目工程模板产生冲突的文件`);
        return false;
    }
    // Remove any log files from a previous installation.
    fs_extra_1.default.readdirSync(root).forEach(file => {
        if (isErrorLog(file)) {
            fs_extra_1.default.removeSync(path_1.default.join(root, file));
        }
    });
    return true;
}
exports.isSafeToCreateProjectIn = isSafeToCreateProjectIn;
function checkForLatestVersion(registry) {
    return new Promise((resolve, reject) => {
        get_1.getHttpClientAdapter(registry)
            .get(`${registry}/-/package/${const_1.packageJson.name}/dist-tags`, res => {
            if (res.statusCode === 200) {
                let body = '';
                res.on('data', data => (body += data));
                res.on('end', () => {
                    resolve(JSON.parse(body).latest);
                });
            }
            else {
                reject();
            }
        })
            .on('error', () => {
            reject();
        });
    });
}
exports.checkForLatestVersion = checkForLatestVersion;
function checkThatNpmCanReadCwd() {
    const cwd = process.cwd();
    let childOutput = null;
    try {
        // Note: intentionally using spawn over exec since
        // the problem doesn't reproduce otherwise.
        // `npm config list` is the only reliable way I could find
        // to reproduce the wrong path. Just printing process.cwd()
        // in a Node process was not enough.
        childOutput = cross_spawn_1.default.sync('npm', ['config', 'list']).output.join('');
    }
    catch (err) {
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
    error(chalk_1.default.red(`Could not start an npm process in the right directory.\n\n` +
        `The current directory is: ${chalk_1.default.bold(cwd)}\n` +
        `However, a newly started npm process runs in: ${chalk_1.default.bold(npmCWD)}\n\n` +
        `This is probably caused by a misconfigured system terminal shell.`));
    if (process.platform === 'win32') {
        error(chalk_1.default.red(`On Windows, this can usually be fixed by running:\n\n`) +
            `  ${chalk_1.default.cyan('reg')} delete "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n` +
            `  ${chalk_1.default.cyan('reg')} delete "HKLM\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n\n` +
            chalk_1.default.red(`Try to run the above two lines in the terminal.\n`) +
            chalk_1.default.red(`To learn more about this problem, read: https://blogs.msdn.microsoft.com/oldnewthing/20071121-00/?p=24433/`));
    }
    return false;
}
exports.checkThatNpmCanReadCwd = checkThatNpmCanReadCwd;
function checkNpmVersion() {
    let hasMinNpm = false;
    let npmVersion = null;
    try {
        npmVersion = child_process_1.execSync('npm --version').toString().trim();
        hasMinNpm = semver_1.default.gte(npmVersion, '6.0.0');
    }
    catch (err) {
        // ignore
    }
    return {
        hasMinNpm: hasMinNpm,
        npmVersion: npmVersion,
    };
}
exports.checkNpmVersion = checkNpmVersion;
function checkYarnVersion() {
    const minYarnPnp = '1.12.0';
    const maxYarnPnp = '2.0.0';
    let hasMinYarnPnp = false;
    let hasMaxYarnPnp = false;
    let yarnVersion = null;
    try {
        yarnVersion = child_process_1.execSync('yarnpkg --version').toString().trim();
        if (semver_1.default.valid(yarnVersion)) {
            hasMinYarnPnp = semver_1.default.gte(yarnVersion, minYarnPnp);
            hasMaxYarnPnp = semver_1.default.lt(yarnVersion, maxYarnPnp);
        }
        else {
            // Handle non-semver compliant yarn version strings, which yarn currently
            // uses for nightly builds. The regex truncates anything after the first
            // dash. See #5362.
            const trimmedYarnVersionMatch = /^(.+?)[-+].+$/.exec(yarnVersion);
            if (trimmedYarnVersionMatch) {
                const trimmedYarnVersion = trimmedYarnVersionMatch.pop();
                hasMinYarnPnp = semver_1.default.gte(trimmedYarnVersion, minYarnPnp);
                hasMaxYarnPnp = semver_1.default.lt(trimmedYarnVersion, maxYarnPnp);
            }
        }
    }
    catch (err) {
        // ignore
    }
    return {
        hasMinYarnPnp,
        hasMaxYarnPnp,
        yarnVersion,
    };
}
exports.checkYarnVersion = checkYarnVersion;
function checkPnpmVersion() {
    let hasMinPnpm = false;
    let pnpmVersion = null;
    try {
        pnpmVersion = child_process_1.execSync('pnpm --version').toString().trim();
        hasMinPnpm = semver_1.default.gte(pnpmVersion, '6.0.0');
    }
    catch (err) {
        // ignore
    }
    return {
        hasMinPnpm,
        pnpmVersion
    };
}
exports.checkPnpmVersion = checkPnpmVersion;
function checkIfBuildInRegistryListOnline() {
    // 我们会按检测开发者所在环境是否可以访问下列三个注册源
    return Promise.allSettled(const_1.buildInRegistryList.map(registry => checkIfRegistryOnline(registry))).then((registryOnlineStatusList) => {
        return registryOnlineStatusList.map((status) => status.value);
    });
}
exports.checkIfBuildInRegistryListOnline = checkIfBuildInRegistryListOnline;
function checkIfRegistryOnline(registry) {
    log(`正在检测注册源 ${registry} 的可用情况.`);
    return new Promise(resolve => {
        dns_1.default.lookup((new url_1.URL(registry)).hostname, err => {
            let proxy;
            if (err != null && (proxy = get_1.getProxy())) {
                // If a proxy is defined, we likely can't resolve external hostnames.
                // Try to resolve the proxy name as an indication of a connection.
                dns_1.default.lookup(new url_1.URL(proxy).hostname, proxyErr => {
                    resolve({
                        registry,
                        isOnline: proxyErr == null
                    });
                });
            }
            else {
                resolve({
                    registry,
                    isOnline: err == null
                });
            }
        });
    }).then((registryStatus) => {
        log(chalk_1.default.green(`${registryStatus.registry}: ${registryStatus.isOnline ? '可用' : '不可用'}`));
        return registryStatus;
    });
}
exports.checkIfRegistryOnline = checkIfRegistryOnline;
function checkIfCouldUsingCache(template) {
    const templatePackageCachePath = get_1.getCachePath(get_1.getCacheTemplatePackageName(template.name, template.version));
    if (fs_extra_1.default.existsSync(templatePackageCachePath)) {
        return templatePackageCachePath;
    }
    else {
        return false;
    }
}
exports.checkIfCouldUsingCache = checkIfCouldUsingCache;
//# sourceMappingURL=check.js.map