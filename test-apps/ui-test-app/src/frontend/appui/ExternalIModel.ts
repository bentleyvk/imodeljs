/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { Id64String, Logger } from "@bentley/bentleyjs-core";
import { ITwin, ITwinAccessClient, ITwinSearchableProperty } from "@bentley/context-registry-client";
import { IModelHubFrontend } from "@bentley/imodelhub-client";
import { AuthorizedFrontendRequestContext, CheckpointConnection, IModelConnection } from "@bentley/imodeljs-frontend";
import { SampleAppIModelApp } from "../";

/* eslint-disable deprecation/deprecation */

export interface IModelInfo {
  id: string;
  iTwinId: string;
  name: string;
  createdDate: Date;
}

/** Opens External IModel */
export class ExternalIModel {
  public viewId: Id64String | undefined;
  public iModelConnection: IModelConnection | undefined;

  constructor(public projectName: string, public imodelName: string) {
  }

  /** Open IModelConnection and get ViewId */
  public async openIModel(): Promise<void> {
    const info = await this.getIModelInfo();

    if (info.projectId && info.imodelId) {
      // open the imodel
      Logger.logInfo(SampleAppIModelApp.loggerCategory(this),
        `openIModel (external): projectId=${info.projectId}&iModelId=${info.imodelId} mode=${SampleAppIModelApp.allowWrite ? "ReadWrite" : "Readonly"}`);

      this.iModelConnection = await CheckpointConnection.openRemote(info.projectId, info.imodelId);
      this.viewId = await this.onIModelSelected(this.iModelConnection);
    }
  }

  /** Finds project and imodel ids using their names */
  private async getIModelInfo(): Promise<{ projectId: string, imodelId: string }> {
    const projectName = this.projectName;
    const iModelName = this.imodelName;

    const requestContext: AuthorizedFrontendRequestContext = await AuthorizedFrontendRequestContext.create();

    const connectClient = new ITwinAccessClient();
    const iTwinList: ITwin[] = await connectClient.getAll(requestContext, {
      search: {
        searchString: projectName,
        propertyName: ITwinSearchableProperty.Name,
        exactMatch: true,
      },
    });

    if (iTwinList.length === 0)
      throw new Error(`ITwin ${projectName} was not found for the user.`);
    else if (iTwinList.length > 1)
      throw new Error(`Multiple iTwins named ${projectName} were found for the user.`);

    const hubClient = new IModelHubFrontend();
    const iModelId = await hubClient.queryIModelByName({
      iModelName,
      iTwinId: iTwinList[0].id,
      requestContext,
    });
    if (undefined === iModelId) {
      throw new Error(`iModel with name "${iModelName}" does not exist in project "${projectName}"`);
    }
    return { projectId: iTwinList[0].id, imodelId: iModelId };
  }

  /** Handle iModel open event */
  private async onIModelSelected(imodel: IModelConnection | undefined): Promise<Id64String | undefined> {

    let viewDefinitionId: Id64String | undefined;

    try {
      // attempt to get a view definition
      viewDefinitionId = imodel ? await this.getFirstViewDefinitionId(imodel) : undefined;
    } catch (e) {
      if (imodel)
        await imodel.close();
    }

    return viewDefinitionId;
  }

  /** Pick the first available spatial view definition in the imodel */
  private async getFirstViewDefinitionId(imodel: IModelConnection): Promise<Id64String> {
    const viewSpecs = await imodel.views.queryProps({});
    const acceptedViewClasses = [
      "BisCore:SpatialViewDefinition",
      "BisCore:DrawingViewDefinition",
    ];
    const acceptedViewSpecs = viewSpecs.filter((spec) => (-1 !== acceptedViewClasses.indexOf(spec.classFullName)));
    if (0 === acceptedViewSpecs.length) {
      throw new Error("No valid view definitions in imodel");
    }

    // Prefer spatial view over drawing.
    const spatialViews = acceptedViewSpecs.filter((v) => {
      return v.classFullName === "BisCore:SpatialViewDefinition";
    });

    if (spatialViews.length > 0)
      return spatialViews[0].id!;

    return acceptedViewSpecs[0].id!;
  }
}
