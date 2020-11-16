// revzim <https://github.com/revzim>

// MC-REALMS
// SIMPLE WRAPPER FOR MINECRAFT REALMS API 
// (FIND SERVER ADDR FOR USE WITH MINEFLAYER)

// REQUIREMENT FOR MINECRAFT AUTHENTICATION
const ygg = require('yggdrasil')();

// LIBRARY USED FOR REQUESTS TO REALM API
const request = require('request');

// LATEST MC VERSION
const VERSION = "1.16.4";

/*
  username = STRING USERNAME
  version = STRING MINECRAFT VERSION
  sid = STRING token:<token>:<uuid> 
    SPECIFIC TO AUTHENTICATING WITH REALM
    <token> = YGG TOKEN FROM AUTH
    <uuid> = YGG UUID FROM AUTH
  subdomain = SUBDOMAIN OF REALM API ex: /worlds
  cb = CALLBACK
*/
let findRealm = (username, version, sid, subdomain, cb)=>{
  
  // "COOKIE JAR" FOR REQUESTS
  const cj = request.jar();

  const domain = "https://pc.realms.minecraft.net";

  cj.setCookie(`user=${username}`, domain);
  cj.setCookie(`version=${version}`, domain);
  cj.setCookie(`sid=${sid}`, domain);

  request(`${domain}${subdomain}`, { jar: cj }, (error, response, body) => {
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

let login = (username, password, cb) => {
  ygg.auth({
    user: username, // USERNAME
    pass: password // PASSWORD
  }, function(err, data){
    if(err) {
      cb({
        error: err,
        data: null,
      })
    };
    if (data) {
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
const object_data = {
  username: data.selectedProfile.name,
  id: data.selectedProfile.id,
  accessToken: data.accessToken,
  clientToken: data.clientToken,
  version: opts.version,
  sid = `token:${data.accessToken}:${data.selectedProfile.id}`,
}
*/
let getRealmsAddrs = (username, password, version=VERSION, cb) =>{
  login(username, password, data=>{
    if (data.data) findRealm(username, version, data.data.sid, "/worlds", (worlds_resp)=>{
      if (worlds_resp.body) {
        const body = JSON.parse(worlds_resp.body);
        const resp_servers = body.servers; // ARRAY OF SERVERS
        const servers = {};
        /*
          {
            id: 000000,
            remoteSubscriptionId: 'TEST',
            owner: 'TEST OWNER',
            ownerUUID: 'TEST',
            name: 'TEST NAME',
            motd: "TEST MOTD",
            defaultPermission: 'MEMBER',
            state: 'OPEN',
            daysLeft: 0,
            expired: false,
            expiredTrial: false,
            gracePeriod: false,
            worldType: 'NORMAL',
            players: null,
            maxPlayers: 10,
            minigameName: null,
            minigameId: null,
            minigameImage: null,
            activeSlot: 1,
            slots: null,
            member: false,
            clubId: null,
            // SPECIAL ADDITION
            addr: {
              host: "localhost", // STRING HOST OF REALM SERVER
              port: 12345 // NUMBER PORT OF REALM SERVER
            }
          }
        */
        for (const server of resp_servers) {
          findRealm(username, version, data.data.sid, `/worlds/v1/${server.id}/join/pc`, (join_resp)=>{
            if (join_resp.body === 'Retry again later') {
              cb({ error: join_resp.body, servers: null });
            } else {
              try {
                const server_resp = JSON.parse(join_resp.body);
                const server_addr = server_resp.address.split(":");
                server.addr = {
                  host: server_addr[0],
                  port: server_addr[1],
                }
                servers[server.name] = server;
                
                if (Object.keys(servers).length == resp_servers.length) {
                  cb({
                    servers: servers,
                    error: null,
                  })
                }
              } catch (e) {
                console.log(`err with server: ${server.id}:`, e);
              }
            }
          });
        }
      }
    });
  });
}

module.exports.GetRealmsAddrs = getRealmsAddrs;
