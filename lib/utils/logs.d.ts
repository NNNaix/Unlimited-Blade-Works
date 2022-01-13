import { Chalk } from "chalk";
import { LoggerType } from "./const";
export interface LoggerParams {
    type: LoggerType;
    color?: Chalk;
    prefix?: string;
}
export declare type LogHandlerParams = string | {
    text: string;
    prefix?: string;
};
declare const logger: Record<LoggerType, (params?: string | {
    text: string;
    prefix?: string | undefined;
} | undefined) => void> & {
    icon: Record<Exclude<LoggerType, LoggerType.log>, string>;
};
export default logger;
//# sourceMappingURL=logs.d.ts.map