import { NetRequestOptions, req } from "./network"
import { mcerr } from "./errors"
import { HEADERS } from "./headers"

// const uri = `${URI_PARAMS.msft}?client_id=${URI_PARAMS.client_id}&response_type=${URI_PARAMS.response_type}&redirect_uri=${URI_PARAMS.redirect_uri}&scope=${URI_PARAMS.scope}&state=${URI_PARAMS.state}`

// EVERY PAYLOAD FOLLOWS THE MICROSOFT OAUTH FLOW AUTHENTICATION SCHEME https://wiki.vg/Microsoft_Authentication_Scheme

export class MSFTMCRealms {
  MSFT_AUTHCODE_ENDPOINT: string = "https://login.live.com/oauth20_authorize.srf"
  
  MSFT_AUTHTOKEN_ENDPOINT: string = "https://login.live.com/oauth20_token.srf"

  MSFT_XBL_AUTH_ENDPOINT: string = "https://user.auth.xboxlive.com/user/authenticate"

  MSFT_XSTS_AUTH_ENDPOINT: string = "https://xsts.auth.xboxlive.com/xsts/authorize"

  MSFT_MCXBL_AUTH_ENDPOINT: string = "https://api.minecraftservices.com/authentication/login_with_xbox"
  
  MSFT_MC_VERIFY_OWNERSHIP_ENDPOINT: string = "https://api.minecraftservices.com/entitlements/mcstore"

  MC_PROFILE_ENDPOINT: string = "https://api.minecraftservices.com/minecraft/profile"

  REDIRECT_URI: string = process.env.REDIRECT_URI
  
  private OAUTHCODE_URL_PARAMS: Record<string, string> = {
    client_id: process.env.CLIENT_ID,
    response_type: "code",
    redirect_uri: this.REDIRECT_URI,
    scope: "XboxLive.signin offline_access",
    // state: "",
  }

  private AUTHTOKEN_URL_PARAMS: Record<string, string> = {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    code: "",
    grant_type: "authorization_code",
    redirect_uri: this.REDIRECT_URI,
    // state: "",
  }

  private REFRESHTOKEN_URL_PARAMS: Record<string, string> = {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    refresh_token: "",
    grant_type: "refresh_token",
    redirect_uri: this.REDIRECT_URI,
    // state: "",
  }

  private XBL_AUTH_PAYLOAD: Record<string, any> = {
    Properties: {
      AuthMethod: "RPS",
      SiteName: "user.auth.xboxlive.com",
      RpsTicket: ""
    },
    RelyingParty: "http://auth.xboxlive.com",
    TokenType: "JWT"
  }

  private XSTS_AUTH_PAYLOAD: Record<string, any> = {
    Properties: {
      SandboxId: "RETAIL",
      UserTokens: [""]
    },
    RelyingParty: "rp://api.minecraftservices.com/",
    TokenType: "JWT"
  }

  private AUTHCODE_URL: URL
  
  private oauthURI: string

  CLIENT_ID: string = process.env.CLIENT_ID

  constructor (clientID: string) {
    this.OAUTHCODE_URL_PARAMS.client_id = clientID
    this.oauthURI = this.initOAuthURI()
  }

  query(subdomain: string, token: string, id: string, username: string, version="1.17.1"): Promise<any> {
    // 
    // Cookie: sid=<token>;user=Herobrine;version=1.14.4
    const domain: string = "https://pc.realms.minecraft.net"
    const headers = Object.assign({}, HEADERS.json)
    const cookie = `sid=token:${token}:${id};user=${username};version=${version}`
    headers["Cookie"] = cookie
    const opts: NetRequestOptions = {
      uri: `${domain}${subdomain}`,
      headers: {headers},
    }
    return req("get", opts)
  }

  // FULL AUTH FLOW MSFT->MC
  async authMCXBL(code: string): Promise<any> {
    const opts: NetRequestOptions = {
      uri: this.MSFT_AUTHTOKEN_ENDPOINT,
      headers: HEADERS.url,
      data: this.initAuthTokenParams(code)
    }
    const authcodeResp = await req("post", opts)
    opts.uri = this.MSFT_XBL_AUTH_ENDPOINT
    opts.data = this.initXBLPayload(authcodeResp.access_token)
    opts.headers = HEADERS.json
    const authXBLResp = await req("post", opts)
    const tkn: string = authXBLResp.Token
    const hsh: string = authXBLResp.DisplayClaims.xui[0].uhs
    opts.uri = this.MSFT_XSTS_AUTH_ENDPOINT
    opts.data = this.initXSTSPayload(tkn)
    const authXSTSResp = await req("post", opts)
    const xstsToken = authXSTSResp.Token
    const xstsHash = authXSTSResp.DisplayClaims.xui[0].uhs
    if (xstsHash === hsh) { // SIMPLE HASH CHECK
      // HASHES ARE SAME CONTINUE
      opts.uri = this.MSFT_MCXBL_AUTH_ENDPOINT
      opts.data = this.initMCXBLAuthPayload(xstsHash, xstsToken)
      const authMCResp = await req("post", opts)
      const isOwnerResp = await this.isOwner(authMCResp.access_token)
      // console.log(isOwnerResp)
      if (isOwnerResp) {
        return authMCResp
      }
    } else {
      return mcerr.HashMisMatch
    }
  }

  initAuthHeaders(token: string): Record<string, string> {
    const headers = Object.assign({}, HEADERS.json)
    headers.Authorization = `Bearer ${token}`
    return headers
  }

  getProfile(token: string): Promise<any> {
    const headers = this.initAuthHeaders(token)
    const opts: NetRequestOptions = {
      uri: this.MC_PROFILE_ENDPOINT,
      headers: { headers },
    }
    return req("get", opts)
  }

  isOwner(token: string): Promise<any> {
    const headers = this.initAuthHeaders(token)
    const opts: NetRequestOptions = {
      uri: this.MC_PROFILE_ENDPOINT,
      headers: { headers },
    }
    return req("get", opts)
  }

  initOAuthURI(): string {
    this.AUTHCODE_URL = new URL(this.MSFT_AUTHCODE_ENDPOINT)
    for (const [k, v] of Object.entries(this.OAUTHCODE_URL_PARAMS)) {
      this.AUTHCODE_URL.searchParams.append(k, v)
    }
    return this.AUTHCODE_URL.toString()
  }

  initAuthTokenParams(code: string): URLSearchParams {
    const params = new URLSearchParams()
    const localParams = Object.assign({}, this.AUTHTOKEN_URL_PARAMS)
    localParams.code = code
    for (const [k, v] of Object.entries(localParams)) {
      params.append(k, v)
    }
    return params
  }

  initRefreshTokenParams(token: string): URLSearchParams {
    const params = new URLSearchParams()
    const localParams = Object.assign({}, this.REFRESHTOKEN_URL_PARAMS)
    localParams.refresh_token = token
    for (const [k, v] of Object.entries(localParams)) {
      params.append(k, v)
    }
    return params
  }

  initXBLPayload(token: string): any {
    const localData = Object.assign({}, this.XBL_AUTH_PAYLOAD)
    localData.Properties.RpsTicket = `d=${token}`
    return localData
  }

  initXSTSPayload(token: string): any {
    const localData = Object.assign({}, this.XSTS_AUTH_PAYLOAD)
    localData.Properties.UserTokens[0] = token
    return localData
  }

  initMCXBLAuthPayload(hash: string, token: string): any {
    return {
      identityToken: `XBL3.0 x=${hash};${token}`
    }
  }
  
  getOAuthURI(): string {
    return this.oauthURI
  }
}
