'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const tooling = require('jsonforms-tooling');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    const createExampleProject = vscode.commands.registerCommand('extension.createExampleProject', (args) => {
        if (!args) {
            showMessage('You can only run this on a folder', 'err');
            return;
        }
        const path = args.fsPath;
        showMessage(`Creating example project: ${path}`);
        tooling.cloneAndInstall('example', path, (result, type) => {
            showMessage(result, type);
        });
    });
    const createSeedProject = vscode.commands.registerCommand('extension.createSeedProject', (args) => {
        if (!args) {
            showMessage('You can only run this on a folder', 'err');
            return;
        }
        const path = args.fsPath;
        showMessage(`Creating seed project: ${path}`);
        tooling.cloneAndInstall('seed', path, (result, type) => {
            showMessage(result, type);
        });
    });
    const generateUISchema = vscode.commands.registerCommand('extension.generateUISchema', (args) => {
        if (!args) {
            showMessage('You can only run this on a json file', 'err');
            return;
        }
        const path = args.fsPath;
        showMessage(`Generating UI Schema: ${path}`);
        tooling.generateUISchema(path, (result, type) => {
            showMessage(result, type);
        });
    });
    context.subscriptions.push(createExampleProject);
    context.subscriptions.push(createSeedProject);
    context.subscriptions.push(generateUISchema);
}
exports.activate = activate;
/**
 * Show Visual Studio Code Message
 * @param {string} message the message that should be displayed
 * @param {string} type the type of the message
 */
function showMessage(message, type) {
    switch (type) {
        case 'err':
            vscode.window.showErrorMessage(message);
            break;
        case 'war':
            vscode.window.showWarningMessage(message);
            break;
        default:
            vscode.window.showInformationMessage(message);
    }
}
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map