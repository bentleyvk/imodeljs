/*---------------------------------------------------------------------------------------------
|  $Copyright: (c) 2018 Bentley Systems, Incorporated. All rights reserved. $
*--------------------------------------------------------------------------------------------*/

import SchemaChild from "./SchemaChild";
import { ECObjectsError, ECObjectsStatus } from "../Exception";
import { PrimitiveType, SchemaChildType, SchemaChildKey } from "../ECObjects";
import { EnumerationInterface, EnumeratorProps, SchemaInterface } from "../Interfaces";

/**
 * A Typescript class representation of an ECEnumeration.
 */
export default class Enumeration extends SchemaChild implements EnumerationInterface {
  public key: SchemaChildKey.Enumeration;
  public readonly type: SchemaChildType.Enumeration;
  public primitiveType: PrimitiveType.Integer | PrimitiveType.String;
  public isStrict: boolean;
  public enumerators: Enumerator[];

  constructor(schema: SchemaInterface, name: string) {
    super(schema, name);

    this.key.type = SchemaChildType.Enumeration;

    this.primitiveType = PrimitiveType.Integer;
    this.isStrict = true;
    this.enumerators = [];
  }

  /**
   * Returns an enumerator that matches the value provided.
   * @param value The value of the Enumerator to find.
   */
  public getEnumerator(value: string | number): Enumerator | undefined {
    return this.enumerators.find((item) => item.value === value);
  }

  /**
   * Creates an Enumerator with the provided value and label and adds it to the this Enumeration.
   * @param value The value of the enumerator. The type of this value is dependent on the backing type of the this Enumeration.
   * @param label The label to be used
   */
  public createEnumerator(value: string | number, label?: string) {
    if ((typeof(value) === "string" && this.primitiveType !== PrimitiveType.String) ||
        (typeof(value) === "number" && this.primitiveType !== PrimitiveType.Integer))
      throw new ECObjectsError(ECObjectsStatus.InvalidEnumValue, `The value`);

    this.enumerators.push(new Enumerator(value, label));
  }

  /**
   *
   * @param enumerator The Enumerator to add to the this Enumeration
   */
  // Not sure if we want to keep this in the public api.
  public addEnumerator(enumerator: Enumerator): void {
    // TODO: Need to validate that the enumerator has a unique value.

    this.enumerators.push(enumerator);
  }

  /**
   * Populates this Enumeration with the values from the provided.
   */
  public async fromJson(jsonObj: any) {
    await super.fromJson(jsonObj);

    if (jsonObj.isStrict) {
      if (typeof(jsonObj.isStrict) !== "boolean")
        throw new ECObjectsError(ECObjectsStatus.InvalidECJson, `The Enumeration ${this.name} has an invalid 'isStrict' attribute. It should be of type 'boolean'.`);
      this.isStrict = jsonObj.isStrict;
    }

    if (jsonObj.backingTypeName) {
      if (/int/i.test(jsonObj.backingTypeName))
        this.primitiveType = PrimitiveType.Integer;
      else if (/string/i.test(jsonObj.backingTypeName))
        this.primitiveType = PrimitiveType.String;
    }

    if (jsonObj.enumerators) {
      if (!Array.isArray(jsonObj.enumerators))
        throw new ECObjectsError(ECObjectsStatus.InvalidECJson, `The Enumeration ${this.name} has an invalid 'enumerators' attribute. It should be of type 'array'.`);

      jsonObj.enumerators.forEach((enumerator: any) => {
        if (!enumerator.value && enumerator.value !== 0)
          throw new ECObjectsError(ECObjectsStatus.InvalidECJson, `The Enumeration ${this.name} has an enumerator that is missing the required attribute 'value'.`);
        else if (typeof(enumerator.value) !== "string" && typeof(enumerator.value) !== "number")
          throw new ECObjectsError(ECObjectsStatus.InvalidECJson, `The Enumeration ${this.name} has an enumerator with an invalid 'value' attribute.
                                                                    The value attribute must be of type ${this.primitiveType === PrimitiveType.Integer ? "'number'" : "'string'"}.`);
        // Need to check if the Enumerator exists
        let newEnum = this.getEnumerator(enumerator.value);
        if (!newEnum)
          newEnum = new Enumerator(enumerator.value);

        if (enumerator.label) {
          if (typeof(enumerator.label) !== "string")
            throw new ECObjectsError(ECObjectsStatus.InvalidECJson, `The Enumeration ${this.name} has an enumerator with an invalid 'label' attribute. It should be of type 'string'.`);
          newEnum.label = enumerator.label;
        }

        this.enumerators.push(newEnum);
      });
    }
  }
}

/**
 * A Typescript class representation of an ECEnumerator.
 */
export class Enumerator implements EnumeratorProps {
  public enumeration: Enumeration;

  constructor(public value: number | string, public label?: string) { }

  get isInt() { return this.enumeration.primitiveType === PrimitiveType.Integer; }
  get isString() { return this.enumeration.primitiveType === PrimitiveType.String; }
}
