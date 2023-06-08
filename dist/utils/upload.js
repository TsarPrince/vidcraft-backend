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
// this function assumes that the file is already present at filePath locally
// it doesn't handles removing the file after upload
const uploadVideo = (filePath, fileName, mimeType) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        const fileBuffer = fs_1.default.readFileSync(filePath);
        const { data, error } = yield db_config_1.default.storage.from(SUPABASE_BUCKET_NAME).upload('merged/' + fileName, fileBuffer, {
            contentType: mimeType
        });
        if (error) {
            reject(error);
        }
        resolve(data);
    }));
});
exports.default = uploadVideo;
