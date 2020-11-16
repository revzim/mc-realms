# mc-realms
### simple node wrapper for the [Minecraft Realm API](https://pc.realms.minecraft.net/)

## install
`npm install mc-realms`

## use
* find the server address of a minecraft realm
* use the address with [mineflayer](https://github.com/PrismarineJS/mineflayer) to create minecraft bots
```javascript
  const {GetRealmAddress} = require('mc-realms');
  // USERNAME = EMAIL FOR MINECRAFT
  GetRealmsAddrs(username, password, version, data=>{
    // console.log(data);
    if (!data.error) {
      const servers = data.servers;
      for (const [server_name, server_object] of Object.entries(servers)) {
        console.log(`${server_name} id: ${server_object.id}`);
        // EX: REVZIM'S COOL SERVER id: 01234567 
      }
    } else {
      console.log("err:", data.error);
    }
  })
```

### npm libraries
* yggdrasil
* request

##### author
* revzim
