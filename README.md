# homebridge-switchbot-for-mac

A [Homebridge](https://github.com/nfarina/homebridge) plugin for [SwitchBot](https://www.switch-bot.com).

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

Find your SwitchBot's MAC address (BLE MAC) with the official iOS/Android app, and add an accessory definition to `~/.homebridge/config.json`:

```json
{
    "accessories": [
        {
            "accessory": "SwitchBot-For-Mac",
            "name": "Switch",
            "macAddress": "01:23:45:67:89:AB"
        }
    ]
}
```
