/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { assert, BeEvent } from "@bentley/bentleyjs-core";
import { request } from "@bentley/itwin-client";
import { MapLayerTokenEndpoint} from "../internal";
import { FrontendRequestContext } from "../../imodeljs-frontend";
import { ArcGisTokenManager } from "./ArcGisTokenManager";

export enum EsriOAuth2EndpointType {Authorize,Token}
export class EsriOAuth2Endpoint implements MapLayerTokenEndpoint {
  private _url: string;
  private _isArcgisOnline: boolean;
  constructor(url: string, isArcgisOnline: boolean) {
    this._url = url;
    this._isArcgisOnline = isArcgisOnline;
  }

  public getTokenGenerationUrl(stateData?: string) {
    const urlObj = new URL(this._url);

    // Set the client id
    if (this._isArcgisOnline) {
      urlObj.searchParams.set("client_id", EsriOAuth2.arcGisOnlineClientId);
    } else {
      const appId = EsriOAuth2.getMatchingEnterpriseAppId(this._url);
      assert(appId !== undefined);
      if (undefined !== appId) {
        urlObj.searchParams.set("client_id", appId);
      }
    }

    urlObj.searchParams.set("response_type", "token");
    if (EsriOAuth2.expiration !== undefined) {
      urlObj.searchParams.set("expiration", `${EsriOAuth2.expiration}`);
    }

    urlObj.searchParams.set("redirect_uri", EsriOAuth2.redirectUri);

    if (stateData !== undefined)
      urlObj.searchParams.set("state", stateData);

    return urlObj.toString();
  }

  public get isArcgisOnline() {return this._isArcgisOnline;}

}

export class EsriOAuth2 {
  public static readonly  onEsriOAuth2Callback = new BeEvent();
  private static _redirectUri: string;
  private static _expiration: number|undefined;
  private static _arcGisOnlineClientId: string;
  private static _arcGisEnterpriseClientIds: {serviceBaseUrl: string, appId: string}[];

  /** Initialize ESRI OAuth2
   * @param redirectUri URI where the user is going redirected with the token
   * @param arcGisOnlineClientId Application ID that should be used to access ArcGIS Online
   * @param arcgisEnterpriseClientIds A dictionary of Application ID for each ArcGIS Enterprise service that Oauth2 should be supported
   * @param tokenExpiration Optional expiration after which the token will expire. Defined in minutes with a maximum of two weeks (20160 minutes).
   * @returns true if the initialized was successful otherwise false.
   */
  public static initialize(redirectUri: string, arcGisOnlineClientId?: string, arcGisEnterpriseClientIds?: {serviceBaseUrl: string, appId: string}[], tokenExpiration?: number): boolean {
    EsriOAuth2._redirectUri = redirectUri;
    if (arcGisEnterpriseClientIds)
      EsriOAuth2._arcGisEnterpriseClientIds = arcGisEnterpriseClientIds;

    // arcGisOnlineClientId is actually mandatory might become optional in the future.
    if (arcGisOnlineClientId === undefined) {
      return false;
    }
    EsriOAuth2._arcGisOnlineClientId = arcGisOnlineClientId;
    EsriOAuth2._expiration = tokenExpiration;

    // Define a global callback function that will be used by the redirect URL to pass the generated token
    (window as any).esriOAuth2Callback = (success: boolean, token?: string, expires?: number, userName?: string, ssl?: boolean, state?: string) => {
      let decodedState;
      let eventSuccess = success;
      if (success) {
        if ( token !== undefined && expires !== undefined && userName !== undefined && ssl !== undefined && state !== undefined) {
          decodedState = decodeURIComponent(state);
          ArcGisTokenManager.setOAuth2Token(decodedState, {token, expires, ssl, userName});
          console.log(`oauthCallback: token=${token} expires=${expires} userName=${userName} ssl=${ssl} state=${decodedState}`);
        } else {
          console.log(`Success but missing mandatory params`);
          eventSuccess = false;
        }
      }
      this.onEsriOAuth2Callback.raiseEvent(eventSuccess, decodedState);
    };

    return true;
  }

  public static get redirectUri() {
    return EsriOAuth2._redirectUri;
  }

