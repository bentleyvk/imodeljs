/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import * as chai from "chai";
import { Client, Issuer } from "openid-client";
import * as path from "path";
import { AgentAuthorizationClient, AgentAuthorizationClientConfiguration } from "../oidc/AgentAuthorizationClient";

import * as fs from "fs";

/** Loads the provided `.env` file into process.env */
function loadEnv(envFile: string) {
  if (!fs.existsSync(envFile))
    return;

  const dotenv = require("dotenv"); // eslint-disable-line @typescript-eslint/no-var-requires
  const dotenvExpand = require("dotenv-expand"); // eslint-disable-line @typescript-eslint/no-var-requires
  const envResult = dotenv.config({ path: envFile });
  if (envResult.error) {
    throw envResult.error;
  }

  dotenvExpand(envResult);
}

loadEnv(path.join(__dirname, "..", "..", ".env"));

chai.should();

describe("AgentAuthorizationClient (#integration)", () => {

  let agentConfiguration: AgentAuthorizationClientConfiguration;

  before(async () => {
    if (process.env.IMJS_AGENT_TEST_CLIENT_ID === undefined)
      throw new Error("Could not find IMJS_AGENT_TEST_CLIENT_ID");
    if (process.env.IMJS_AGENT_TEST_CLIENT_SECRET === undefined)
      throw new Error("Could not find IMJS_AGENT_TEST_CLIENT_SECRET");
    if (process.env.IMJS_AGENT_TEST_CLIENT_SCOPES === undefined)
      throw new Error("Could not find IMJS_AGENT_TEST_CLIENT_SCOPES");

    agentConfiguration = {
      clientId: process.env.IMJS_AGENT_TEST_CLIENT_ID ?? "",
      clientSecret: process.env.IMJS_AGENT_TEST_CLIENT_SECRET ?? "",
      scope: process.env.IMJS_AGENT_TEST_CLIENT_SCOPES ?? "",
    };

  });

  it("should discover token end points correctly", async () => {
    const client = new AgentAuthorizationClient(agentConfiguration);
    const url: string = await client.getUrl();

    const issuer: Issuer<Client> = await client.discoverEndpoints();
    chai.expect(issuer.token_endpoint).equals(`${url}/connect/token`);
    chai.expect(issuer.authorization_endpoint).equals(`${url}/connect/authorize`);
    chai.expect(issuer.introspection_endpoint).equals(`${url}/connect/introspect`);
  });

});
