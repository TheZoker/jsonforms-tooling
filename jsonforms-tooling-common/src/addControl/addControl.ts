// tslint:disable:no-use-before-declare

import { readFile } from 'fs';

const schemaPath = './src/addControl/schema.json';
const uiSchemaPath = './src/addControl/ui-schema.json';

readFile(schemaPath, 'utf8', (readSchemaError, schemaData) => {
  if (readSchemaError.message) {
    console.log(readSchemaError.message);
    return;
  }

  readFile(uiSchemaPath, 'utf8', (readUiSchemaError, uiSchemaData) => {
    if (readUiSchemaError.message) {
      console.log(readUiSchemaError.message);
      return;
    }

    addControls(schemaData, uiSchemaData);
  });
});

const addControls = (schemaData: any, uiSchemaData: any) => {
  const parsedSchema = JSON.parse(schemaData);
  const parsedUiSchema = JSON.parse(uiSchemaData);

  // get all the schema fields
  const fields: any = [];
  if (parsedSchema.type !== 'object') {
    const field = Object.keys(parsedSchema)[0];
    fields.push(field);
  } else {
    getFields(fields, parsedSchema.properties, '');
  }
  console.log(fields);

  // get all the uischema controls
  const controls: any = [];
  getControls(controls, parsedUiSchema.elements);
  console.log(controls);

  // compare fields and controls and return missing controls
  const missingControls = compare(fields, controls);
  console.log(missingControls);
};

const getFields = (fields: any, schema: any, root: string) => {
  for (const leaf in schema) {
    if (schema.hasOwnProperty(leaf)) {
      const value = schema[leaf];
      if (value.type === 'object') {
        getFields(fields, value.properties, leaf);
      } else {
        if (root === '') {
          fields.push(leaf);
        } else {
          fields.push(root + '.' + leaf);
        }
      }
    }
  }
};

const getControls = (controls: any, uischema: any) => {
  for (const leaf in uischema) {
    if (uischema.hasOwnProperty(leaf)) {
      const value = uischema[leaf];
      if (value.type !== 'Control') {
        getControls(controls, value.elements);
      } else {
        controls.push(value.scope);
      }
    }
  }
};

const compare = (fields: any, controls: any): any => {
  const missingControls = [];
  for (const field in fields) {
    if (fields.hasOwnProperty(field)) {
      const newField = fields[field];
      let ref = '#';
      const levels = newField.split('.');
      for (const level in levels) {
        if (levels.hasOwnProperty(level)) {
          const newLevel = levels[level];
          ref = `${ref}'/properties/'${newLevel}`;
        }
      }
      if (!controls.includes(ref)) {
        missingControls.push(newField);
      }
    }
  }
  return missingControls;
};
