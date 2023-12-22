import {
    Injectable,
    Logger,
    LoggerService,
    Scope,
} from '@nestjs/common';
import { ConfigService } from 'src/config.service';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
const path = require('path')
const PROJECT_ROOT = path.join(__dirname, '../..')


export enum logLevels {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    HTTP = 'http',
    VERBOSE = 'verbose',
    DEBUG = 'debug',
    SILLY = 'silly',
}

@Injectable({ scope: Scope.TRANSIENT })
export class MyLogger implements LoggerService {
    constructor(
        private readonly config: ConfigService
    ) {
        this.initializeLogger(this.label);
    }

    private label: string = this.config.name;
    private logger: winston.Logger;
    /**
     * Sets the logging context.
     * @param context The context label you want to set for the logging class instance
     */
    setContext(context: string) {
        //this.debug(context)
        this.label = context;
        this.initializeLogger(this.label);
    }

    /**
     * Parses and returns info about the call stack at the given index.
     */
    getStackInfo (stackIndex) {
        // get call stack, and analyze it
        // get all file, method, and line numbers
        var stacklist = (new Error()).stack.split('\n').slice(3)

        // stack trace format:
        // http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
        // do not remove the regex expresses to outside of this method (due to a BUG in node.js)
        var stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi
        var stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi

        var s = stacklist[stackIndex] || stacklist[0]
        var sp = stackReg.exec(s) || stackReg2.exec(s)

        if (sp && sp.length === 5) {
            return {
                method: sp[1],
                relativePath: path.relative(PROJECT_ROOT, sp[2]),
                line: sp[3],
                pos: sp[4],
                file: path.basename(sp[2]),
                stack: stacklist.join('\n')
            }
        }
    }


    /**
     * Initializes the winston logging service and sets the formats
     * @param label The context label to be set within the instance of MyLogger
     */
    initializeLogger(label) {
        // console.log("Initializing logger for " + this.config.name);
        const myFormat = winston.format.combine(
            winston.format.colorize({
                all: true,
            }),
            winston.format.label({
                label: '[LOGGER]',
            }),
            winston.format.timestamp({
                format: 'YY-MM-DD HH:mm:ss',
            }),

            winston.format.printf(
                (info) =>
                    ` [${info.level}]:  ${info.timestamp}  -  [${label}]:  ${info.message}`,
            ),
        );
        winston.addColors({
            info: 'green',
            warn: 'italic yellow', // fontStyle color
            error: 'bold red',
            debug: 'blue',
        });
        const consoleOptions = {
            level: this.config.logLevel.toLowerCase(), // Replace by 'info' to avoid massive logs in docker logs
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp(),
                myFormat,
            )
        }
        const rotateFile= new winston.transports.DailyRotateFile({
                dirname:  '/var/log/indeed/',           
                filename: this.config.name + '-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxSize: '20m',
                maxFiles: '14d',
                level: 'debug',
                format: winston.format.combine(winston.format.json(),winston.format.timestamp(), myFormat)
        })

        this.logger = winston.createLogger({

            transports: [
                new winston.transports.Console(consoleOptions),
                rotateFile],
            defaultMeta: { service: label },
        });
    }
    /**
     * logs a message with the 'info' log level
     * @param message the message you want to log
     * @param context optional not handled at the moment
     */
    log(message: any, context?: string) {
        this.logger.log(logLevels.INFO, message);
    }

    /**
     * logs a message with the 'info' log level
     * @param message the message you want to log
     * @param context optional not handled at the moment
     */
    info(message: any, context?: string) {

        let calleeStr = "";

        // Use this for finding the location of the problematic log
        if (false) {
            let stackInfo = this.getStackInfo(1);
            //console.log(stackInfo);

            if (stackInfo) {
                // get file path relative to project root
                calleeStr = '(' + stackInfo.relativePath + ':' + stackInfo.line + '): '
            }
        }

        this.logger.log(logLevels.INFO, calleeStr + message);
    }

    /**
     * logs a message with the 'error' log level
     * @param message the message you want to log
     * @param context optional not handled at the moment
     */
    error(message: any, trace?: string, context?: string) {
        this.logger.log(logLevels.ERROR, message);
    }
    /**
     * logs a message with the 'warn' log level
     * @param message the message you want to log
     * @param context optional not handled at the moment
     */
    warn(message: any, context?: string) {
        this.logger.log(logLevels.WARN, message);
    }
    /**
     * logs a message with the 'debug' log level
     * @param message the message you want to log
     * @param context optional not handled at the moment
     */
    debug(message: any, context?: string) {

        let calleeStr = "";

        // Use this for finding the location of the problematic log
        if (false) {
            let stackInfo = this.getStackInfo(1);
            //console.log(stackInfo);

            if (stackInfo) {
                // get file path relative to project root
                calleeStr = '(' + stackInfo.relativePath + ':' + stackInfo.line + '): '
            }
        }

        this.logger.log(logLevels.DEBUG, calleeStr + message);
    }
}
