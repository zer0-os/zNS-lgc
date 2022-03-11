"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.getWord = exports.getWords = exports.getDeploymentData = exports.getLogger = exports.deploymentsFolder = void 0;
const logdown_1 = __importDefault(require("logdown"));
const fs = __importStar(require("fs"));
exports.deploymentsFolder = "./deployments";
const root = "zns";
const getLogger = (title) => {
    const logger = logdown_1.default(`${root}::${title}`);
    logger.state.isEnabled = true;
    return logger;
};
exports.getLogger = getLogger;
const getDeploymentData = (network) => {
    const filepath = `${exports.deploymentsFolder}/${network}.json`;
    const fileExists = fs.existsSync(filepath);
    if (!fileExists) {
        throw new Error(`No deployment data for ${network}`);
    }
    const fileContents = fs.readFileSync(filepath);
    const data = JSON.parse(fileContents.toString());
    return data;
};
exports.getDeploymentData = getDeploymentData;
let wordsCache = [];
const fetchWords = () => {
    if (wordsCache.length) {
        return wordsCache;
    }
    wordsCache = fs
        .readFileSync(`${__dirname}/wordlist.txt`)
        .toString()
        .split("\n")
        .map((e) => e.trim());
    return wordsCache;
};
const getWords = () => {
    const words = fetchWords();
    return words;
};
exports.getWords = getWords;
const getWord = (index) => {
    const words = fetchWords();
    const chosenWord = words[index % words.length];
    return chosenWord;
};
exports.getWord = getWord;
