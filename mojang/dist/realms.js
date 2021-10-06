"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Realms = void 0;
// MC-REALMS <REVZIM | https://github.com/revzim>
// REQUIREMENT FOR MINECRAFT AUTHENTICATION
const ygg = require('yggdrasil')();
// LIBRARY USED FOR REQUESTS TO REALM API
const request = require('request');
class Realms {
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
    login(password, cb) {
        ygg.auth({
            user: this.username,
            pass: password // PASSWORD
        }, (err, data) => {
            if (err) {
                cb({
                    error: err,
                    data: null,
                });
            }
            ;
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
                });
            }
        });
    }
    /*
      subdomain = SUBDOMAIN OF REALM API ex: /worlds
      cb = CALLBACK
    */
    query(subdomain, cb) {
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
        request(`${domain}${subdomain}`, { jar: cj }, (error, response, body) => {
            if (error) {
                cb({
                    error: error,
                    response: null,
                    body: null,
                });
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
    get_addrs(cb) {
        if (!this.is_authenticated())
            return;
        this.query("/worlds", (resp) => {
            if (resp.body) {
                const body = JSON.parse(resp.body);
                const resp_servers = body.servers; // ARRAY OF SERVERS
                const servers = {};
                for (const server of resp_servers) {
                    this.query(`/worlds/v1/${server.id}/join/pc`, (join_resp) => {
                        if (join_resp.body === 'Retry again later') {
                            cb({ error: join_resp.body, servers: null });
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
                                    cb({
                                        error: null,
                                        servers: servers,
                                    });
                                }
                            }
                            catch (e) {
                                console.log(`err with server: ${server.id}:`, e);
                            }
                        }
                    });
                }
            }
            else {
                console.log(resp);
            }
        });
    }
}
exports.Realms = Realms;
//# sourceMappingURL=realms.js.map