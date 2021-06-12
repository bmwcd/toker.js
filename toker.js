/*
  d8             888                       ,e,
 d88    e88 88e  888 ee  ,e e,  888,8,      "   dP"Y
d88888 d888 888b 888 P  d88 88b 888 "      888 C88b
 888   Y888 888P 888 b  888   , 888    d8b 888  Y88D
 888    "88 88"  888 8b  "YeeP" 888    Y8P 888 d,dP
------------------------------------------ 88P -----
  bmwcd.github.io/toker.js                 8"
*/

import dayjs from 'dayjs'
import { join } from 'path'
import { openSync, closeSync, readFileSync, writeFileSync } from 'fs'
import { randomBytes } from 'crypto'

class Toker {
  constructor (
    token = false, 
    file = join(process.cwd(), 'token.json'), 
    minimum = 10,
    defaultToken = [dayjs().valueOf(), randomBytes(32)]
  ) {
    this.default = defaultToken
    this.token = token || this.default
    this.file = file
    this.minimum = Number(minimum * 60 * 1000)
  }

  get (key = 'token') {
    return this[key]
  }

  set (value, key = 'token') {
    if (this[key] !== value) this[key] = value
  }

  json (data = this.token, replacer = null, spaces = 2) {
    return JSON.stringify(data, replacer, spaces)
  }

  check (token = this.token) {
    if (/^[a-z0-9]{32}$/i.test(token[1]) === false) return false
    if (dayjs(token[0]).diff(dayjs())) <= this.minimum) return false
    return true
  }

  format (tokenData, persist = false) {
    const token = [dayjs().add(tokenData.expires_in, 'seconds').valueOf(), tokenData.access_token]
    if (persist) this.token = token
    return token
  }

  init () {
    try {
      closeSync(openSync(this.file, 'a+'))
      this.write(this.file, this.default, 'json')
    } catch (error) {
      throw console.error(error)
    }
    return this.token
  }

  parseFile (type = 'json', file = this.file) {
    const data = readFileSync(file, 'utf-8')
    if (type === 'json') return JSON.parse(data)
    else if (type === 'yaml') return YAML.parse(data)
    else return data
  }

  read (type = 'json') {
    try {
      this.token = this.parseFile(type, this.file)
    } catch (error) {
      this.init()
      this.token = this.parseFile(type) || console.error(error)
    }
    return this.token
  }

  write (file = this.file, data = this.token, type = 'json') {
    try {
      return writeFileSync(file, type === 'yaml' ? this.yaml(data) : this.json(data), 'utf8') || false
    } catch (error) {
      throw console.error(error)
    }
  }
}
export { Toker }
