# mc-realms
### simple node wrapper for the [Minecraft Realm API](https://pc.realms.minecraft.net/)

## install
`npm install mc-realms`

## use
* find the server address of a minecraft realm
* use the address with [mineflayer](https://github.com/PrismarineJS/mineflayer) to create minecraft bots
```javascript
  const {GetRealmAddress} = require('mc-realms');
  GetRealmAddress(username, password, version, data=>{
    if (data.error) console.log("err:", data.error);
    if (data.server) {
      console.log(`server: ${data.server.host}:${data.server.port}`);
      // EX: server: 123.45.6.789:12345
    }
  })
```

### npm libraries
* yggdrasil
* request

##### author
* revzim