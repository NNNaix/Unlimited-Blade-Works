import chalk from 'chalk';
import {execSync} from "child_process";
import npmSearch from "libnpmsearch"
import search from "libnpmsearch"
import {
    BOILERPLATE_PREFIX_NAME,
    CACHE_FOLDER_NAME,
    CACHE_JSON_NAME,
    DEFAULT_GIT_REPO_URL,
    PACKAGE_SCOPE,
    packageJson
} from './const'
import https from "https";
import http from "http";
import path from "path";
import fs from "fs-extra";
import logger from './logs'


const {error} = logger

export function getTemplatePackageTarballUrl(registry: string, templateName: string): Promise<string> {
    return new Promise((resolve, reject) => {
        getHttpClientAdapter(registry).get(
            `${registry}/${templateName}`,
            res => {
                if (res.statusCode === 200) {
                    let body = '';
                    res.on('data', data => (body += data));
                    res.on('end', () => {
                        const template = JSON.parse(body)
                        resolve(template.versions[template['dist-tags'].latest].dist.tarball as string);
                    });
                } else {
                    reject(res.statusMessage);
                }
            }
        )
            .on('error', (err) => {
                reject(err);
            });
    })
}


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


function getTemplateSelection(tpl: search.Result) {
    return {
        name: `${tpl.name} ${chalk.grey(`- ${tpl.description ?? `v${tpl.version}`}`)}`,
        value: tpl
    }
}

export async function getAvailableTemplateList(registry: string, template = '', isOffline = false) {
    try {
        if (!isOffline) {
            return npmSearch(template || PACKAGE_SCOPE, {  registry })
                .then(list => list
                    .filter((tpl) => tpl.name.startsWith(BOILERPLATE_PREFIX_NAME) && tpl.name.includes(template) && tpl.name !== packageJson.name)
                    .map((tpl) => getTemplateSelection(tpl)))
                .catch(err => {
                    error(err.message)
                    error(chalk.red(`获取远程项目工程模板列表失败.\n 请检查当前设备的网络环境以及代理设置或使用 ${chalk.green('\`--offline\`')} 参数以启用离线模式.`))
                })
        } else {
            const cacheJson = fs.readJSONSync(path.resolve(getCachePath(), CACHE_JSON_NAME))
            return fs.readdirSync(getCachePath(PACKAGE_SCOPE)).map(name => getTemplateSelection(cacheJson[`${PACKAGE_SCOPE}/${name}`])).filter(({name}) => name.includes(template))
        }
    } catch (err) {
        error(err.message)
    }
}

export function getProxy() {
    if (process.env.https_proxy) {
        return process.env.https_proxy;
    } else {
        try {
            // Trying to read https-proxy from .npmrc
            let httpsProxy = execSync('npm config get https-proxy').toString().trim();
            return httpsProxy !== 'null' ? httpsProxy : undefined;
        } catch (e) {
            return;
        }
    }
}

export function getHomeCrossPlatform(): string {
    if (process.env.HOME) return process.env.HOME; // Linux
    return process.env.USERPROFILE as string; // Windows
}

export function getCachePath(template = '') {
    const cacheDirectory = path.resolve(getHomeCrossPlatform(), CACHE_FOLDER_NAME)
    fs.ensureDirSync(path.resolve(cacheDirectory, PACKAGE_SCOPE))
    return path.resolve(cacheDirectory, template)
}

export function getCacheTemplatePackageName(name: string, version: string) {
    return `${name}.${version}.tar.gz`
}

export function getHttpClientAdapter(url: string) {
    return (url.startsWith('https') ? https : http)

}

// export function getTemplatePackageManager(): SupportedPackageManager{
//
// }
