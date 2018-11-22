"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const simplegit = require("simple-git/promise");
const jsonforms = require("@jsonforms/core");
const cp = require("child_process");
const fs_1 = require("fs");
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
/*
 * Clones a git repository and runs npm install on it
 * @param {string} repo the name of the repo that should be cloned
 * @param {string} path to the folder, where the repo should be cloned into
 * @param {function} callback forwards the current status to the caller
 */
function cloneAndInstall(repo, path, callback) {
    let url = '';
    switch (repo) {
        case 'example':
            url = 'https://github.com/eclipsesource/make-it-happen-react';
            break;
        case 'seed':
            url = 'https://github.com/eclipsesource/jsonforms-react-seed';
            break;
    }
    const git = simplegit();
    callback('Starting to clone repo');
    git.clone(url, path)
        .then(() => {
        callback('Finished to clone repo');
        callback('Running npm install');
        const result = cp.spawnSync(npm, ['install'], {
            cwd: path,
        });
        callback(result.signal);
    })
        .catch((err) => { callback(err.message, 'err'); });
}
exports.cloneAndInstall = cloneAndInstall;
/**
 * Generates the default UI Schema from a json schema
 * @param {string} path path to the json schema file
 * @param {function} callback forwards the current status to the caller
 */
function generateUISchema(path, callback) {
    fs_1.readFile(path, 'utf8', (err, data) => {
        if (err)
            callback(err.message, 'err');
        const jsonSchema = JSON.parse(data);
        const jsonUISchema = jsonforms.generateDefaultUISchema(jsonSchema);
        let newPath = '';
        if (process.platform === 'win32') {
            newPath = path.substring(0, path.lastIndexOf('\\'));
            newPath = `${newPath}\\ui-schema.json`;
        }
        else {
            newPath = path.substring(0, path.lastIndexOf('/'));
            newPath = `${newPath}/ui-schema.json`;
        }
        fs_1.writeFile(newPath, JSON.stringify(jsonUISchema, null, 2), (err) => {
            if (err)
                callback(err.message, 'err');
            callback('Successfully generated UI schema');
        });
    });
}
exports.generateUISchema = generateUISchema;
//# sourceMappingURL=index.js.map