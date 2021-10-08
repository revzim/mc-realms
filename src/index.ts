import { join } from "path"
import { blue, red } from "chalk"
import { MSFTMCRealms } from "./mc-realms"
import { mcerr } from "./mc-realms/errors"
import express, { Application, Request, Response } from "express"
import { config } from "dotenv"

config()

const msftmcrealmsapp = new MSFTMCRealms(process.env.CLIENT_ID)

const app: Application = express()

// app.use(cors())
app.use(express.json())
// app.use(express.static(join(__dirname, process.env.STATIC_PATH)))

const ROUTES: Record<string, string> = {
  BASE: "/",
  TOKEN: "token",
  PROFILE: "profile",
  WORLDS: "worlds",
  USERDATA: "userdata",
  AZUREVERIFY: ".well-known/microsoft-identity-association.json"
}

function routeBuilder(route?: string): string {
  return route ? `${ROUTES.BASE}${route}` : ROUTES.BASE
}

app.get(routeBuilder(), (req: Request, res: Response) => {
  res.redirect(302, msftmcrealmsapp.getOAuthURI())
})

app.get(routeBuilder(ROUTES.TOKEN), async (req: Request, res: Response) => {
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

app.get(routeBuilder(ROUTES.PROFILE), async (req: Request, res: Response) => {
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

async function getWorlds(authCode: string, version = msftmcrealmsapp.DEFAULT_MC_VERSION) {
  const profileResp = await msftmcrealmsapp.getProfile(authCode)
  const worldsResp = await msftmcrealmsapp.query("/worlds", authCode, profileResp.id, profileResp.name, version)
  return {
    worlds: worldsResp,
    profile: profileResp,
  }
}

app.get(routeBuilder(ROUTES.WORLDS), async (req: Request, res: Response) => {
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

app.get(routeBuilder(ROUTES.USERDATA), async (req: Request, res: Response) => {
  // const authCode = req.headers.authorization || req.query.token
  const authCode = req.query.token
  const mcVersion = req.query.version || msftmcrealmsapp.DEFAULT_MC_VERSION
  if (authCode && typeof authCode === "string" && authCode !== "" && typeof mcVersion === "string") {
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
          const resp = await msftmcrealmsapp.query(`/worlds/v1/${server.id}/join/pc`, authCode, profile.id, profile.name, mcVersion)
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

// AZURE DOMAIN VERIFICATION SERVICE
app.get(routeBuilder(ROUTES.AZUREVERIFY), (req: Request, res: Response) => {
  res.json({
    associatedApplications: [
      {
        applicationId: process.env.CLIENT_ID
      }
    ]
  })
})

app.listen(process.env.PORT, ()=>{
  console.log(blue(`server listening at: ${process.env.PORT}`))
})