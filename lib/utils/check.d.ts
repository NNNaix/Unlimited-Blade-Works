import search from "libnpmsearch";
export declare function checkAppName(appName: string, autoExited?: boolean): boolean;
export declare function checkPackageNodeVersionSupported(packageName: string): void;
export declare function isSafeToCreateProjectIn(root: string): boolean;
export declare function checkForLatestVersion(registry: string): Promise<unknown>;
export declare function checkThatNpmCanReadCwd(): boolean;
export declare function checkNpmVersion(): {
    hasMinNpm: boolean;
    npmVersion: string | null;
};
export declare function checkYarnVersion(): {
    hasMinYarnPnp: boolean;
    hasMaxYarnPnp: boolean;
    yarnVersion: string | null;
};
export declare function checkPnpmVersion(): {
    hasMinPnpm: boolean;
    pnpmVersion: string | null;
};
export declare function checkIfBuildInRegistryListOnline(): Promise<RegistryStatus[]>;
interface RegistryStatus {
    registry: string;
    isOnline: boolean;
}
export declare function checkIfRegistryOnline(registry: string): Promise<RegistryStatus>;
export declare function checkIfCouldUsingCache(template: search.Result): string | false;
export {};
//# sourceMappingURL=check.d.ts.map