# homebridge-switchbot-for-mac

A [Homebridge](https://github.com/nfarina/homebridge) plugin for [SwitchBot](https://www.switch-bot.com).

## Requirements

* Currently only macOS is supported.

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
