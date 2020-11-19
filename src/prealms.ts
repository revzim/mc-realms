// MC-REALMS <REVZIM | https://github.com/revzim>
// REQUIREMENT FOR MINECRAFT AUTHENTICATION
const ygg = require('yggdrasil')();

// LIBRARY USED FOR REQUESTS TO REALM API
const request = require('request');

interface AuthCache {
  tokens: {
    access: string;
    client: string;
  };
  sid: string;
}

export class PRealms {
  
  /*
    * DECIDED AGAINST STORING PASSWORD AS PROPERTY
    * HAVE TO PROVIDE PASSWORD ON INIT
    * & ON ANY RE-ATTEMPT TO AUTH
    * username = STRING USERNAME
    * version = STRING MINECRAFT VERSION 
    * name = STRING NAME
    * sid = STRING token:<token>:<uuid> 
    * SPECIFIC TO AUTHENTICATING WITH REALM
    * <token> = YGG TOKEN FROM AUTH
    * <uuid> = YGG UUID FROM AUTH
  */
  username: string;
  uuid: string;
  name: string;
  auth_cache: AuthCache;
  authenticated: boolean;
  version: string;

  constructor(username: string, version: string) {
    this.username = username;
    this.uuid = "";
    this.name = "";
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

  login(password: string): Promise<any> {
    return new Promise((resolve: any, reject: any): void => {
      ygg.auth({
        user: this.username, // USERNAME
        pass: password // PASSWORD
      }, (err: Error, data: any) => {
        if (err) {
          return reject({
            error: err,
            success: false,
          });
        }
        this.uuid = data.selectedProfile.id;
        this.auth_cache.tokens.access = data.accessToken;
        this.auth_cache.tokens.client = data.clientToken;
        this.auth_cache.sid = `token:${data.accessToken}:${data.selectedProfile.id}`;
        this.name = data.selectedProfile.name;
        this.authenticated = true;
        resolve({
          success: true,
          error: null,
        });
      });
    })
  }

  /*
    subdomain = SUBDOMAIN OF REALM API ex: /worlds
    cb = CALLBACK
  */
  query(subdomain: string): Promise<any> {
    if (!this.is_authenticated()) return;
    
    // "COOKIE JAR" FOR REQUESTS
    const cj = request.jar();
    
    // MINECRAFT REALMS API DOMAIN
    const domain: string = "https://pc.realms.minecraft.net";

    // SET COOKIE VALS
    cj.setCookie(`user=${this.username}`, domain);
    cj.setCookie(`version=${this.version}`, domain);
    cj.setCookie(`sid=${this.auth_cache.sid}`, domain);

    return new Promise((resolve: any, reject: any): void =>{
      request(`${domain}${subdomain}`, { jar: cj }, (err: Error, response: any, body: any): void => {
        if (err) { 
          return reject(err);
        }
        resolve({
          response: response,
          body: body,
        })
      });
    })
  }
  
  get_addrs(): Promise<any> {
    if (!this.is_authenticated()) return;
    return new Promise((resolve: any, reject: any): void => {
      this.query('/worlds')
        .then((resp: any): void => {
          const body: any = JSON.parse(resp.body);
          const resp_servers: Array<any> = body.servers; // ARRAY OF SERVERS
          const servers: any = {};
          for (const server of resp_servers) {
            this.query(`/worlds/v1/${server.id}/join/pc`)
              .then((join_resp: any)=>{
                if (join_resp.body === 'Retry again later') {
                  reject({ error: join_resp.body, servers: null });
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
                      resolve({
                        error: null,
                        servers: servers,
                      });
                    }
                  } catch (e) {
                    console.log(`err with server: ${server.id}:`, e);
                  }
                }
              })
              .catch((joine: Error)=>{
                console.log("join err:", joine);
              })
          }
        })
        .catch((worlde: Error)=>{
          console.log("world err:", worlde);
        })
    });
  }

}

