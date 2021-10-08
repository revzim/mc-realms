# [mc-realms repo][1] | [mc-realms server/webapp][3]
- heroku hosted web server and api example to ease authentication flow with newly migrated microsoft accounts
- [info][8] about the web app

## simple server/web app and node wrapper for the [Minecraft Realms API][2]

## API ENDPOINTS
- all `mc-realms` api requests besides `/` require a `token` query param
- optional query params:
  - `version`: minecraft version (current default: 1.17.1)
- `/`
  - GET request => registering & granting auth to azure app
  - redirects to `/token?code=<CODE>`
    - `<CODE>` will be your one time use generated code by the microsoft oauth flow process
- `/profile?token=<TOKEN>`
  - GET request => user account profile
- `/worlds?token=<TOKEN>`
  - GET request => user account realms
- `/userdata?token=<TOKEN>`
  - GET request => user account profile & realm information
- *`<TOKEN>` is your minecraft access token you either parsed or received earlier throughout the oauth flow process*
- *written in a day, so expect changes.*

#### *[looking for the source code pre account migration?][10]*

#
## IMPORTANT:
### mojang => microsoft account migrations
- mojang has been in the process of migrating user accounts to microsoft accounts
- previous versions of this api return an error/warning detailing the account migration
- migrating an account to microsoft will introduce the end user to the `microsoft oauth flow`
  1. oauth code
  2. oauth code => oauth token
  3. oauth token => xbl auth
  4. xbl auth => xsts auth
  5. xsts auth => minecraft auth
  6. minecraft auth => check ownership of game
  7. user authenticated and can now get profile/realm/server info
- the microsoft oauth flow is documented on the [wiki][4]

## [mc-realms app][3]
- due to the microsoft oauth flow differing from the mojang oauth flow, the authentication process pipeline is broken once migrating accounts
- I hosted a web server/app api connected to a free azure application that makes it easy for anyone to authenticate with the new microsoft oauth flow
- once the auth process is completed, you will receieve your `access_token`, which can be used within the `mc-realms` api ecosystem or the minecraft realms api ecosystem
  1. sign in with microsoft
  2. give permission to `mc-realms` azure application
  3. if the login/authentication process is successful you will receive a payload with an `access_token`, which can now be used within the minecraft ecosystem to retreive account information
    - the access token has a lifetime of 86400 seconds (24 hours/1 earth day)
    - after that, you can refresh or issue yourself a new token
    - occasionally, `pc.realms.minecraft.net` will return a `Retry again later` response, this is typical and it just means to try again later
  4. end user can now use mc-realms endpoints with their token
  5. [API ENDPOINTS][9]

## host your own
### *IMPORTANT*
### *-due account migration to microsoft based authentication, any authentication with migrated accounts requires use of an azure application client id & secret*
### *-hosting your own mc-realms server/web app requires some knowledge of [microsoft azure][5]. prior to anything below you should have an application set up and ready to be configured. you can follow instructions on how to create an azure application [here][6]*
- `git clone https://github.com/revzim/mc-realms`
- `yarn` or `npm i`
- copy `.env.default` to `.env`
- `PORT` => the port you will host your server/webapp from
- `CLIENT_ID` => your azure application client id
- `CLIENT_SECRET` => your azure application client secret
- `REDIRECT_URI` => a valid redirect uri for your azure application
  - default is `http://localhost/token` to emulate how the [mc-realms][3] web app works
  - within the context of this server, unless you are altering any of the source code, redirect uris should follow the paradigm `host/token` to work ootb
- run dev: `yarn dev` || `npm run dev`
- build: `yarn build` || `npm run build` => `yarn start` || `npm run start`
- head to http://localhost
- [API ENDPOINTS][9]


### MORE DETAILS:
### *-for educational purposes only*
### *-very early stages development server/api source code*
### *-development began 2021-10-05 and have no idea of the future of the project*


## [pre account migration readme][7]
- source code prior to microsoft account migration moved to [/mojang][10]


<!-- LINKS -->
[0]: https://github.com/revzim
[1]: https://github.com/revzim/mc-realms
[2]: https://pc.realms.minecraft.net/
[3]: https://mcrealms.herokuapp.com/
[4]: https://wiki.vg/Microsoft_Authentication_Scheme
[5]: https://azure.microsoft.com/en-us/
[6]: https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app
[7]: ./README_PREMIGRATE.md
[8]: #mc-realms-app
[9]: #api-endpoints
[10]: ./mojang/


#### author
* [revzim][0]
