import path from "path";
import Module from "module";

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

export {};
