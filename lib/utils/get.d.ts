/// <reference types="node" />
import npmSearch from "libnpmsearch";
import https from "https";
import http from "http";
export declare function getTemplatePackageTarballUrl(registry: string, templateName: string): Promise<string>;
export declare function getAvailableTemplateList(registry: string, template?: string, isOffline?: boolean): Promise<void | {
    name: string;
    value: npmSearch.Result;
}[]>;
export declare function getProxy(): string | undefined;
export declare function getHomeCrossPlatform(): string;
export declare function getCachePath(template?: string): string;
export declare function getCacheTemplatePackageName(name: string, version: string): string;
export declare function getHttpClientAdapter(url: string): typeof https | typeof http;
//# sourceMappingURL=get.d.ts.map