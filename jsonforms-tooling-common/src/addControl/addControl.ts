import { readFile } from 'fs';
import { resolveData } from '@jsonforms/core';

const schemaPath = './src/addControl/schema.json';
const uiSchemaPath = './src/addControl/ui-schema.json';

readFile(schemaPath, 'utf8', (readSchemaError, schemaData) => {
  if (readSchemaError && readSchemaError.message) {
    console.log(readSchemaError.message);
    return;
  }

  const jsonSchema = JSON.parse(schemaData);

  readFile(uiSchemaPath, 'utf8', (readUiSchemaError, uiSchemaData) => {
    if (readUiSchemaError && readUiSchemaError.message) {
      console.log(readUiSchemaError.message);
      return;
    }

    const jsonUISchema = JSON.parse(uiSchemaData);

    addControls(jsonSchema, jsonUISchema);
  });
});

const addControls = (schema: any, uiSchema: any) => {
  const fields = searchForFields(schema);
  console.log(fields);
  // console.log(objects);
  // console.log(uiSchema);
};

const searchForFields = (schema: any) => {
  if (!schema) {
    return;
  }
  const test = resolveData(schema, schema);
  console.log(test);
  /* let fields = [];
  const properties = schema.properties;
  for(let field in properties) {
    if (field.type !== 'object') {
      fields.push(field);
    } else {
      searchForFields(field);
    }
  }
  console.log(fields); 
  return fields;*/
};
