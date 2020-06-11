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

## How to Use

Find your SwitchBot's MAC address (BLE MAC) with the official iOS/Android app, and add an accessory definition to `~/.homebridge/config.json`:

### Control one SwitchBot

|Property|Type|Required|Description|
|:-:|:-:|:-|:-|
|accessory|String|Required|This value is "SwitchBot-For-Mac"|
|name|String|Required|Set the name of the switch.|
|delay|Integer|Optional|Set a delay between 0 and 30000 milliseconds for waiting for Bluetooth initialization.|
|macAddress|String|Required|Set the mac address of the switch.|

```json
{
    "accessories": [
        {
            "accessory": "SwitchBot-For-Mac",
            "name": "Switch",
            "delay": 5000,
            "macAddress": "01:23:45:67:89:AB"
        }
    ]
}
```

### Control two SwitchBots

### accessories
|Property|Type|Required|Description|
|:-:|:-:|:-|:-|
|accessory|String|Required|This value is "SwitchBot-For-Mac"|
|name|String|Required|Set the name of the switch.|
|delay|Integer|Optional|Set a delay between 0 and 30000 milliseconds for waiting for Bluetooth initialization.|
|on|JSON|Required|Set the information of the switch for on.|
|off|JSON|Required|Set the information of the switch for off.|

### on/off
|Property|Type|Required|Description|
|:-:|:-:|:-|:-|
|macAddress|String|Required|Set the mac address of the switch for on/off.|

```json
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
            }
        }
    ]
}
```
