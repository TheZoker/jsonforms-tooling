"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const simplegit = require("simple-git/promise");
const jsonforms = require("@jsonforms/core");
const cp = require("child_process");
const fs_1 = require("fs");
const Ajv = require("ajv");
var npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
/*
 * Clones a git repository and runs npm install on it
 * @param {string} repo the name of the repo that should be cloned
 * @param {string} path to the folder, where the repo should be cloned into
 * @param {function} callback forwards the current status to the caller
 */
function cloneAndInstall(repo, path, callback) {
    var url = '';
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
        .then(function () {
        callback('Finished to clone repo');
        callback('Running npm install');
        const result = cp.spawnSync(npm, ['install'], {
            cwd: path
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
function generateUISchema(path, name, callback) {
    // Read JSON Schema file
    fs_1.readFile(path, 'utf8', (err, data) => {
        if (err) {
            callback(err.message, 'err');
            return;
        }
        var jsonSchema = JSON.parse(data);
        validateJSONSchema(jsonSchema, function (err) {
            if (err) {
                callback(err, 'err');
                return;
            }
            var jsonUISchema = jsonforms.generateDefaultUISchema(jsonSchema);
            // Check if windows or linux filesystem
            if (process.platform === 'win32') {
                var newPath = path.substring(0, path.lastIndexOf("\\")) + '\\' + name;
            }
            else {
                var newPath = path.substring(0, path.lastIndexOf("/")) + '/' + name;
            }
            // Write UI Schema file
            fs_1.writeFile(newPath, JSON.stringify(jsonUISchema, null, 2), (err) => {
                if (err) {
                    callback(err.message, 'err');
                    return;
                }
                callback('Successfully generated UI schema');
            });
        });
    });
}
exports.generateUISchema = generateUISchema;
/**
 * Validate a given JSON Schema
 * @param {string} path path to the json schema file
 * @param {function} callback forwards the current status to the caller
 */
function validateJSONSchema(schema, callback) {
    var ajv = new Ajv();
    try {
        ajv.compile(schema);
        callback();
    }
    catch (error) {
        callback(error.message);
    }
}
//# sourceMappingURL=index.js.map