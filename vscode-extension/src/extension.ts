'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { createProject, generateUISchema, Project, showTreeEditor } from 'jsonforms-tooling-common';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export const activate = (context: vscode.ExtensionContext) => {

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  const createExampleProjectCommand = vscode.commands.registerCommand(
    'extension.createExampleProject',
    (args: any) => {
      if (args === undefined) {
        args = {fsPath: null};
      }
      createProject(vscode, args.fsPath, Project.Example);
    }
  );

  const createSeedProjectCommand = vscode.commands.registerCommand(
    'extension.createSeedProject',
    (args: any) => {
      if (args === undefined) {
        args = {fsPath: null};
      }
      createProject(vscode, args.fsPath, Project.Seed);
    }
  );

  const generateUISchemaCommand = vscode.commands.registerCommand(
    'extension.generateUISchema',
    (args: any) => {
      if (args === undefined) {
        args = {fsPath: null};
      }
      generateUISchema(vscode, args.fsPath);
  });

  const showTreeEditorCommand = vscode.commands.registerCommand(
    'extension.showTreeEditor',
    (args: any) => {
      if (args === undefined) {
        args = {fsPath: null};
      }
      showTreeEditor(vscode, args.fsPath);
  });

  context.subscriptions.push(createExampleProjectCommand);
  context.subscriptions.push(createSeedProjectCommand);
  context.subscriptions.push(generateUISchemaCommand);
  context.subscriptions.push(showTreeEditorCommand);
};
