"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WATERMARK_PATH = exports.FOLDERS = exports.TIME_DURATION = void 0;
const path_1 = require("path");
const TIME_DURATION = 30; // seconds
exports.TIME_DURATION = TIME_DURATION;
const FOLDERS = {
    INPUT: './ffmpeg/input',
    OUTPUT: './ffmpeg/output',
    TEMP: './ffmpeg/temp'
};
exports.FOLDERS = FOLDERS;
const WATERMARK_PATH = (0, path_1.join)(FOLDERS.INPUT, 'watermark.jpg');
exports.WATERMARK_PATH = WATERMARK_PATH;
