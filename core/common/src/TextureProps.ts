/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Entities
 */

import { Id64String } from "@itwin/core-bentley";
import { DefinitionElementProps } from "./ElementProps";
import { ImageSourceFormat } from "./Image";
import { Base64EncodedString } from "./Base64EncodedString";

/** Properties that define a [Texture]($backend) element.
 * @public
 */
export interface TextureProps extends DefinitionElementProps {
  /** Format of the image data. */
  format: ImageSourceFormat;
  /** The image data stored in a Base64-encoded string according to the specified format.
   * @see [[Base64EncodedString.fromUint8Array]] to produce a well-formed base-64-encoded string.
   * @see [[Base64EncodedString.toUint8Array]] to decode the bytes.
   */
  data: Base64EncodedString;
  /** An optional description of the texture. */
  description?: string;
}

/** Properties that specify what texture should be loaded and how it should be loaded.
 * @public
 */
export interface TextureLoadProps {
  /** A valid Id64 string identifying the texture */
  name: Id64String;
  /** Maximum texture size supported by the client. If specified, the texture will be downsampled so both of its dimensions adhere to this size. */
  maxTextureSize?: number;
}

/** Information about [Texture]($backend) data returned by [[IModelReadRpcInterface.queryTextureData]].
 * @public
 */
export interface TextureData {
  /** The width of the image, possibly reduced from the original width based on [[TextureLoadProps.maxTextureSize]]. */
  width: number;
  /** The height of the image, possibly reduced from the original height based on [[TextureLoadProps.maxTextureSize]]. */
  height: number;
  /** The format of the returned data, Jpeg or Png. */
  format: ImageSourceFormat;
  /** returned byte data */
  bytes: Uint8Array;
}
