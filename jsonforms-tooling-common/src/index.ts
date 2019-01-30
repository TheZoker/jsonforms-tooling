// tslint:disable:no-var-requires
// tslint:disable:no-require-imports
// tslint:disable:no-use-before-declare

import * as jsonforms from '@jsonforms/core';
import { readFile, writeFile } from 'fs';
import * as Ajv from 'ajv';
import { sep } from 'path';
const yeoman = require('yeoman-environment');

export enum Project {
  Example = 'example',
  Seed = 'seed',
}

/**
 * Receives the data from the editor and calls the install methods
 * @param {any} editorInstance the instance of the editor
 * @param {string} path the path for the project
 * @param {string} project the project, that should be installed
 */
export const createProject = (editorInstance: any, path: string, project: string) => {
  if (!path) {
    editorInstance.window.showOpenDialog(editorInstance.OpenDialogOptions = {
      canSelectMany: false,
      canSelectFolders: true,
      canSelectFiles: false,
      openLabel: 'Select folder',
    }).then((fileUri: any) => {
      if (fileUri && fileUri[0].fsPath) {
        asyncCreateProject(editorInstance, fileUri[0].fsPath, project);
      } else {
        showMessage(editorInstance, 'Please select a empty folder', 'err');
        return;
      }
    });
  } else {
    asyncCreateProject(editorInstance, path, project);
  }
};

/**
 * Generates the default UI Schema from a json schema
 * @param {any} editorInstance the instance of the editor
 * @param {string} path the path to the schema file
 */
export const generateUISchema = (editorInstance: any, path: string) => {
  if (!path) {
    editorInstance.window.showOpenDialog(editorInstance.OpenDialogOptions = {
      canSelectMany: false,
      canSelectFolders: false,
      canSelectFiles: true,
      openLabel: 'Select schema',
      filters: {
        'Json Files': ['json'],
      },
    }).then((fileUri: any) => {
      if (fileUri && fileUri[0].fsPath) {
        asyncGenerateUiSchema(editorInstance, fileUri[0].fsPath);
      } else {
        showMessage('Please select a json schema file', 'err');
        return;
      }
    });
  } else {
    asyncGenerateUiSchema(editorInstance, path);
  }
};

/**
 * Shows the jsonforms tree editor within the editor
 * @param {any} editorInstance the instance of the editor
 * @param {string} path the path to the schema or ui-schema file
 */
export const showTreeEditor = (editorInstance: any, path: string) => {
  if (!path) {
    editorInstance.window.showOpenDialog(editorInstance.OpenDialogOptions = {
      canSelectMany: false,
      canSelectFolders: false,
      canSelectFiles: true,
      openLabel: 'Select ui schema',
      filters: {
        'Json Files': ['json'],
      },
    }).then((uiSchemafileUri: any) => {
      if (uiSchemafileUri && uiSchemafileUri[0].fsPath) {
        editorInstance.window.showOpenDialog(editorInstance.OpenDialogOptions = {
          canSelectMany: false,
          canSelectFolders: false,
          canSelectFiles: true,
          openLabel: 'Select schema',
          filters: {
            'Json Files': ['json'],
          },
        }).then((schemaFileUri: any) => {
          if (schemaFileUri && schemaFileUri[0].fsPath) {
            showWebview(editorInstance, uiSchemafileUri, schemaFileUri, 'tree');
          } else {
            showMessage('Please select a json schema file', 'err');
            return;
          }
        });
      } else {
        showMessage('Please select a ui schema file', 'err');
        return;
      }
    });
  } else {
    editorInstance.window.showQuickPick(['UI Schema', 'Schema'], editorInstance.QuickPickOptions = {
      canSelectMany: false,
      placeHolder: 'Was that the UI schema or the schema file?'
    }).then((schema: any) => {
      if (schema) {
        let selectLabel = 'Select ui Schema';
        if (schema === 'UI Schema') {
          selectLabel = 'Select Schema';
        }
        editorInstance.window.showOpenDialog(editorInstance.OpenDialogOptions = {
          canSelectMany: false,
          canSelectFolders: false,
          canSelectFiles: true,
          openLabel: selectLabel,
          filters: {
            'Json Files': ['json'],
          },
        }).then((schemaFileUri: any) => {
          if (schemaFileUri && schemaFileUri[0].fsPath) {
            if (schema === 'UI Schema') {
              showWebview(editorInstance, path, schemaFileUri, 'tree');
            } else {
              showWebview(editorInstance, schemaFileUri, path, 'tree');
            }
          } else {
            showMessage('Please select a json schema file', 'err');
            return;
          }
        });
      } else {
        showMessage('Please select the schema type', 'err');
        return;
      }
    });
  }
};

/**
 * Async Generate UI Schema
 * @param {any} editorInstance the instance of the editor
 * @param {string} path the path to the schema file
 */
