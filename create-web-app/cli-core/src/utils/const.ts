export const packageJson = require("../../package.json");

export enum LoggerType {
    info = 'info',
    error = 'error',
    warning = 'warning',
    log = 'log',
    success = 'success'
}

export enum SupportedPackageManager {
    npm = 'npm',
    yarn = 'yarn',
    pnpm = 'pnpm',
    yarn_pnpm = 'yarn_pnpm'
}

export const PACKAGE_SCOPE = '@cyber-bones'

export const BOILERPLATE_PREFIX_NAME = `${PACKAGE_SCOPE}/create-`

export const buildInRegistryList = [
    'https://registry.npmjs.org',
    'https://registry.npm.taobao.org',
    'https://registry.yarnpkg.com',
]
export const CACHE_FOLDER_NAME = '.cyber-bones/create-web-app'

export const DEFAULT_GIT_REPO_URL = 'https://github.com/NNNaix/Cyber-Bones'


export const packageJsonFieldsToExclude = ['author', 'homepage', 'repository', 'license', 'funding', 'contributors', 'bugs', 'maintainers']

export const CACHE_JSON_NAME = 'cache.json'