"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const log_symbols_1 = __importDefault(require("log-symbols")); // 显示出 √ 或 × 等的图标
const const_1 = require("./const");
const { success, error, info, warning } = log_symbols_1.default;
const logger = {};
// 管理命令 log 颜色
const loggerParams = [
    {
        type: const_1.LoggerType.success,
        color: chalk_1.green
    },
    {
        type: const_1.LoggerType.error,
        color: chalk_1.red
    },
    {
        type: const_1.LoggerType.warning,
        color: chalk_1.yellow,
    },
    {
        type: const_1.LoggerType.info,
        color: chalk_1.blue,
    },
    {
        type: const_1.LoggerType.log,
    }
];
// 循环遍历
loggerParams.forEach(({ type, color, prefix = "" }) => {
    /**
     * 定义打印日志格式
     *
     * @param {string|LogAags} [text=""] - 要输出的内容
     * @returns {void}
     */
    logger[type] = (text) => {
        // 是否为对象
        if (typeof text === "object") {
            const { text: content = "", prefix: prefixTxt = "" } = text;
            content && console.log(`${prefixTxt + " "}${text}`);
        }
        else if (color) {
            // 是否有颜色
            console.log(`${prefix + " "}${color(type.toUpperCase())} ${text}`);
        }
        else {
            console.log(text !== null && text !== void 0 ? text : '');
        }
    };
});
logger.icon = {
    error,
    success,
    info,
    warning,
};
exports.default = logger;
//# sourceMappingURL=logs.js.map