const asyncGenerateUiSchema = (editorInstance: any, path: string) => {
  editorInstance.window.showInputBox(editorInstance.InputBoxOptions = {
    prompt: 'Label: ',
    placeHolder: 'Enter a filename for your UI Schema (default: ui-schema.json)',
  }).then((name: string) => {
    let fileName = name;
    if (!fileName) {
      fileName = 'ui-schema.json';
    }
    showMessage(editorInstance, `Generating UI Schema: ${path}`);
    // Read JSON Schema file
    readFile(path, 'utf8', (readError, data) => {
      if (readError.message) {
        showMessage(editorInstance, readError.message, 'err');
        return;
      }

      const jsonSchema = JSON.parse(data);
      validateJSONSchema(jsonSchema, (validateError?: string) => {
        if (validateError) {
          showMessage(editorInstance, validateError, 'err');
          return;
        }

        const jsonUISchema = jsonforms.generateDefaultUISchema(jsonSchema);

        // Check if windows or linux filesystem
        let newPath = path.substring(0, path.lastIndexOf(sep));
        newPath = newPath + sep + name;

        // Write UI Schema file
        writeFile(newPath, JSON.stringify(jsonUISchema, null, 2), writeError => {
          if (writeError.message) {
            showMessage(editorInstance, writeError.message, 'err');
            return;
          }
          showMessage(editorInstance, 'Successfully generated UI schema');
        });
      });
    });
  });
};

/**
 * Validate a given JSON Schema
 * @param {Object} schema the json schema, that will be validated
 * @param {function} callback forwards the current status to the caller
 */
const validateJSONSchema = (schema: Object, callback: (err?: string) => void) => {
  const ajv = new Ajv();
  try {
    ajv.compile(schema);
    callback();
  } catch (error) {
    callback(error.message);
  }
};

/**
 * Show message within the editor
 * @param {any} editorInstance the instance of the editor
 * @param {string} message the message that should be displayed
 * @param {string} type the optional type of the message
 */
const showMessage = (editorInstance: any, message: string, type?: string) => {
  switch (type) {
    case 'err':
      editorInstance.window.showErrorMessage(message);
      break;
    case 'war':
      editorInstance.window.showWarningMessage(message);
      break;
    default:
      editorInstance.window.showInformationMessage(message);
  }
};

/**
 * Async Creating Project
 * @param {any} editorInstance the instance of the editor
 * @param {string} path the path to the project folder
 * @param {string} project the project, that will be created
 */
const asyncCreateProject = (editorInstance: any, path: string, project: string) => {

  if (project === Project.Example) {
    showMessage(editorInstance, `Creating example project: ${path}`);
    cloneAndInstall(editorInstance, project, path);
    return;
  }

  editorInstance.window.showInputBox(editorInstance.InputBoxOptions = {
    prompt: 'Label: ',
    placeHolder: `Enter a name for your ${project} project`,
  }).then((name: any) => {
    let projectName = name;
    if (!name) {
      projectName = `jsonforms-${project}`;
    } else {
      showMessage(editorInstance, `Creating ${project} project: ${path}`);
      cloneAndInstall(editorInstance, project, path, projectName);
    }
  });
};

/**
 * Async Clone And Install
 * @param {any} editorInstance the instance of the editor
 * @param {string} url the url to the project repository
 * @param {string} path the path to the project folder
 * @param {string} name the name of the project
 */
const cloneAndInstall = (editorInstance: any, project: string, path: string, name?: string) => {
  const env = yeoman.createEnv();
  env.on('error', (err: any) => {
    console.error('Error', err.message);
    process.exit(err.code);
  });
  env.lookup(() => {
    const options = {
      'project': project,
      'path': path,
      'name': name,
      'skipPrompting': true,
    };
    env.run('jsonforms', options, (err: any) => {
      if (err.message) {
        showMessage(editorInstance, `Error creating project:  ${err.message}`, 'err');
      } else {
        showMessage(editorInstance, `Done creating ${project} project`);
      }
    });
  });
};

/**
 * Show localhost within webview
 * @param {any} editorInstance the instance of the editor
 * @param {string} uiSchemaPath the path to the ui schema
 * @param {string} schemaPath the path to the schema
 * @param {string} id the id for the webview
 */
const showWebview = (editorInstance: any, uiSchemaPath: string, schemaPath: string, id: string) => {
  // TODO: start webserver, pass uischema and schema path
  // TODO: get port back
  const port = 3000;
  let name = 'Preview';
  if (id === 'tree') {
    name = 'TreeEditor';
  }
  const webView = editorInstance.window.createWebviewPanel(
    'view-' + id,
    name,
    editorInstance.ViewColumn.Two,
    { enableScripts: true }
  );
  webView.webview.html = '<!DOCTYPE html>' +
  '<html lang="en"><iframe src="http://locahost:' + port + '"' +
  'style="height: 100vh; width: 100vw">' + name + '</iframe></html>';
};
