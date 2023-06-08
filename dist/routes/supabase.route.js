"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({ dest: 'uploads/' });
const supabase_controller_1 = __importDefault(require("../controllers/supabase.controller"));
module.exports = (app) => {
    app.post('/api/upload', upload.single('video'), supabase_controller_1.default.uploadVideo);
    app.delete('/api/emptyBucket', supabase_controller_1.default.emptyBucket);
};
