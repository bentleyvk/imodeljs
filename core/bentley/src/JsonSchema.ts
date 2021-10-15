/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

// adapted from https://github.com/microsoft/vscode Copyright (c) 2015 - present Microsoft Corporation

export type JSONSchemaType = "string" | "number" | "integer" | "boolean" | "null" | "array" | "object";

export interface JSONSchema {
  id?: string;
  $id?: string;
  $schema?: string;
  type?: JSONSchemaType | JSONSchemaType[];
  title?: string;
  default?: any;
  definitions?: JSONSchemaMap;
  description?: string;
  properties?: JSONSchemaMap;
  patternProperties?: JSONSchemaMap;
  additionalProperties?: boolean | JSONSchema;
  minProperties?: number;
  maxProperties?: number;
  dependencies?: JSONSchemaMap | { [prop: string]: string[] };
  items?: JSONSchema | JSONSchema[];
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  additionalItems?: boolean | JSONSchema;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: boolean | number;
  exclusiveMaximum?: boolean | number;
  multipleOf?: number;
  required?: string[];
  $ref?: string;
  anyOf?: JSONSchema[];
  allOf?: JSONSchema[];
  oneOf?: JSONSchema[];
  not?: JSONSchema;
  enum?: any[];
  format?: string;

  // schema draft 06
  const?: any;
  contains?: JSONSchema;
  propertyNames?: JSONSchema;

  // schema draft 07
  $comment?: string;
  if?: JSONSchema;
  then?: JSONSchema;
  else?: JSONSchema;

  // VS Code extensions
  defaultSnippets?: JSONSchemaSnippet[];
  errorMessage?: string;
  patternErrorMessage?: string;
  deprecationMessage?: string;
  markdownDeprecationMessage?: string;
  enumDescriptions?: string[];
  markdownEnumDescriptions?: string[];
  markdownDescription?: string;
  doNotSuggest?: boolean;
  suggestSortText?: string;
  allowComments?: boolean;
  allowTrailingCommas?: boolean;
}

export interface JSONSchemaMap {
  [name: string]: JSONSchema;
}

export interface JSONSchemaSnippet {
  label?: string;
  description?: string;
  body?: any; // a object that will be JSON stringified
  bodyText?: string; // an already stringified JSON object that can contain new lines (\n) and tabs (\t)
}
