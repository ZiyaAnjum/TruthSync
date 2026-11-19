import path from "path";
import fs from "fs";
import Module from "module";
import dotenv from "dotenv";

const backendNodeModules = path.resolve(__dirname, "../node_modules");

// @ts-ignore
if (Module.globalPaths && !Module.globalPaths.includes(backendNodeModules)) {
  // @ts-ignore
  Module.globalPaths.push(backendNodeModules);
}

process.env.NODE_PATH = process.env.NODE_PATH
  ? `${backendNodeModules}${path.delimiter}${process.env.NODE_PATH}`
  : backendNodeModules;

// @ts-ignore
if (typeof Module._initPaths === "function") {
  // @ts-ignore
  Module._initPaths();
}

// Load environment variables from backend/.env or root .env
const envCandidates = [
  path.resolve(__dirname, "../.env"),
  path.resolve(process.cwd(), "backend/.env"),
  path.resolve(process.cwd(), ".env"),
];
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}
dotenv.config();

export {};
