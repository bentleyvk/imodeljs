/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
// import { assert } from "chai";
// import * as grpc from "@grpc/grpc-js";
import { createClient, getServerAddress } from "../Converter/Launch";
import { ReaderClient } from "../generated/reader_grpc_pb";
import { ShutdownRequest, ShutdownResponse, TestRequest, TestResponse } from "../generated/reader_pb";
import { startMockReader } from "./MockReader";

async function doServerStreamingCall(client: ReaderClient): Promise<void> {
  const clientMessage = new TestRequest();
  clientMessage.setTestMessage("Message from client");
  const stream = client.sww(clientMessage);
  let i = 0;
  return new Promise((resolve, reject) => {
    stream.on("data", (response: TestResponse) => {
      ++i;
      if (response.getTestResponse() === "<done>") {
        // eslint-disable-next-line no-console
        console.log(`(client) got ${i} responses`);
      }
    });
    stream.on("error", (err: Error) => {
      reject(err);
    });
    stream.on("end", () => {
      // eslint-disable-next-line no-console
      console.log(`(client) stream has ended`);
      resolve();
    });
  });
}

async function doShutdownCall(client: ReaderClient): Promise<ShutdownResponse> {
  const shutdownRequest = new ShutdownRequest();
  shutdownRequest.setOptions("");
  return new Promise((resolve, reject) => {
    client.shutdown(shutdownRequest, (err, response) => {
      if (err)
        reject(err);
      resolve(response);
    });
  });
}

describe("test1", async () => {
  it("test1", async () => {
    // const rpcServerAddress = await getServerAddress();
    // await startMockReader(rpcServerAddress);
    const rpcServerAddress = "[::]:50051";
    const client = await createClient(rpcServerAddress);

    await doServerStreamingCall(client);

    await doShutdownCall(client);
  });
});

