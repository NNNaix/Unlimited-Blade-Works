import {blue, Chalk, green, red, yellow, white} from "chalk";
import logSymbols from "log-symbols"; // 显示出 √ 或 × 等的图标
import {LoggerType} from "./const";


const {success, error, info, warning} = logSymbols


export interface LoggerParams {
    type: LoggerType,
    color?: Chalk
    prefix?: string
}

// 日志 API
export type LogHandlerParams = string | {
    text: string;
    prefix?: string;
}

const logger = {} as Record<LoggerType, (params?: LogHandlerParams) => void> & { icon: Record<Exclude<LoggerType, LoggerType.log>, string> };

// 管理命令 log 颜色
const loggerParams: LoggerParams[] = [
    {
        type: LoggerType.success,
        color: green
    },
    {
        type: LoggerType.error,
        color: red
    },
    {
        type: LoggerType.warning,
        color: yellow,
    },
    {
        type: LoggerType.info,
        color: blue,
    },
    {
        type: LoggerType.log,
    }
];
// 循环遍历
loggerParams.forEach(({type, color, prefix = ""}: LoggerParams): void => {
    /**
     * 定义打印日志格式
     *
     * @param {string|LogAags} [text=""] - 要输出的内容
     * @returns {void}
     */
    logger[type] = (text?: LogHandlerParams): void => {
        // 是否为对象
        if (typeof text === "object") {
            const {text: content = "", prefix: prefixTxt = ""} = text;
            content && console.log(`${prefixTxt + " "}${text}`);
        } else if (color) {
            // 是否有颜色
            console.log(`${prefix + " "}${color(type.toUpperCase())} ${text}`);
        } else {
            console.log(text ?? '');
        }
    };
});

logger.icon = {
    error,
    success,
    info,
    warning,
}

export default logger