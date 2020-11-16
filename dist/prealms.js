"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRealms = void 0;
// MC-REALMS <REVZIM | https://github.com/revzim>
// REQUIREMENT FOR MINECRAFT AUTHENTICATION
const ygg = require('yggdrasil')();
// LIBRARY USED FOR REQUESTS TO REALM API
const request = require('request');
class PRealms {
    constructor(username, version) {
        this.username = username;
        this.uuid = "";
        this.auth_cache = {
            tokens: {
                access: "",
                client: "",
            },
            sid: "",
        };
        this.authenticated = false;
        this.version = version;
    }
    is_authenticated() {
        return this.authenticated;
    }
    login(password) {
        return new Promise((resolve, reject) => {
            ygg.auth({
                user: this.username,
                pass: password // PASSWORD
            }, (err, data) => {
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
                this.authenticated = true;
                resolve({
                    success: true,
                    error: null,
                });
            });
        });
    }
    /*
      subdomain = SUBDOMAIN OF REALM API ex: /worlds
      cb = CALLBACK
    */
    query(subdomain) {
        if (!this.is_authenticated())
            return;
        // "COOKIE JAR" FOR REQUESTS
        const cj = request.jar();
        // MINECRAFT REALMS API DOMAIN
        const domain = "https://pc.realms.minecraft.net";
        // SET COOKIE VALS
        cj.setCookie(`user=${this.username}`, domain);
        cj.setCookie(`version=${this.version}`, domain);
        cj.setCookie(`sid=${this.auth_cache.sid}`, domain);
        return new Promise((resolve, reject) => {
            request(`${domain}${subdomain}`, { jar: cj }, (err, response, body) => {
                if (err) {
                    return reject(err);
                }
                resolve({
                    response: response,
                    body: body,
                });
            });
        });
    }
    get_addrs() {
        if (!this.is_authenticated())
            return;
        return new Promise((resolve, reject) => {
            this.query('/worlds')
                .then((resp) => {
                const body = JSON.parse(resp.body);
                const resp_servers = body.servers; // ARRAY OF SERVERS
                const servers = {};
                for (const server of resp_servers) {
                    this.query(`/worlds/v1/${server.id}/join/pc`)
                        .then((join_resp) => {
                        if (join_resp.body === 'Retry again later') {
                            reject({ error: join_resp.body, servers: null });
                        }
                        else {
                            try {
                                const server_resp = JSON.parse(join_resp.body);
                                const server_addr = server_resp.address.split(":");
                                server.addr = {
                                    host: server_addr[0],
                                    port: server_addr[1],
                                };
                                servers[server.name] = server;
                                if (Object.keys(servers).length == resp_servers.length) {
                                    resolve({
                                        error: null,
                                        servers: servers,
                                    });
                                }
                            }
                            catch (e) {
                                console.log(`err with server: ${server.id}:`, e);
                            }
                        }
                    })
                        .catch((joine) => {
                        console.log("join err:", joine);
                    });
                }
            })
                .catch((worlde) => {
                console.log("world err:", worlde);
            });
        });
    }
}
exports.PRealms = PRealms;
//# sourceMappingURL=prealms.js.map