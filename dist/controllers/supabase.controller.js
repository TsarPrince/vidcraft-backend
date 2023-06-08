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
const db_config_1 = __importDefault(require("../config/db.config"));
const fs_1 = __importDefault(require("fs"));
const SUPABASE_BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME;
const SUPABASE_VIDEO_URL = process.env.SUPABASE_VIDEO_URL;
const uploadVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const file = req.file;
    try {
        const { originalname, path, mimetype } = file;
        const newFileName = Date.now() + '-' + originalname;
        const fileBuffer = fs_1.default.readFileSync(path);
        const { data, error } = yield db_config_1.default.storage.from(SUPABASE_BUCKET_NAME).upload(newFileName, fileBuffer, {
            // multer renames the file to prevent naming conflicts
            // pass in content type explicitly for supabase
            contentType: mimetype
        });
        if (error) {
            throw new Error(error.message);
        }
        // fetch the id of the uploaded file
        const { data: filesData, error: listError } = yield db_config_1.default.storage.from(SUPABASE_BUCKET_NAME).list();
        let id;
        filesData.forEach((file) => {
            if (file.name === newFileName) {
                id = file.id;
            }
        });
        const json = {
            message: 'Video uploaded successfully',
            data: Object.assign(Object.assign({}, data), { id }),
            error: null
        };
        res.status(200).json(json);
    }
    catch (error) {
        console.error(error);
        const json = {
            message: error.message,
            data: null,
            error: 'Failed to upload video',
        };
        res.status(500).json(json);
    }
    finally {
        // Delete the file from the server
        if (file) {
            fs_1.default.unlinkSync(file.path);
        }
    }
});
const emptyBucket = (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { data, error } = yield db_config_1.default.storage.emptyBucket(SUPABASE_BUCKET_NAME);
        console.log(data);
        if (error) {
            throw new Error(error.message);
        }
        const json = {
            message: 'Bucket emptied successfully',
            data,
            error: null,
        };
        res.status(200).json(json);
    }
    catch (error) {
        console.error(error);
        const json = {
            message: error.message,
            data: null,
            error: 'Failed to fetch bucket items',
        };
        res.status(500).json(json);
    }
});
exports.default = {
    uploadVideo,
    emptyBucket
};
