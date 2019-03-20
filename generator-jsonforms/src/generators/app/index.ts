// tslint:disable:no-var-requires
// tslint:disable:no-require-imports

import Generator from 'yeoman-generator';
import { generateDefaultUISchema } from '@jsonforms/core';
import chalk from 'chalk';
import { textSync } from 'figlet';
import { join } from 'path';
import { readFile, writeFile } from 'fs';
import { copy } from 'fs-extra';
import { promisify } from 'util';
import { URL } from 'url';
import { get } from 'https';
const clear = require('clear');
const validate = require('validate-npm-package-name');

enum ProjectRepo {
  Example = 'make-it-happen-react',
  Seed = 'jsonforms-react-seed',
  Basic = 'jsonforms-basic-project',
  Scaffolding = 'jsonforms-scaffolding-project',
}

enum Project {
  Example = 'example',
  Seed = 'seed',
  Basic = 'basic',
  Scaffolding = 'scaffolding',
}

const writeFileWithPromise = promisify(writeFile);
const readFileWithPromise = promisify(readFile);

export class JsonformsGenerator extends Generator {

  project: string;
  repo: string;
  path: string;
  schemaPath: string;
  name: string;
  skipPrompting = false;
  answers: any;

  constructor(args: any, opts: any) {
    super(args, opts);

    this.option('project', { type: String } );
    this.option('path', { type: String } );
    this.option('schemaPath', { type: String } );
    this.option('name', { type: String } );
    this.option('skipPrompting', { type: Boolean } );

    this.project = this.options.project;
    this.repo = '';
    this.path = this.options.path;
    this.schemaPath = this.options.schemaPath;
    this.name = this.options.name;
    this.skipPrompting = this.options.skipPrompting;

    switch (this.project) {
      case Project.Example:
        this.repo = ProjectRepo.Example;
        break;
      case Project.Seed:
        this.repo = ProjectRepo.Seed;
        break;
      case Project.Basic:
        this.repo = ProjectRepo.Basic;
        break;
      case Project.Scaffolding:
        this.repo = ProjectRepo.Scaffolding;
        break;
      default:
        break;
    }
  }

