# mc-realms
### simple node wrapper for the [Minecraft Realm API](https://pc.realms.minecraft.net/)

## install
`npm install mc-realms`

## use
* find the server address of a minecraft realm
* use the address with [mineflayer](https://github.com/PrismarineJS/mineflayer) to create minecraft bots
```javascript
  const {GetRealmsAddrs} = require('mc-realms');
  // USERNAME = EMAIL FOR MINECRAFT
  GetRealmsAddrs(username, password, version, data=>{
    // console.log(data);
    if (!data.error) {
      const servers = data.servers;
      for (const [server_name, server_object] of Object.entries(servers)) {
        console.log(`${server_name} id: ${server_object.id} addr: ${server_object.addr.host}:${server_object.addr.port}`);
        // EX: REVZIM'S COOL SERVER id: 01234567 addr: 123.45.6.789:12345 
      }
    } else {
      console.log("err:", data.error);
      // EX: { error: 'Retry again later', servers: null }
    }
  })
```

### npm libraries
* yggdrasil
* request

##### author
* revzim
