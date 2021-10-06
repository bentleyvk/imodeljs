/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Logging
 */

/** Logger categories used by this package
 * @note All logger categories in this package start with the `backend-itwin-client` prefix.
 * @see [Logger]($bentley)
 * @public
 */
export enum BackendITwinClientLoggerCategory {
  /** The logger category used for Authorization */
  Authorization = "backend-itwin-client.Authorization",

  /** The logger category used for Introspection */
  Introspection = "backend-itwin-client.Introspection",

  /** The logger category used for Telemetry */
  Telemetry = "backend-itwin-client.Telemetry",
}
