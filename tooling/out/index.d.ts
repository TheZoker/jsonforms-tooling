export declare function cloneAndInstall(repo: String, path: string, callback: (result: string, type?: string) => void): void;
/**
 * Generates the default UI Schema from a json schema
 * @param {string} path path to the json schema file
 * @param {function} callback forwards the current status to the caller
 */
export declare function generateUISchema(path: string, callback: (result: string, type?: string) => void): void;
