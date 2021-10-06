
const appjson: string = "application/json"

const jsonHeaders = {
  "Content-Type": appjson,
  "Accept": appjson,
}
const urlEncHeaders = {
  "Content-Type": "application/x-www-form-urlencoded"
}

export const HEADERS: Record<string, any> = {
  json: jsonHeaders,
  url: urlEncHeaders
}