  public static getMatchingEnterpriseAppId(url: string) {
    let appId: string|undefined;
    for (const entry of EsriOAuth2.arcGisEnterpriseClientIds) {
      if (url.toLowerCase().startsWith(entry.serviceBaseUrl)) {
        appId = entry.appId;
      }
    }
    return appId;
  }

  public static get expiration() {
    return EsriOAuth2._expiration;
  }

  public static get arcGisOnlineClientId() {
    return EsriOAuth2._arcGisOnlineClientId;
  }

  public static get arcGisEnterpriseClientIds() {
    return EsriOAuth2._arcGisEnterpriseClientIds;
  }

  // Returns the url for OAuth2 endpoint, otherwise undefined if service is not available.
  public static async getOAuth2EndpointFromRestUrl(url: string, endpoint: EsriOAuth2EndpointType): Promise<EsriOAuth2Endpoint|undefined> {
    const endpointStr = (endpoint === EsriOAuth2EndpointType.Authorize ? "authorize" : "token");
    const urlObj = new URL(url);
    if (urlObj.hostname.toLowerCase().endsWith("arcgis.com")) {
      // ArcGIS Online (fixed)
      // Doc: https://developers.arcgis.com/documentation/mapping-apis-and-services/security/oauth-2.0/
      return new EsriOAuth2Endpoint(`https://www.arcgis.com/sharing/rest/oauth2/${endpointStr}`, true);
    } else {
      const getRestUrl = (url2: string) => {
        const searchStr = "/rest/";
        const restPos = url2.indexOf(searchStr);
        return (restPos === -1 ? undefined : url2.substr(0, restPos+searchStr.length));
      };
      const restUrl = getRestUrl(url);
      if (restUrl === undefined) {
        return undefined;
      }

      // First attempt: derive the Oauth2 token URL from the 'tokenServicesUrl', exposed by the 'info request'
      const infoUrl = `${restUrl}info?f=json`;
      let data;
      try {
        data = await request(new FrontendRequestContext(""), infoUrl, {method: "GET",responseType: "json"});
      } catch {}

      const tokenServicesUrl = data?.body?.authInfo?.tokenServicesUrl;
      if (tokenServicesUrl === undefined ) {
        return undefined;
      }
      const restUrlFromTokenService = getRestUrl(tokenServicesUrl);
      if (restUrlFromTokenService === undefined) {
        return undefined;
      }

      // Check the URL we just composed
      try {
        const oauth2Url = `${restUrlFromTokenService}oauth2/${endpointStr}`;
        if (await EsriOAuth2.validateOAuth2Endpoint(oauth2Url)) {
          return new EsriOAuth2Endpoint(oauth2Url, false);
        }
      } catch {}

      // If reach this point, that means we could not derive the token endpoint from 'tokenServicesUrl'
      // lets use another approach.
      // ArcGIS Enterprise Format https://<host>:<port>/<subdirectory>/sharing/rest/oauth2/authorize
      const regExMatch =  url.match(new RegExp(/([^&\/]+)\/rest\/services\/.*/, "i"));
      if (regExMatch !== null && regExMatch.length >= 2 ) {
        const subdirectory = regExMatch[1];
        const port = (urlObj.port !== "80" && urlObj.port !=="443") ? `:${urlObj.port}` : "";
        const newUrlObj = new URL(`${urlObj.protocol}//${urlObj.hostname}${port}/${subdirectory}/sharing/rest/oauth2/${endpointStr}`);

        // Check again the URL we just composed
        try {
          const newUrl = newUrlObj.toString();
          if (await EsriOAuth2.validateOAuth2Endpoint(newUrl)) {
            return new EsriOAuth2Endpoint(newUrl, false);
          }
        } catch {}
      }

    }
    return undefined;   // we could not find any valid oauth2 endpoint
  }

  // Test if Oauth2 endpoint is accessible and has an associated appId
  public static async validateOAuth2Endpoint(endpointUrl: string): Promise<boolean> {

    // Check if we got a matching apppId for that endpoint, otherwise its not worth going further
    if (undefined === EsriOAuth2.getMatchingEnterpriseAppId(endpointUrl) ) {
      return false;
    }

    let status: number|undefined;
    try {
      const data = await request(new FrontendRequestContext(""), endpointUrl, { method: "GET"});
      status = data.status;
    } catch (error) {
      status = error.status;
    }
    return status === 400;    // Oauth2 API returns 400 (Bad Request) when there are missing parameters
  }

}
