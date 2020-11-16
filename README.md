# mc-realms
### simple node wrapper for the [Minecraft Realms API](https://pc.realms.minecraft.net/)

## install
`npm install mc-realms`

## use
* find the server address of a minecraft realm
* use the address with [mineflayer](https://github.com/PrismarineJS/mineflayer) to create minecraft bots
```javascript
  const {Realms, PRealms} = require('mc-realms');

  // PROMISE EXAMPLE START
  const pr = new PRealms("test@example.com", "1.16.4");

  pr.login("password")
    .then(data=>{
      if (data.success) {
        console.log("psuccess");
        pr.get_addrs()
          .then(servers=>{
            console.log("pservers:", servers);
          })
          .catch(e=>{
            console.log("err:", e);
          })
      }
    })
    .catch(e=>{
      console.log("err:", e);
    })

  // PROMISE EXAMPLE END

  // CALLBACK EXAMPLE START

  const r = new Realms("test@example.com", "1.16.4");

  r.login("password", data=>{
    if (!data.error) {
      console.log("success");
      r.get_addrs(servers_data=>{
        if (!servers_data.error) {
          const servers = servers_data.servers;
          console.log("servers:", servers);
        } else {
          console.log("get realms addr err:", servers_data.error);
        }
      })
    } else {
      console.log("login err:", data.error);
    }
  })

  //  CALLBACK EXAMPLE END

  /*
    GET_ADDRS EX PAYLOAD:
    servers: {
    ServerName: {
      id: 0123456,
      remoteSubscriptionId: '00000000000000000000000',
      owner: 'OwnerName',
      ownerUUID: '00000000000000000000000000000',
      name: 'ServerName',
      motd: "Server MOTD",
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
      addr: { host: '123.45.6.789', port: '30575' }
    }
  */

```

### npm libraries
* yggdrasil
* request

##### author
* revzim
