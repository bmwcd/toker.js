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
import { resolve } from 'path'
import { openSync, closeSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { randomBytes } from 'crypto'
import fastJson from 'fast-json-stringify'

export default class Toker {
  constructor (options = { dir: 'data', file: 'token.json', tz: -7 }) {
    this.default = {
      token_data: randomBytes(32),
      expiration: dayjs().add(5, 'minutes').toISOString()
    }
    this.schema = {
      title: 'Token Schema',
      type: 'object',
      properties: {
        token_data: {
          type: 'string',
          pattern: '[a-zA-Z0-9]{32}'
        },
        expiration: {
          type: 'string',
          format: 'date-time',
          keywords: {
            minimumFormat: dayjs().add(2, 'minutes').toISOString(),
            maximumFormat: dayjs('tomorrow').toISOString()
          }
        }
      },
      required: ['token_data', 'expiration']
    }
    this.token = this.default
    this.file = this.checkfile(this.dir, options.file)
  }

  get (key = 'token') {
    return this[key]
  }

  set (value, key = 'token') {
    if (this[key] !== value) this[key] = value
  }

  stringify (args) {
    return fastJson(this.schema)(...args)
  }

  parse (json) {
    return JSON.parse(json) || json
  }

  check (token = this.token) {
    return this.stringify(token) || false
  }

  format (token, persist = false) {
    const validated = this.parse(this.stringify(token))
    if (persist) this.token = validated || this.default
    return validated || false
  }

  checkdir (dir) {
    dir = resolve(process.cwd(), dir)
    if (!existsSync(dir)) {
      try {
        if (mkdirSync(dir, { recursive: true })) return dir
      } catch (e) {}
    }
    return false
  }

  checkfile (dir, file) {
    file = resolve(this.checkdir(dir), file)
    if (!existsSync(file)) {
      try {
        closeSync(openSync(file, 'a+'))
        if (this.write(file, this.default)) return file
      } catch (e) {}
    }
    return false
  }

  parseFile (file = this.file) {
    return this.parse(readFileSync(this.checkfile(file), 'utf-8'))
  }

  read (file = this.file) {
    try {
      this.token = this.parseFile(file)
      this.token.expiration = dayjs(this.token.expiration)
      return this.token
    } catch (e) {}
    return false
  }

  write (file = this.file, data = this.token) {
    try {
      data = this.stringify(data) || this.default
      return writeFileSync(file, data, 'utf8') ? this.token : false
    } catch (e) {}
  }
}
