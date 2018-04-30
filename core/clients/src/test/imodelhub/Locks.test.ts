/*---------------------------------------------------------------------------------------------
|  $Copyright: (c) 2018 Bentley Systems, Incorporated. All rights reserved. $
 *--------------------------------------------------------------------------------------------*/
import * as chai from "chai";

import { TestConfig } from "../TestConfig";

import { Lock } from "../../imodelhub";
import { IModelHubClient } from "../../imodelhub/Client";
import { AccessToken } from "../../Token";
import { ResponseBuilder, RequestType, ScopeType } from "../ResponseBuilder";
import { AzureFileHandler } from "../../imodelhub/AzureFileHandler";
import * as utils from "./TestUtils";

chai.should();

describe("iModelHubClient LockHandler", () => {
  let accessToken: AccessToken;
  let iModelId: string;
  const imodelHubClient: IModelHubClient = new IModelHubClient(TestConfig.deploymentEnv, new AzureFileHandler());
  const responseBuilder: ResponseBuilder = new ResponseBuilder();

  before(async () => {
    accessToken = await utils.login();
    iModelId = await utils.getIModelId(accessToken);
  });

  afterEach(() => {
    responseBuilder.clearMocks();
  });

  it("should get information on Locks", async function(this: Mocha.ITestCallbackContext) {
    if (!TestConfig.enableMocks)
      this.skip();

    const requestPath = responseBuilder.createRequestUrl(ScopeType.iModel, iModelId, "Lock");
    const requestResponse = responseBuilder.generateGetResponse<Lock>(responseBuilder.generateObject<Lock>(Lock));
    responseBuilder.MockResponse(RequestType.Get, requestPath, requestResponse);

    // Needs to acquire before expecting more than 0.
    const locks: Lock[] = await imodelHubClient.Locks().get(accessToken, iModelId);
    chai.expect(locks.length).to.be.greaterThan(0);
  });
});
