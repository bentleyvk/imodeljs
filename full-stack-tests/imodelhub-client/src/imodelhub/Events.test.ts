/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as chai from "chai";
import { AccessToken, Guid, GuidString, Id64, IModelHubStatus } from "@itwin/core-bentley";
import {
  AllCodesDeletedEvent, AllLocksDeletedEvent, BriefcaseDeletedEvent, ChangeSetPostPushEvent, ChangeSetPrePushEvent, CheckpointCreatedEvent, CheckpointV2CreatedEvent, CodeEvent, EventSAS,
  EventSubscription, EventType, IModelClient, IModelDeletedEvent, IModelHubEvent, IModelHubEventType, LockEvent, LockLevel, LockType, VersionEvent,
} from "@bentley/imodelhub-client";
import { TestUsers } from "@itwin/oidc-signin-tool";
import { RequestType, ResponseBuilder, ScopeType } from "../ResponseBuilder";
import { TestConfig } from "../TestConfig";
import * as utils from "./TestUtils";

/* eslint-disable deprecation/deprecation */

chai.should();

function mockCreateEventSubscription(imodelId: GuidString, eventTypes: EventType[]) {
  if (!TestConfig.enableMocks)
    return;

  const requestPath = utils.createRequestUrl(ScopeType.iModel, imodelId, "EventSubscription");
  const requestResponse = ResponseBuilder.generatePostResponse<EventSubscription>(ResponseBuilder.generateObject<EventSubscription>(EventSubscription,
    new Map<string, any>([
      ["wsgId", Guid.createValue()],
      ["eventTypes", eventTypes],
    ])));
  const postBody = ResponseBuilder.generatePostBody<EventSubscription>(ResponseBuilder.generateObject<EventSubscription>(EventSubscription,
    new Map<string, any>([
      ["eventTypes", eventTypes],
    ])));
  ResponseBuilder.mockResponse(utils.IModelHubUrlMock.getUrl(), RequestType.Post, requestPath, requestResponse, 1, postBody);
}

function mockUpdateEventSubscription(imodelId: GuidString, subscriptionId: string, eventTypes: EventType[]) {
  if (!TestConfig.enableMocks)
    return;

  const requestPath = utils.createRequestUrl(ScopeType.iModel, imodelId, "EventSubscription", subscriptionId);
  const requestResponse = ResponseBuilder.generatePostResponse<EventSubscription>(ResponseBuilder.generateObject<EventSubscription>(EventSubscription,
    new Map<string, any>([
      ["wsgId", subscriptionId],
      ["eventTypes", eventTypes],
    ])));
  const postBody = ResponseBuilder.generatePostBody<EventSubscription>(ResponseBuilder.generateObject<EventSubscription>(EventSubscription,
    new Map<string, any>([
      ["wsgId", subscriptionId],
      ["eventTypes", eventTypes],
    ])));
  ResponseBuilder.mockResponse(utils.IModelHubUrlMock.getUrl(), RequestType.Post, requestPath, requestResponse, 1, postBody);
}

function mockGetEventSASToken(imodelId: GuidString) {
  if (!TestConfig.enableMocks)
    return;

  const requestPath = utils.createRequestUrl(ScopeType.iModel, imodelId, "EventSAS");
  const responseObject = ResponseBuilder.generateObject<EventSAS>(EventSAS,
    new Map<string, any>([
      ["sasToken", Guid.createValue()],
      ["baseAddress", `${utils.IModelHubUrlMock.getUrl()}/sv1.1/Repositories/iModel--${imodelId}/iModelScope`],
    ]));
  const requestResponse = ResponseBuilder.generatePostResponse<EventSAS>(responseObject);
  const postBody = ResponseBuilder.generatePostBody<EventSAS>(ResponseBuilder.generateObject<EventSAS>(EventSAS));
  ResponseBuilder.mockResponse(utils.IModelHubUrlMock.getUrl(), RequestType.Post, requestPath, requestResponse, 1, postBody);
}