  async prompting() {
    if (!this.skipPrompting) {
      clear();
      this.log(
        chalk.blue(
          textSync('JSONForms Tooling', { horizontalLayout: 'full' }),
        ),
      );
      this.answers = await this.prompt([
        {
          name: 'project',
          type: 'list',
          message: 'Select a project',
          choices: [
            {
              name: 'Example Project',
              value: ProjectRepo.Example
            },
            {
              name: 'Seed Project',
              value: ProjectRepo.Seed
            },
            {
              name: 'Basic Project',
              value: ProjectRepo.Basic
            },
            {
              name: 'Scaffolding Project',
              value: ProjectRepo.Scaffolding
            },
          ],
          when: () => {
            if (this.project == null) {
              return true;
            }
            if (this.project !== Project.Example
              && this.project !== Project.Seed
              && this.project !== Project.Basic
              && this.project !== Project.Scaffolding) {
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
          name: 'schemaPath',
          type: 'input',
          message: 'Enter the path of schema from which the ui schema will be generated:',
          default: 'required',
          when: answers => (
            answers.project === ProjectRepo.Scaffolding ||
            this.project === ProjectRepo.Scaffolding
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
            if (answers.project !== Project.Example && this.project !== Project.Example) {
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
      if (this.schemaPath == null) {
        this.schemaPath = this.answers.schemaPath;
      }
      if (this.name == null || !validate(this.name).validForNewPackages) {
        this.name = this.answers.name;
      }
    }
  }

  async write() {
    this.log('Writing files to disk');
    const source = join(__dirname, '../../node_modules', this.repo);
    try {
      await copy(source, this.path);
      this.log('Done writing files');
    } catch (err) {
      this.log(err);
      return;
    }
  }

  async install() {
    this.log('Installing dependencies. This can take a while.');

    if ((this.project === Project.Seed || this.project === Project.Scaffolding)
      && this.name != null) {
      const packagePath = join(this.path, 'package.json');
      let packageJson = null;
      try {
        const content = await readFileWithPromise(packagePath, 'utf8');
        packageJson = JSON.parse(content);
      } catch (err) {
        this.log(chalk.red(err.message));
        return;
      }
      packageJson.name = this.name;

      try {
        await writeFileWithPromise(packagePath, JSON.stringify(packageJson, null, 2));
      } catch (err) {
        this.log(chalk.red(err.message));
        return;
      }
    }

    if (this.project === Project.Basic) {
      await this.getSchemaFromAPI(new URL(this.schemaPath));
    }

    if (this.project === Project.Scaffolding) {
      await this.getSchemaFromPath(this.schemaPath);
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
   * @param {string} schemaPath path to the schema file for generating the ui schema.
   */
  getSchemaFromPath = async (schemaPath: string) => {
    let jsonSchema = null;
    try {
      const content = await readFileWithPromise(schemaPath, 'utf8');
      jsonSchema = JSON.parse(content);
    } catch (err) {
      this.log(chalk.red(err.message));
      return;
    }
    this.log('Saving json schema file into project...');
    const srcPath = join(this.path, 'src');
    try {
      await writeFileWithPromise(join(srcPath, 'schema.json'), JSON.stringify(jsonSchema, null, 2));
    } catch (err) {
      this.log(chalk.red(err.message));
      return;
    }
    this.log('Successfully generated the schema file!');
    this.log('Generating the UI Schema file...');
    await this.generateUISchema(join(srcPath, 'uischema.json'), jsonSchema);
  };

  /**
   * Function to retrieve OpenAPI definition from endpoint and get the JSON UI Schema
   * from it to save it in JSON format.
   * @param {URL} endpoint to the OpenAPI definition.
   */
  getSchemaFromAPI = async (endpoint: URL) => {
    this.log(`Getting endpoint for basic project.`);
    const reqOptions = {
      host : endpoint.hostname,
      path:  endpoint.pathname,
      json: true,
      headers: {
        'content-type': 'text/json'
      },
    };
    try {
      await get(reqOptions, (response: any) => {
        response.setEncoding('utf-8');
        response.on('data', async (schema: any) => {
          this.log('Generating the UI Schema file...');
          const schemaObj = JSON.parse(schema);
          const jsonSchema = schemaObj.components.schemas.Applicant;
          const srcPath = join(this.path, 'src');

          // Create vars.js, schema.json and uischema.json file
          const obj = `const ENDPOINT = \'${endpoint}\';\nexport default ENDPOINT;`;
          try {
            await writeFileWithPromise(join(srcPath, 'vars.js'), obj);
          } catch (err) {
            this.log(chalk.red(err.message));
          }
          try {
            const jsonSchemaContent = JSON.stringify(jsonSchema, null, 2);
            await writeFileWithPromise(join(srcPath, 'schema.json'), jsonSchemaContent);
          } catch (err) {
            this.log(chalk.red(err.message));
            return;
          }
          this.log('Successfully generated endpoint!');
          this.generateUISchema(join(srcPath, 'uischema.json'), jsonSchema);
        }).on('error', (err: any) => {
          this.log(chalk.red(err.message));
        });
      });
    } catch (err) {
      this.log(chalk.red(err.message));
      return;
    }
  };

  /**
   * Generate file containing JSON UI Schema.
   * @param path {string} : Path to which the file will be saved.
   * @param jsonSchema {any} : Valid JSON Schema to generate the UI Schema from.
   */
  generateUISchema = async (path: string, jsonSchema: any) => {
    // Generate UI Schema
    const jsonUISchema = await generateDefaultUISchema(jsonSchema);
    try {
      await writeFileWithPromise(path, JSON.stringify(jsonUISchema, null, 2));
    } catch (err) {
      this.log(chalk.red(err.message));
      return;
    }
    this.log('Successfully generated the UI Schema file!');
  };
}

export default JsonformsGenerator;
