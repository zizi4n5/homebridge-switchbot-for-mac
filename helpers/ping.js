// Copy from https://github.com/lprhodes/homebridge-broadlink-rm/blob/eb1ded9a8866a6c54ec4a007ab324104b0e1cac6/helpers/ping.js

// ping.js
// 
// Copyright (c) 2018 - 2020 Luke Rhodes
//
// Released under the Apache License Version 2.0.
// see https://github.com/lprhodes/homebridge-broadlink-rm/blob/master/LICENSE

let ping

const pingIPAddress = (ipAddress, interval, callback) => {
  if (!ping) {
    ping = require('net-ping').createSession({
      retries: 0,
      timeout: 1000
    });
  }

  setInterval(() => {
    ping.pingHost(ipAddress, (error) => {
      callback(!error)
    })
  }, interval * 1000);
}

module.exports = pingIPAddress;
