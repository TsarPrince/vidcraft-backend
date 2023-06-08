"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const path_1 = require("path");
const fs_1 = __importDefault(require("fs"));
const upload_1 = __importDefault(require("../utils/upload"));
const fetch_1 = __importDefault(require("../utils/fetch"));
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg_constant_1 = require("../constants/ffmpeg.constant");
const SUPABASE_VIDEO_URL = process.env.SUPABASE_VIDEO_URL;
fluent_ffmpeg_1.default.setFfmpegPath(ffmpegPath);
fluent_ffmpeg_1.default.setFfprobePath(ffprobePath);
const mergeVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let filePath1, filePath2, filePath3;
    try {
        const { id1, id2 } = req.body;
        const blob1 = yield (0, fetch_1.default)(id1);
        const blob2 = yield (0, fetch_1.default)(id2);
        const buffer1 = Buffer.from(yield blob1.arrayBuffer());
        const buffer2 = Buffer.from(yield blob2.arrayBuffer());
        filePath1 = (0, path_1.join)(ffmpeg_constant_1.FOLDERS.TEMP, 'file1.mp4');
        filePath2 = (0, path_1.join)(ffmpeg_constant_1.FOLDERS.TEMP, 'file2.mp4');
        fs_1.default.writeFileSync(filePath1, buffer1);
        fs_1.default.writeFileSync(filePath2, buffer2);
        const promise = new Promise((resolve, reject) => {
            // 1. trim first TIME_DURATION seconds of both input files
            // 2. merge to a single video file
            filePath3 = (0, path_1.join)(ffmpeg_constant_1.FOLDERS.OUTPUT, 'file3.mp4');
            (0, fluent_ffmpeg_1.default)()
                .input(filePath1)
                .inputOptions([`-t ${ffmpeg_constant_1.TIME_DURATION}`])
                .input(filePath2)
                .inputOptions([`-t ${ffmpeg_constant_1.TIME_DURATION}`])
                .mergeToFile(filePath3, ffmpeg_constant_1.FOLDERS.TEMP)
                .on('start', () => {
                console.log(`Trimming and merging ${id1} + ${id2}`);
            })
                .on('error', reject)
                .on('end', () => {
                const outputFile = 'PROCESSED-' + Date.now() + '-' + id1 + '-' + id2 + '.mp4';
                const outputPath = (0, path_1.join)(ffmpeg_constant_1.FOLDERS.OUTPUT, outputFile);
                // 3. add watermark after trimming and merging videos
                (0, fluent_ffmpeg_1.default)()
                    .input(filePath3)
                    .input(ffmpeg_constant_1.WATERMARK_PATH)
                    .complexFilter([{
                        filter: 'overlay', options: { x: 'main_w-overlay_w-20', y: 'main_h-overlay_h-20' },
                        inputs: ['0:v', '1:v'], outputs: 'output'
                    }], 'output')
                    .saveToFile(outputPath)
                    .on('start', () => { console.log(`Adding watermark to ${id1} + ${id2}`); })
                    .on('error', reject)
                    .on('end', () => __awaiter(void 0, void 0, void 0, function* () {
                    // 4. Upload result to supabase storage
                    const data = yield (0, upload_1.default)(outputPath, outputFile, 'video/mp4');
                    fs_1.default.unlinkSync(outputPath);
                    console.log(`Video ${data.path} processed!`);
                    resolve(data.path);
                }));
            });
        });
        const path = yield promise;
        const json = {
            message: 'Video processed successfully',
            data: {
                fileName: path, url: `${SUPABASE_VIDEO_URL}/${path}`
            },
            error: null
        };
        res.status(200).json(json);
    }
    catch (err) {
        console.log(err);
        const json = {
            message: err.message,
            data: null,
            error: 'Failed to merge video',
        };
        res.status(500).json(json);
    }
    finally {
        // delete files after merge
        if (filePath1)
            fs_1.default.unlinkSync(filePath1);
        if (filePath2)
            fs_1.default.unlinkSync(filePath2);
        if (filePath3)
            fs_1.default.unlinkSync(filePath3);
    }
});
const getMetadata = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let filePath;
    try {
        const { id } = req.body;
        const blob = yield (0, fetch_1.default)(id);
        const buffer = Buffer.from(yield blob.arrayBuffer());
        filePath = (0, path_1.join)(ffmpeg_constant_1.FOLDERS.TEMP, 'file.mp4');
        fs_1.default.writeFileSync(filePath, buffer);
        const inputPath = filePath;
        const promise = new Promise((resolve, reject) => {
            fluent_ffmpeg_1.default
                .ffprobe(inputPath, (err, metadata) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(metadata);
                }
            });
        });
        const data = yield promise;
        const json = {
            message: 'Codecs processed!',
            data,
            error: null
        };
        res.status(200).json(json);
    }
    catch (err) {
        console.log(err);
        const json = {
            error: 'Failed to fetch codec',
            data: null,
            message: err.message
        };
        res.status(500).json(json);
    }
    finally {
        // delete files after usage
        if (filePath) {
            fs_1.default.unlinkSync(filePath);
        }
    }
});
exports.default = {
    mergeVideo,
    getMetadata
};
