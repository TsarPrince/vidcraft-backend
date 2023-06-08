"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ffmpeg_controller_1 = __importDefault(require("../controllers/ffmpeg.controller"));
const multer_1 = __importDefault(require("multer"));
const multer_constant_1 = require("../constants/multer.constant");
const upload = (0, multer_1.default)({
    limits: { fileSize: multer_constant_1.MAX_FILE_SIZE * 1024 * 1024 },
    storage: multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/');
        },
        filename: (req, file, cb) => {
            const fileName = file.originalname.slice(0, -4) + '-' + Date.now() + '.mp4';
            cb(null, fileName);
        },
    }),
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'video/mp4') {
            return cb(new Error('Only video files are allowed!'));
        }
        cb(null, true);
    }
});
module.exports = (app) => {
    app.post('/api/merge', upload.fields([{ name: 'preFile', maxCount: 1 }, { name: 'inputFile', maxCount: 1 }]), ffmpeg_controller_1.default.mergeVideo);
    app.post('/api/getMetadata', upload.single('video'), ffmpeg_controller_1.default.getMetadata);
};
