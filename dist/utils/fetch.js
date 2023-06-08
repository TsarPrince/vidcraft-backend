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
const SUPABASE_BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME;
const downloadVideo = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        const { data: filesData, error: listError } = yield db_config_1.default.storage.from(SUPABASE_BUCKET_NAME).list();
        let fileName;
        filesData.forEach((file) => {
            if (file.id === id) {
                fileName = file.name;
            }
        });
        if (!fileName)
            reject(new Error(`File with specified id ${id} was not found`));
        const { data, error } = yield db_config_1.default.storage.from(SUPABASE_BUCKET_NAME).download(fileName);
        if (error || listError) {
            reject(error);
        }
        resolve(data);
    }));
});
exports.default = downloadVideo;
