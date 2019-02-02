// tslint:disable:no-var-requires
// tslint:disable:no-require-imports
'use strict';

import * as Generator from 'yeoman-generator';
import * as jsonforms from '@jsonforms/core';
import chalk from 'chalk';
const clear = require('clear');
const figlet = require('figlet');
const validate = require('validate-npm-package-name');
import { join, sep } from 'path';
import { readFile, writeFile } from 'fs';
import { URL } from 'url';
import { get } from 'https';

enum ProjectRepo {
  Basic = 'jsonforms-basic-project',
  Example = 'make-it-happen-react',
  Seed = 'jsonforms-react-seed',
}

enum Project {
  Basic = 'basic',
  Example = 'example',
  Seed = 'seed',
}

export class JsonformsGenerator extends Generator {

  project: string;
  repo: string;
  path: string;
  basicProjectSchemaURL: String;
  name: string;
  skipPrompting = false;
  answers: any;

  constructor(args: any, opts: any) {
    super(args, opts);

    this.option('project', { type: String } );
    this.option('path', { type: String } );
    this.option('basicProjectSchemaURL', { type: String } );
    this.option('name', { type: String } );
    this.option('skipPrompting', { type: Boolean } );

    this.project = this.options.project;
    this.repo = '';
    this.path = this.options.path;
    this.basicProjectSchemaURL = this.options.basicProjectSchemaURL;
    this.name = this.options.name;
    this.skipPrompting = this.options.skipPromting;

    if (this.project === Project.Basic) {
      this.repo = ProjectRepo.Basic;
    }
    if (this.project === Project.Example) {
      this.repo = ProjectRepo.Example;
    }
    if (this.project === Project.Seed) {
      this.repo = ProjectRepo.Seed;
    }
  }

  async prompting() {
    clear();
    this.log(
      chalk.blue(
        figlet.textSync('JSONForms Tooling', { horizontalLayout: 'full' }),
      ),
    );
    if (!this.skipPrompting) {
      this.answers = await this.prompt([
        {
          name: 'project',
          type: 'list',
          message: 'Select a project',
          choices: [
            {
              name: 'Basic Project',
              value: ProjectRepo.Basic
            },
            {
              name: 'Example Project',
              value: ProjectRepo.Example
            },
            {
              name: 'Seed Project',
              value: ProjectRepo.Seed
            }
          ],
          when: () => {
            if (this.project == null) {
              return true;
            }
            if (this.project !== 'basic' && this.project !== 'example' && this.project !== 'seed') {
              return true;
            }
            return false;
          }
        },
        {
          name: 'path',
          type: 'input',
          message: 'Enter the path where the project will be installed:',
          default: 'current',
          when: (this.path == null)
        },
        {
          name: 'basicProjectSchemaURL',
          type: 'input',
          message: 'Enter the path or URL of schema from which the ui schema will be generated:',
          default: 'required',
          when: answers => (
            answers.project === ProjectRepo.Basic ||
            this.project === ProjectRepo.Basic
          )
        },
        {
          name: 'name',
          type: 'input',
          message: `Enter the name of the ${this.project} project:`,
          default: `jsonforms-${this.project}`,
          validate: value => {
            const valid = validate(value);
            return valid.validForNewPackages || 'Sorry, name can only contain URL-friendly ' +
            'characters and name can no longer contain capital letters.';
          },
          when: answers => {
            if (
              answers.project === Project.Seed ||
              this.project === Project.Seed ||
              answers.project === Project.Basic ||
              this.project === Project.Basic
            ) {
              if (this.name == null) {
                return true;
              }
              if (!validate(this.name).validForNewPackages) {
                this.log(chalk.red('Sorry, name can only contain URL-friendly ' +
                'characters and name can no longer contain capital letters.'));
                return true;
              }
            }
            return false;
          }
        }
      ]);
      if (this.project == null) {
        this.repo = this.answers.project;
      }
      if (this.answers && this.answers.path === 'current' || this.path === 'current') {
        this.path = process.cwd();
      }
      if (this.path == null) {
        this.path = this.answers.path;
      }
      if (this.basicProjectSchemaURL == null) {
        this.basicProjectSchemaURL = this.answers.basicProjectSchemaURL;
      }
      if (this.name == null || !validate(this.name).validForNewPackages) {
        this.name = this.answers.name;
      }
    }
  }

  async write() {
    this.log('writing');
    const source = join(__dirname, '../../node_modules/' + this.repo) + '/**';
    this.fs.copy(source, this.path);
  }

  async install() {
    this.log('installing');
    if ((this.project === Project.Seed || this.project === Project.Basic) && this.name != null) {
      const packagePath = this.path + sep + 'package.json';
      readFile(packagePath, 'utf8', (readError, data) => {

        if ((readError != null) && readError.message) {
          this.log(chalk.red(readError.message));
          return;
        }

        const packageJson = JSON.parse(data);
        packageJson.name = this.name;

        writeFile(packagePath, JSON.stringify(packageJson, null, 2), writeError => {
          if (writeError) {
            this.log(chalk.red(writeError.message));
            return;
          }
        });
      });
    }

    if (this.project === Project.Basic) {
      this.retrieveAndSaveJSONUISchemaFromAPI(
        this.repo,
        new URL(this.basicProjectSchemaURL.toString())
      );
    }

    process.chdir(this.path);
    this.installDependencies({
      bower: false,
      npm: true
    });
  }

  /**
   * Function to retrieve OpenAPI definition from endpoint and get the JSON UI Schema
   * from it to save it in JSON format.
   * @param {string} repo the name of the repo that should be cloned.
   * @param {URL} endpoint to the OpenAPI definition.
   */
  retrieveAndSaveJSONUISchemaFromAPI = (repo: string, endpoint: URL) => {
    this.log(`Getting endpoint for ${repo} project.`);
    const reqOptions = {
      host : endpoint.hostname,
      path:  endpoint.pathname,
      json: true,
      headers: {
          'content-type': 'text/json'
      },
    };
    get(reqOptions, response => {
      response.setEncoding('utf-8');
      response.on('data', schema => {
        const schemaObj = JSON.parse(schema);
        const jsonSchema = schemaObj.components.schemas.Applicant;
        // Construct paths
        const jsonUISchemaPath = `src${sep}json-ui-schema.json`;
        // Generate .json file
        this.log('Generating the UI Schema file...');
        this.generateJSONUISchemaFile(jsonUISchemaPath, jsonSchema);
      });
    }).on('error', err => {
      this.log(err.message, 'err');
      console.log(err.message);
    });
  }

  /**
   * Generate file containing JSON UI Schema.
   * @param path {string} : Path to which the file will be saved.
   * @param jsonSchema {any} : Valid JSON Schema to generate the UI Schema from.
   */
  generateJSONUISchemaFile = (path: string, jsonSchema: any) => {
    // Generate UI Schema
    const jsonUISchema = jsonforms.generateDefaultUISchema(jsonSchema);
    writeFile(path, JSON.stringify(jsonUISchema, null, 2), writeError => {
      if (writeError) {
        this.log(chalk.red(writeError.message));
        return;
      }
      this.log('Successfully generated the UI Schema file!');
    });
  }
}

export default JsonformsGenerator;
