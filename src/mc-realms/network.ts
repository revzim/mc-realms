import axios from "axios"

export interface NetRequestOptions {
  uri: string
  headers: Record<string, string> | Record<string, Record<string, string>> // Record<string, string>
  data?: any
}

export function req(method: string, opts: NetRequestOptions): Promise<any> {
  return new Promise(async (resolve, reject) => {
    try {
      let params;
      switch (method) {
        case "get":
          params = [opts.uri, opts.headers]
          break
        case "post":
          params = [opts.uri, opts.data, opts.headers]
          break
        default:
          reject(new Error(`bad method: ${method}`))
      }
      const resp = await (axios as any)[method](...params)
      resolve(resp.data)
    } catch (e) {
      console.error(e)
      reject(e)
    }
  })
}

/** 

export async function get(uri: string, headers: Record<string, string>) {
  return new Promise(async (resolve, reject) => {
    try {
      const resp = await axios.get(uri, {
        headers,
      })
      resolve(resp.data)
    } catch (e) {
      console.error(e)
      reject(e)
    }
  })
}

export async function post(uri: string, reqData: any, headers: any): Promise<any> {
  return new Promise(async (resolve, reject) => {
    try {
      const resp = await axios.post(uri, reqData, {
        headers,
      })
      resolve(resp.data)
    } catch (e) {
      reject(e)
    }
  })
}

*/