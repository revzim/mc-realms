// MC-REALMS <REVZIM | https://github.com/revzim>
// REQUIREMENT FOR MINECRAFT AUTHENTICATION
const ygg = require('yggdrasil')();

// LIBRARY USED FOR REQUESTS TO REALM API
const request = require('request');

interface LoginResponseData {
  username: string;
  id: string;
  accessToken: string;
  clientToken: string;
  sid: string;
}

interface LoginResponse {
  error: Error;
  data: LoginResponseData;
}

interface AuthCache {
  tokens: {
    access: string;
    client: string;
  };
  sid: string;
}

interface ReqResponse {
  error: Error;
  body: any;
  response: any;
}

interface AddrResponse {
  error: Error;
  servers: any;
}

export class Realms {
  
  /*
   * DECIDED AGAINST STORING PASSWORD AS PROPERTY
   * HAVE TO PROVIDE PASSWORD ON INIT
   * & ON ANY RE-ATTEMPT TO AUTH
   * username = STRING USERNAME
   * version = STRING MINECRAFT VERSION 
   * sid = STRING token:<token>:<uuid> 
   * SPECIFIC TO AUTHENTICATING WITH REALM
   * <token> = YGG TOKEN FROM AUTH
   * <uuid> = YGG UUID FROM AUTH
  */
  username: string;
  uuid: string;
  auth_cache: AuthCache;
  authenticated: boolean;
  version: string;

  constructor(username: string, version: string) {
    this.username = username;
    this.uuid = "";
    this.auth_cache = {
      tokens: {
        access: "",
        client: "",
      },
      sid: "",
    }
    this.authenticated = false;
    this.version = version;
  }

  is_authenticated(): boolean {
    return this.authenticated;
  }

  login(password: string, cb: (data: LoginResponse)=>void): void {
    ygg.auth({
      user: this.username, // USERNAME
      pass: password // PASSWORD
    }, (err: Error, data: any) => {
      if(err) {
        cb({
          error: err,
          data: null,
        })
      };
      if (data) {
        this.uuid = data.selectedProfile.id;
        this.auth_cache.tokens.access = data.accessToken;
        this.auth_cache.tokens.client = data.clientToken;
        this.auth_cache.sid = `token:${data.accessToken}:${data.selectedProfile.id}`;
        this.authenticated = true;
        cb({
          error: null,
          data: {
            username: data.selectedProfile.name,
            id: data.selectedProfile.id,
            accessToken: data.accessToken,
            clientToken: data.clientToken,
            sid: `token:${data.accessToken}:${data.selectedProfile.id}`,
          },
        })
      }
    });
  }

  /*
    subdomain = SUBDOMAIN OF REALM API ex: /worlds
    cb = CALLBACK
  */
  query(subdomain: string, cb: (resp: ReqResponse)=>void): void {
    if (!this.is_authenticated()) return;
    
    // "COOKIE JAR" FOR REQUESTS
    const cj = request.jar();
    
    // MINECRAFT REALMS API DOMAIN
    const domain: string = "https://pc.realms.minecraft.net";

    // SET COOKIE VALS
    cj.setCookie(`user=${this.username}`, domain);
    cj.setCookie(`version=${this.version}`, domain);
    cj.setCookie(`sid=${this.auth_cache.sid}`, domain);

    request(`${domain}${subdomain}`, { jar: cj }, (error: Error, response: any, body: any): void => {
      if (error) {
        cb({
          error: error,
          response: null,
          body: null,
        })
      }
      if (body) {
        cb({
          body: body,
          response: response,
          error: null,
        });
      }
    });

  }

  get_addrs(cb: (addr_resp: AddrResponse)=>void): void {
    if (!this.is_authenticated()) return;

    this.query("/worlds", (resp: ReqResponse): void => {
      if (resp.body) {
        const body: any = JSON.parse(resp.body);
        const resp_servers: Array<any> = body.servers; // ARRAY OF SERVERS
        const servers: any = {};
        for (const server of resp_servers) {
          this.query(`/worlds/v1/${server.id}/join/pc`, (join_resp: ReqResponse):void => {
            if (join_resp.body === 'Retry again later') {
              cb({ error: join_resp.body, servers: null });
            } else {
              try {
                const server_resp = JSON.parse(join_resp.body);
                const server_addr: Array<string> = server_resp.address.split(":");
                server.addr = {
                  host: server_addr[0],
                  port: server_addr[1],
                }
                servers[server.name] = server;
                
                if (Object.keys(servers).length == resp_servers.length) {
                  cb({
                    error: null,
                    servers: servers,
                  })
                }
              } catch (e) {
                console.log(`err with server: ${server.id}:`, e);
              }
            }
          });
        }
      } else {
        console.log(resp);
      }
    })
  }

}