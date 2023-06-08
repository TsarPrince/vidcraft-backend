"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const multer_1 = __importDefault(require("multer"));
const multer_constant_1 = require("./constants/multer.constant");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swaggerDocument = __importStar(require("./swagger.json"));
const app = (0, express_1.default)();
const cors = require('cors');
const PORT = process.env.PORT || 5000;
dotenv_1.default.config();
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument));
app.use(cors());
app.use(express_1.default.json());
require("./routes/hello.route")(app);
require("./routes/supabase.route")(app);
require("./routes/ffmpeg.route")(app);
// Error handler middleware
app.use((err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        // Multer error occurred (e.g., file size exceeds limit)
        res.status(400).json({ message: `File size limit exceeded. Individual file size should be less than ${multer_constant_1.MAX_FILE_SIZE} MBs.` });
    }
    else {
        // Other error types
        res.status(500).json({ message: 'Internal server error.' });
    }
});
app.listen(PORT, () => {
    console.log(`🚀 server at http://localhost:${PORT}`);
});
