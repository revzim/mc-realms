const HashMisMatch = "auth err: microsoft and minecraft hashes dont match"

const GenericToken = "no auth code present in response"

const GenericTryAgain = "the minecraft api seems to be overwhelmed! try again in 60s. thank you :D"

function parser(e: any) {
  if (e.response && e.response.data) {
    console.log(e.response.data)
    console.log(e.response.data.error_description)
    e.message = e.response.data.error_description ?? mcerr.GenericTryAgain
  }
  return e.message
}

export const mcerr: Record<string, any> = {
  HashMisMatch,
  GenericToken,
  GenericTryAgain,
  parser,
}
