<span align="center">

# Homebridge SwitchBot

<a href="https://www.npmjs.com/package/homebridge-switchbot-for-mac"><img title="npm version" src="https://badgen.net/npm/v/homebridge-switchbot-for-mac" ></a>
<a href="https://www.npmjs.com/package/homebridge-switchbot-for-mac"><img title="npm downloads" src="https://badgen.net/npm/dt/homebridge-switchbot-for-mac" ></a>

</span>

Homebridge SwitchBot is plugin for [Homebridge](https://github.com/nfarina/homebridge) that allows you to manage [SwitchBot (the Bot)](https://www.switch-bot.com/bot) like a switch accessory on the Home app.

## Supported SwitchBot devices
* [SwitchBot (the Bot)](https://www.switch-bot.com/bot)

## Supported OS versions

### macOS
* macOS version 10.15 or later
* Install [Xcode](https://itunes.apple.com/ca/app/xcode/id497799835?mt=12)

### Raspbian(Linux-based OS)
* Kernel version 3.6 or later
* libbluetooth-dev

```bash
sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev
```

If [@abandonware/noble](https://github.com/abandonware/noble) is installed properly, this module might work well on other Linux-based OSes, such as Ubuntu, Debian and so on. See the document of the [@abandonware/noble](https://github.com/abandonware/noble#linux) for details.

## Dependencies

* Node.js 10 +
* [@abandonware/noble](https://github.com/abandonware/noble)
* [@zizi4n5/node-switchbot](https://github.com/zizi4n5/node-switchbot)

## Installation

Install the npm package:

```bash
sudo npm install -g homebridge-switchbot-for-mac
```

---
## How to Use

Find your SwitchBot's MAC address (BLE MAC) with the official iOS/Android app, and add an accessory definition to `~/.homebridge/config.json`:

### e.g. Use one SwitchBot

```config.json
{
    "accessories": [
        {
            "accessory": "SwitchBot-For-Mac",
            "name": "Switch",
            "delay": 5000,
            "retries": 3,
            "macAddress": "01:23:45:67:89:AB",
            "ping": {
                "ipAddress": "127.0.0.1",
                "interval": 2000,
                "retries": 1,
                "timeout": 1000
            }
        }
    ]
}
```

### e.g. Use two SwitchBots

```config.json
{
    "accessories": [
        {
            "accessory": "SwitchBot-For-Mac",
            "name": "Switch",
            "delay": 5000,
            "retries": 3,
            "on": {
                "macAddress": "CD:E0:12:34:56:78"
            },
            "off": {
                "macAddress": "9A:BC:DE:01:23:45"
            },
            "ping": {
                "ipAddress": "127.0.0.1",
                "interval": 2000,
                "retries": 1,
                "timeout": 1000
            }
        }
    ]
}
```

---
## Settings

|Property|Type|Required|Default Value|Description|
|:-|:-:|:-:|:-:|:-|
|accessory|String|Required|-|This value is "SwitchBot-For-Mac"|
|name|String|Required|-|Set the name of the switch.|
|delay|Integer|Optional|0|Set a delay between 0 and 30000 milliseconds for waiting for Bluetooth initialization.|
|retries|Integer|Optional|3|Set the turn retry times to more than 0 times.|

### Use one SwitchBot Settings

Settings for switching on/off using one SwitchBot.

|Property|Type|Required|Default Value|Description|
|:-|:-:|:-:|:-:|:-|
|macAddress|String|Required|-|Set the MAC address of the SwitchBot.|

### Use two SwitchBots Settings

Settings for switching on/off using two SwitchBots.

|Property|Type|Required|Default Value|Description|
|:-|:-:|:-:|:-:|:-|
|on.macAddress|String|Required|-|Set the MAC address of the SwitchBot for on.|
|off.macAddress|String|Required|-|Set the MAC address of the SwitchBot for off.|

### Advanced - Ping Settings

Settings for update the status with ping communication.

|Property|Type|Required|Default Value|Description|
|:-|:-:|:-:|:-:|:-|
|ping.ipAddress|String|Required|-|Set the IP address of the target device.|
|ping.interval|Integer|Optional|2000|Set the ping interval to more than 2000 milliseconds.|
|ping.retries|Integer|Optional|1|Set the ping retry times to more than 0 times.|
|ping.timeout|Integer|Optional|1000|Set the ping timeout to less than `interval / (retries + 1)` milliseconds.|
