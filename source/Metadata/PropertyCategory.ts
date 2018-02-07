/*---------------------------------------------------------------------------------------------
|  $Copyright: (c) 2018 Bentley Systems, Incorporated. All rights reserved. $
*--------------------------------------------------------------------------------------------*/

import SchemaChild from "./SchemaChild";
import { ECObjectsError, ECObjectsStatus } from "../Exception";
import { SchemaChildType, SchemaChildKey } from "../ECObjects";
import { SchemaInterface, PropertyCategoryInterface } from "../Interfaces";

export default class PropertyCategory extends SchemaChild implements PropertyCategoryInterface {
  public key: SchemaChildKey.PropertyCategory;
  public readonly type: SchemaChildType.PropertyCategory;
  public priority: number;

  constructor(schema: SchemaInterface, name: string) {
    super(schema, name);
    this.key.type = SchemaChildType.PropertyCategory;
  }

  public async fromJson(jsonObj: any) {
    await super.fromJson(jsonObj);

    if (jsonObj.priority) {
      if (typeof(jsonObj.priority) !== "number")
        throw new ECObjectsError(ECObjectsStatus.InvalidECJson, `The PropertyCategory ${this.name} has an invalid 'priority' attribute. It should be of type 'number'.`);
      this.priority = jsonObj.priority;
    }
  }
}