function mockGetEvent(imodelId: GuidString, subscriptionId: string, eventBody: object | (() => object), eventType?: string, timeout?: number, statusCode = 200, delay = 0) {
  if (!TestConfig.enableMocks)
    return;

  const headers = eventType ? { "content-type": eventType } : {};
  let query = `${subscriptionId}/messages/head`;
  if (timeout)
    query += `?timeout=${timeout}`;
  const requestPath = utils.createRequestUrl(ScopeType.iModel, imodelId, "Subscriptions", query);
  ResponseBuilder.mockResponse(utils.IModelHubUrlMock.getUrl(), RequestType.Delete, requestPath, eventBody, 1, {}, headers, statusCode, delay);
}

function mockDeleteEventSubscription(imodelId: GuidString, subscriptionId: string) {
  if (!TestConfig.enableMocks)
    return;

  const requestPath = utils.createRequestUrl(ScopeType.iModel, imodelId, "EventSubscription", subscriptionId);
  ResponseBuilder.mockResponse(utils.IModelHubUrlMock.getUrl(), RequestType.Delete, requestPath);
}

describe("iModelHub EventHandler", () => {
  let iTwinId: string;
  let imodelId: GuidString;
  let subscription: EventSubscription;
  let briefcaseId: number;
  let sasToken: EventSAS;
  let imodelHubClient: IModelClient;
  let accessToken: AccessToken;

  before(async function () {
    this.timeout(0);
    accessToken = TestConfig.enableMocks ? "" : await utils.login(TestUsers.super);

    iTwinId = await utils.getITwinId(accessToken);
    await utils.createIModel(accessToken, utils.sharedimodelName, iTwinId);
    imodelId = await utils.getIModelId(accessToken, utils.sharedimodelName, iTwinId);
    imodelHubClient = utils.getDefaultClient();
    briefcaseId = (await utils.getBriefcases(accessToken, imodelId, 1))[0].briefcaseId!;
  });

  after(async () => {
    if (TestConfig.enableIModelBank) {
      await utils.deleteIModelByName(accessToken, iTwinId, utils.sharedimodelName);
    }
  });

  afterEach(() => {
    ResponseBuilder.clearMocks();
  });

  it("should subscribe to event subscription", async () => {
    const eventTypes: EventType[] = ["CodeEvent"];
    mockCreateEventSubscription(imodelId, eventTypes);

    subscription = await imodelHubClient.events.subscriptions.create(accessToken, imodelId, eventTypes);
    chai.assert(subscription);
    chai.expect(subscription.eventTypes).to.be.deep.equal(eventTypes);
  });

  it("should fail getting SAS token with invalid accessToken (#integration)", async () => {
    let error;
    try {
      await imodelHubClient.events.getSASToken("bad", imodelId);
    } catch (err: any) {
      error = err;
    }
    chai.assert(error);
    chai.expect(error.status).to.be.equal(401);
  });

  it("should get SAS token", async () => {
    mockGetEventSASToken(imodelId);
    sasToken = await imodelHubClient.events.getSASToken(accessToken, imodelId);
    chai.assert(sasToken);
  });

  it("should fail receiving event with invalid SAS token", async () => {
    mockGetEvent(imodelId, subscription.wsgId, {}, undefined, undefined, 401);
    let error;
    try {
      await imodelHubClient.events.getEvent("InvalidSASToken", sasToken.baseAddress!, subscription.wsgId);
    } catch (err: any) {
      error = err;
    }
    chai.assert(error);
    chai.expect(error.status).to.be.equal(401);
  });

  it("should fail receiving event with undefined subscription id", async () => {
    mockGetEvent(imodelId, "", {}, undefined, undefined, 404);
    let error;
    try {
      await imodelHubClient.events.getEvent(sasToken.sasToken!, sasToken.baseAddress!, "");
    } catch (err: any) {
      error = err;
    }
    chai.assert(error);
    chai.expect(error.errorNumber!).to.be.equal(IModelHubStatus.UndefinedArgumentError);
  });

  it("should return undefined when no event is available", async () => {
    mockGetEvent(imodelId, subscription.wsgId, {}, undefined, undefined, 204);
    const result = await imodelHubClient.events.getEvent(sasToken.sasToken!, sasToken.baseAddress!, subscription.wsgId);
    chai.expect(result).to.be.equal(undefined);
  });

  it("should return undefined when timeout is set", async () => {
    const timeout = !TestConfig.enableMocks ? 10 : 1;

    mockGetEvent(imodelId, subscription.wsgId, {}, undefined, 1, 204, 1);
    const result = await imodelHubClient.events.getEvent(sasToken.sasToken!, sasToken.baseAddress!, subscription.wsgId, timeout);
    chai.expect(result).to.be.equal(undefined);
  });

  it("should timeout if response wasn't returned in time (#unit)", async () => {
    mockGetEvent(imodelId, subscription.wsgId, {}, undefined, 1, 204, 20000);
    let error;
    try {
      await imodelHubClient.events.getEvent(sasToken.sasToken!, sasToken.baseAddress!, subscription.wsgId, 1);
    } catch (err: any) {
      error = err;
    }
    chai.assert(error);
    chai.expect(error.message).to.be.equal("Timeout of 1500ms exceeded");
  });

  it("should receive code event", async () => {
    const codes = [utils.randomCode(briefcaseId)];
    if (!TestConfig.enableMocks) {
      await imodelHubClient.codes.update(accessToken, imodelId, codes);
    } else {
      const requestResponse = `{"EventTopic":"${imodelId}","FromEventSubscriptionId":"${Guid.createValue()}","ToEventSubscriptionId":"","BriefcaseId":1,"CodeScope":"0x100000000ff","CodeSpecId":"0xff","State":1,"Values":["TestCode"]}`;
      mockGetEvent(imodelId, subscription.wsgId, JSON.parse(requestResponse), "CodeEvent");
    }

    const event = await imodelHubClient.events.getEvent(sasToken.sasToken!, sasToken.baseAddress!, subscription.wsgId);

    chai.expect(event).to.be.instanceof(CodeEvent);
    chai.expect(event!.iModelId!).to.be.equal(imodelId);
    const typedEvent = event as CodeEvent;
    chai.assert(typedEvent);
    chai.expect(typeof typedEvent.codeSpecId).to.equal("string");
  });

  it("should receive events through listener", async () => {
    const codes = [utils.randomCode(briefcaseId), utils.randomCode(briefcaseId)];

    if (TestConfig.enableMocks) {
      mockGetEventSASToken(imodelId);
      const requestResponse = JSON.parse(`{"EventTopic":"${imodelId}","FromEventSubscriptionId":"${Guid.createValue()}","ToEventSubscriptionId":"","BriefcaseId":1,"CodeScope":"0x100000000ff","CodeSpecId":"0xff","State":1,"Values":["TestCode"]}`);
      mockGetEvent(imodelId, subscription.wsgId, requestResponse, "CodeEvent", 60);
      mockGetEvent(imodelId, subscription.wsgId, requestResponse, "CodeEvent", 60);
      mockGetEvent(imodelId, subscription.wsgId, {}, undefined, 60, 204, 2000);
    }

    let receivedEventsCount = 0;
    const deleteListener = imodelHubClient.events.createListener(async () => {
      return TestConfig.enableMocks ? "" : (await utils.login(TestUsers.super) ?? "");
    }, subscription.wsgId, imodelId, (receivedEvent: IModelHubEvent) => {
      if (receivedEvent instanceof CodeEvent)
        receivedEventsCount++;
    });

    if (!TestConfig.enableMocks) {
      await imodelHubClient.codes.update(accessToken, imodelId, [codes[0]]);
      await imodelHubClient.codes.update(accessToken, imodelId, [codes[1]]);
    }

    let timeoutCounter = 0;
    for (; timeoutCounter < 100; ++timeoutCounter) {
      if (receivedEventsCount === 2)
        break;
      await new Promise((resolve) => setTimeout(resolve, TestConfig.enableMocks ? 1 : 100));
    }
    deleteListener();
    chai.expect(timeoutCounter).to.be.lessThan(100);
  });

  it("should update event subscription", async () => {
    const eventTypes: EventType[] = ["iModelDeletedEvent", "BriefcaseDeletedEvent"];
    mockUpdateEventSubscription(imodelId, subscription.wsgId, eventTypes);
    subscription.eventTypes = eventTypes as IModelHubEventType[];

    subscription = await imodelHubClient.events.subscriptions.update(accessToken, imodelId, subscription);
    chai.assert(subscription);
    chai.expect(subscription.eventTypes).to.be.deep.equal(eventTypes);
  });

  it("should receive LockEvent", async () => {
    const lock = utils.generateLock(briefcaseId, "0x115", LockType.Element, LockLevel.Shared);

    if (TestConfig.enableMocks) {
      const eventBody = `{"EventTopic":"${imodelId}","FromEventSubscriptionId":"${Guid.createValue()}","ToEventSubscriptionId":"","BriefcaseId":2,"LockType":"Element","LockLevel":"Shared","ObjectIds":["0x115"],"ReleasedWithChangeSet":"1"}`;
      mockGetEvent(imodelId, subscription.wsgId, JSON.parse(eventBody), "LockEvent");
    } else {
      await imodelHubClient.events.subscriptions.delete(accessToken, imodelId, subscription.wsgId);
      const eventTypes: EventType[] = ["LockEvent"];
      subscription = await imodelHubClient.events.subscriptions.create(accessToken, imodelId, eventTypes);
      chai.assert(subscription);
      chai.expect(subscription.eventTypes).to.be.deep.equal(eventTypes);

      await imodelHubClient.locks.update(accessToken, imodelId, [lock]);
    }

    const event = await imodelHubClient.events.getEvent(sasToken.sasToken!, sasToken.baseAddress!, subscription.wsgId);
    chai.expect(event).to.be.instanceof(LockEvent);
    chai.assert(!!event!.iModelId);
    const typedEvent = event as LockEvent;
    chai.assert(!!typedEvent);
    chai.assert(!!typedEvent.objectIds[0]);
    chai.assert(Id64.isValidId64(typedEvent.objectIds[0]));
    chai.expect(typedEvent.objectIds[0].toString()).to.be.equal(Id64.fromString("0x115"));
    chai.expect(typedEvent.lockLevel).to.be.equal(LockLevel.Shared);
    chai.expect(typedEvent.lockType).to.be.equal(LockType.Element);
  });

  it("should receive AllLocksDeletedEvent (#unit)", async () => {
    const eventBody = `{"EventTopic":"${imodelId}","FromEventSubscriptionId":"${Guid.createValue()}","ToEventSubscriptionId":"","BriefcaseId":2}`;
    mockGetEvent(imodelId, subscription.wsgId, JSON.parse(eventBody), "AllLocksDeletedEvent");

    const event = await imodelHubClient.events.getEvent(sasToken.sasToken!, sasToken.baseAddress!, subscription.wsgId);
    chai.expect(event).to.be.instanceof(AllLocksDeletedEvent);
    chai.assert(!!event!.iModelId);
  });

  it("should receive ChangeSetPostPushEvent (#unit)", async () => {
    const eventBody = `{"EventTopic":"${imodelId}","FromEventSubscriptionId":"${Guid.createValue()}","ToEventSubscriptionId":"","BriefcaseId":2,"ChangeSetId":"789","ChangeSetIndex":2}`;
    mockGetEvent(imodelId, subscription.wsgId, JSON.parse(eventBody), "ChangeSetPostPushEvent");

    const event = await imodelHubClient.events.getEvent(sasToken.sasToken!, sasToken.baseAddress!, subscription.wsgId);
    chai.expect(event).to.be.instanceof(ChangeSetPostPushEvent);
    chai.assert(!!event!.iModelId);
  });

  it("should receive ChangeSetPrePushEvent (#unit)", async () => {
    const eventBody = `{"EventTopic":"${imodelId}","FromEventSubscriptionId":"${Guid.createValue()}","ToEventSubscriptionId":""}`;
    mockGetEvent(imodelId, subscription.wsgId, JSON.parse(eventBody), "ChangeSetPrePushEvent");

    const event = await imodelHubClient.events.getEvent(sasToken.sasToken!, sasToken.baseAddress!, subscription.wsgId);
    chai.expect(event).to.be.instanceof(ChangeSetPrePushEvent);
    chai.assert(!!event!.iModelId);
  });

  it("should receive AllCodesDeletedEvent (#unit)", async () => {
    const eventBody = `{"EventTopic":"${imodelId}","FromEventSubscriptionId":"${Guid.createValue()}","ToEventSubscriptionId":"","BriefcaseId":2}`;
    mockGetEvent(imodelId, subscription.wsgId, JSON.parse(eventBody), "AllCodesDeletedEvent");

    const event = await imodelHubClient.events.getEvent(sasToken.sasToken!, sasToken.baseAddress!, subscription.wsgId);
    chai.expect(event).to.be.instanceof(AllCodesDeletedEvent);
    chai.assert(!!event!.iModelId);
  });

  it("should receive BriefcaseDeletedEvent (#unit)", async () => {
    const eventBody = `{"EventTopic":"${imodelId}","FromEventSubscriptionId":"${Guid.createValue()}","ToEventSubscriptionId":"","BriefcaseId":2}`;
    mockGetEvent(imodelId, subscription.wsgId, JSON.parse(eventBody), "BriefcaseDeletedEvent");

    const event = await imodelHubClient.events.getEvent(sasToken.sasToken!, sasToken.baseAddress!, subscription.wsgId);
    chai.expect(event).to.be.instanceof(BriefcaseDeletedEvent);
    chai.assert(!!event!.iModelId);
  });

  it("should receive IModelDeletedEvent (#unit)", async () => {
    const eventBody = `{"EventTopic":"${imodelId}","FromEventSubscriptionId":"${Guid.createValue()}","ToEventSubscriptionId":""}`;
    mockGetEvent(imodelId, subscription.wsgId, JSON.parse(eventBody), "iModelDeletedEvent");

    const event = await imodelHubClient.events.getEvent(sasToken.sasToken!, sasToken.baseAddress!, subscription.wsgId);
    chai.expect(event).to.be.instanceof(IModelDeletedEvent);
    chai.assert(!!event!.iModelId);
  });

  it("should receive VersionEvent (#unit)", async () => {
    const versionId: GuidString = Guid.createValue();
    const eventBody = `{"EventTopic":"${imodelId}","FromEventSubscriptionId":"${Guid.createValue()}","ToEventSubscriptionId":"","VersionId":"${versionId}","VersionName":"ABC","ChangeSetId":"2"}`;
    mockGetEvent(imodelId, subscription.wsgId, JSON.parse(eventBody), "VersionEvent");

    const event = await imodelHubClient.events.getEvent(sasToken.sasToken!, sasToken.baseAddress!, subscription.wsgId);
    chai.expect(event).to.be.instanceof(VersionEvent);
    chai.assert(!!event!.iModelId);
    const typedEvent = event as VersionEvent;
    chai.assert(!!typedEvent);
    chai.expect(typedEvent.versionId).to.be.equal(versionId);
  });

  it("should receive baseline VersionEvent (#unit)", async () => {
    const versionId: GuidString = Guid.createValue();
    const eventBody = `{"EventTopic":"${imodelId}","FromEventSubscriptionId":"${Guid.createValue()}","ToEventSubscriptionId":"","VersionId":"${versionId}","VersionName":"ABC","ChangeSetId":""}`;
    mockGetEvent(imodelId, subscription.wsgId, JSON.parse(eventBody), "VersionEvent");

    const event = await imodelHubClient.events.getEvent(sasToken.sasToken!, sasToken.baseAddress!, subscription.wsgId);
    chai.expect(event).to.be.instanceof(VersionEvent);
    chai.assert(!!event!.iModelId);
    const typedEvent = event as VersionEvent;
    chai.assert(!!typedEvent);
    chai.expect(typedEvent.versionId).to.be.equal(versionId);
    chai.expect(typedEvent.changeSetId).to.be.eq("");
  });

  it("should receive CheckpointCreatedEvent (#unit)", async () => {
    const versionId: GuidString = Guid.createValue();
    const changeSetId: string = "changeSetId";
    const changeSetIndex: string = "5";
    const eventBody = `{"EventTopic":"${imodelId}","FromEventSubscriptionId":"${Guid.createValue()}","ToEventSubscriptionId":"","VersionId":"${versionId}","ChangeSetId":"${changeSetId}","ChangeSetIndex":"${changeSetIndex}"}`;
    mockGetEvent(imodelId, subscription.wsgId, JSON.parse(eventBody), "CheckpointCreatedEvent");

    const event = await imodelHubClient.events.getEvent(sasToken.sasToken!, sasToken.baseAddress!, subscription.wsgId);
    chai.expect(event).to.be.instanceof(CheckpointCreatedEvent);
    chai.assert(!!event!.iModelId);
    const typedEvent = event as CheckpointCreatedEvent;
    chai.assert(!!typedEvent);
    chai.expect(typedEvent.versionId).to.be.equal(versionId);
    chai.expect(typedEvent.changeSetId).to.be.eq(changeSetId);
    chai.expect(typedEvent.changeSetIndex).to.be.eq(changeSetIndex);
  });

  it("should receive CheckpointCreatedEvent with no Version (#unit)", async () => {
    const changeSetId: string = "changeSetId";
    const changeSetIndex: string = "5";
    const eventBody = `{"EventTopic":"${imodelId}","FromEventSubscriptionId":"${Guid.createValue()}","ToEventSubscriptionId":"","ChangeSetId":"${changeSetId}","ChangeSetIndex":"${changeSetIndex}"}`;
    mockGetEvent(imodelId, subscription.wsgId, JSON.parse(eventBody), "CheckpointCreatedEvent");

    const event = await imodelHubClient.events.getEvent(sasToken.sasToken!, sasToken.baseAddress!, subscription.wsgId);
    chai.expect(event).to.be.instanceof(CheckpointCreatedEvent);
    chai.assert(!!event!.iModelId);
    const typedEvent = event as CheckpointCreatedEvent;
    chai.assert(!!typedEvent);
    chai.expect(!typedEvent.versionId);
    chai.expect(typedEvent.changeSetId).to.be.eq(changeSetId);
    chai.expect(typedEvent.changeSetIndex).to.be.eq(changeSetIndex);
  });

  it("should receive CheckpointV2CreatedEvent (#unit)", async () => {
    const versionId: GuidString = Guid.createValue();
    const changeSetId: string = "changeSetId";
    const changeSetIndex: string = "5";
    const eventBody = `{"EventTopic":"${imodelId}","FromEventSubscriptionId":"${Guid.createValue()}","ToEventSubscriptionId":"","VersionId":"${versionId}","ChangeSetId":"${changeSetId}","ChangeSetIndex":"${changeSetIndex}"}`;
    mockGetEvent(imodelId, subscription.wsgId, JSON.parse(eventBody), "CheckpointV2CreatedEvent");

    const event = await imodelHubClient.events.getEvent(sasToken.sasToken!, sasToken.baseAddress!, subscription.wsgId);
    chai.expect(event).to.be.instanceof(CheckpointV2CreatedEvent);
    chai.assert(!!event!.iModelId);
    const typedEvent = event as CheckpointV2CreatedEvent;
    chai.assert(!!typedEvent);
    chai.expect(typedEvent.versionId).to.be.equal(versionId);
    chai.expect(typedEvent.changeSetId).to.be.eq(changeSetId);
    chai.expect(typedEvent.changeSetIndex).to.be.eq(changeSetIndex);
  });

  it("should delete subscription", async () => {
    mockDeleteEventSubscription(imodelId, subscription.wsgId);
    await imodelHubClient.events.subscriptions.delete(accessToken, imodelId, subscription.wsgId);
  });
});
