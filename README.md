# homebridge-switchbot-for-mac

A [Homebridge](https://github.com/nfarina/homebridge) plugin for [SwitchBot](https://www.switch-bot.com).
Currently only SwitchBot woHand device is supported.

## Requirements

* Currently only macOS is supported.
* Install [Xcode](https://itunes.apple.com/ca/app/xcode/id497799835?mt=12)

## Dependencies

* Node.js 10 +
* [@abandonware/noble](https://github.com/abandonware/noble)
* [@futomi/node-switchbot](https://github.com/futomi/node-switchbot)

## Installation

Install the npm package:

```bash
sudo npm install -g homebridge-switchbot-for-mac
```

---
## How to Use

Find your SwitchBot's MAC address (BLE MAC) with the official iOS/Android app, and add an accessory definition to `~/.homebridge/config.json`:

### Control one SwitchBot

```config.json
{
    "accessories": [
        {
            "accessory": "SwitchBot-For-Mac",
            "name": "Switch",
            "delay": 5000,
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

### Control two SwitchBots

```config.json
{
    "accessories": [
        {
            "accessory": "SwitchBot-For-Mac",
            "name": "Switch",
            "delay": 5000,
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

## Properties

|Property|Type|Required|Default Value|Description|
|:-|:-:|:-:|:-:|:-|
|accessory|String|Required|-|This value is "SwitchBot-For-Mac"|
|name|String|Required|-|Set the name of the switch.|
|delay|Integer|Optional|0|Set a delay between 0 and 30000 milliseconds for waiting for Bluetooth initialization.|
|macAddress|String|Required<br/>(one SwitchBot)|-|Set the MAC address of the switch.|
|on|JSON|Required<br/>(two SwitchBots)|-|Set the information of the switch for on.|
|off|JSON|Required<br/>(two SwitchBots)|-|Set the information of the switch for off.|
|ping|JSON|Optional|None|Update the status with ping communication.|

#### on/off
|Property|Type|Required|Default Value|Description|
|:-|:-:|:-:|:-:|:-|
|macAddress|String|Required|-|Set the mac address of the switch for on/off.|

#### ping
|Property|Type|Required|Default Value|Description|
|:-|:-:|:-:|:-:|:-|
|ipAddress|String|Required|-|Set the IP address of the target device.|
|interval|Integer|Optional|2000|Set the ping interval to more than 2000 milliseconds.|
|retries|Integer|Optional|1|Set the ping retry times to more than 0 times.|
|timeout|Integer|Optional|1000|Set the ping timeout to less than `interval / (retries + 1)` milliseconds.|
