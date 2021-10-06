import { join } from "path"
import { blue, red } from "chalk"
import { MSFTMCRealms } from "./mc-realms"
import { mcerr } from "./mc-realms/errors"
import express, { Application } from "express"
import { config } from "dotenv"

config()

const msftmcrealmsapp = new MSFTMCRealms(process.env.CLIENT_ID)

const app: Application = express()

// app.use(cors())
app.use(express.json())
// app.use(express.static(join(__dirname, "../public")))


const mcRealmRouteGroup = "/" // "/mc-realms/"
app.get(mcRealmRouteGroup, (req, res) => {
  // console.log(req.body)
  // console.log(msftmcrealmsapp.getOAuthURI())
  res.redirect(302, msftmcrealmsapp.getOAuthURI())
})

app.get(`${mcRealmRouteGroup}token`, async (req, res) => {
  const msftCode = req.query.code
  if (msftCode && typeof msftCode === "string" && msftCode !== "") {
    try {
      const resp = await msftmcrealmsapp.authMCXBL(msftCode)
      res.json(resp)
    } catch (e: any) {
      console.log("token err:", e)
      
      res.json({ error: mcerr.parser(e) })
    }
  } else {
    console.log(red(`${req.path} => ${mcerr.GenericToken}`))
    res.json({ error: mcerr.GenericToken })
  }
})

app.get(`${mcRealmRouteGroup}profile`, async (req, res) => {
  // const authCode = req.headers.authorization || req.query.token
  const authCode = req.query.token
  if (authCode && typeof authCode === "string" && authCode !== "") {
    try {
      const resp = await msftmcrealmsapp.getProfile(authCode)
      // console.log(resp)
      res.json(resp)
    } catch(e: any) {
      console.error(red(e))
      res.json({ error: mcerr.parser(e) })
    }
  } else {
    console.log(red(`${req.path} => ${mcerr.GenericToken}`))
    res.json({ error: mcerr.GenericToken })
  }
})

async function getWorlds(authCode: string) {
  const profileResp = await msftmcrealmsapp.getProfile(authCode)
  const worldsResp = await msftmcrealmsapp.query("/worlds", authCode, profileResp.id, profileResp.name, "1.17.1")
  return {
    worlds: worldsResp,
    profile: profileResp,
  }
}

app.get(`${mcRealmRouteGroup}worlds`, async (req, res) => {
  // const authCode = req.headers.authorization || req.query.token
  const authCode = req.query.token
  if (authCode && typeof authCode === "string" && authCode !== "") {
    try {
      const worldsResp = await getWorlds(authCode)
      res.json(worldsResp.worlds)
    } catch (e: any) {
      console.error(red(e))
      res.json({ error: mcerr.parser(e) })
    }
  } else {
    console.log(red(`${req.path} => ${mcerr.GenericToken}`))
    res.json({ error: mcerr.GenericToken })
  }
})

app.get(`${mcRealmRouteGroup}userdata`, async (req, res) => {
  // const authCode = req.headers.authorization || req.query.token
  const authCode = req.query.token
  if (authCode && typeof authCode === "string" && authCode !== "") {
    try {
      const worldsResp = await getWorlds(authCode)
      if (worldsResp.worlds && worldsResp.worlds.servers) {
        // console.log(worldsResp)
        const worldServers = worldsResp.worlds.servers.filter((server: any) => server.expired !== true)
        // console.log("SERVERS:", worldServers)
        const profile = worldsResp.profile
        const addrs: Record<string, any> = {}
        for (const server of worldServers) {
          // console.log(server)
          const resp = await msftmcrealmsapp.query(`/worlds/v1/${server.id}/join/pc`, authCode, profile.id, profile.name, "1.17.1")
          // console.log("addr:", resp)
          const addrStr: string = resp.address
          const splitAddr: string[] = addrStr.split(":") // HOST, PORT
          const addr = {
            host: splitAddr[0],
            port: splitAddr[1],
            addr: addrStr,
            id: server.id,
            players: server.players
          }
          addrs[server.name] = addr
          if (Object.keys(addrs).length === worldServers.length) res.json({
            // addresses: addrs,
            // servers: worldServers,
            servers: addrs,
            profile: worldsResp.profile,
            token: authCode
          })
          // console.log(resp)
        }
      } else {
        res.json({
          error: mcerr.GenericTryAgain
        })
      }
      // res.json(worldsResp)
    } catch (e: any) {
      console.error("caught err:", red(e.message))
      res.json({ error: mcerr.parser(e) })
    }
  } else {
    console.log(red(`${req.path} => ${mcerr.GenericToken}`))
    res.json({ error: mcerr.GenericToken })
  }
})

app.listen(process.env.PORT, ()=>{
  // JSON.stringify(app.settings)
  console.log(blue(`server listening at: ${process.env.PORT}`))
})