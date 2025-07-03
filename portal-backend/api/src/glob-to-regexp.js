'use strict'

// Given we only need to parse origins (<protocol>//<domain>) that may contain a
// star (glob pattern format), we only need to escape dots and convert stars to
// regex patterns in that case.

const globToRegExp = origin =>
  new RegExp(`^${origin.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`)

module.exports = globToRegExp
