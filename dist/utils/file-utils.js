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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUtils = void 0;
const fs = __importStar(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const glob_1 = require("glob");
class FileUtils {
    static async ensureDirectory(dirPath) {
        await fs.ensureDir(dirPath);
    }
    static async fileExists(filePath) {
        return fs.pathExists(filePath);
    }
    static async getFileSize(filePath) {
        const stats = await fs.stat(filePath);
        return stats.size;
    }
    static async findFiles(pattern, cwd = process.cwd()) {
        return (0, glob_1.glob)(pattern, { cwd, absolute: true });
    }
    static formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }
    static getRelativePath(from, to) {
        return path_1.default.relative(from, to);
    }
    static async copyFile(source, destination) {
        await fs.ensureDir(path_1.default.dirname(destination));
        await fs.copy(source, destination);
    }
    static async deleteFile(filePath) {
        if (await this.fileExists(filePath)) {
            await fs.remove(filePath);
        }
    }
    static async readJsonFile(filePath) {
        const content = await fs.readFile(filePath, 'utf8');
        return JSON.parse(content);
    }
    static async writeJsonFile(filePath, data) {
        await fs.ensureDir(path_1.default.dirname(filePath));
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    }
    static async writeTextFile(filePath, content) {
        await fs.ensureDir(path_1.default.dirname(filePath));
        await fs.writeFile(filePath, content, 'utf8');
    }
    static getFileExtension(filePath) {
        return path_1.default.extname(filePath).toLowerCase().slice(1);
    }
    static getBaseName(filePath) {
        return path_1.default.basename(filePath, path_1.default.extname(filePath));
    }
}
exports.FileUtils = FileUtils;
//# sourceMappingURL=file-utils.js.map