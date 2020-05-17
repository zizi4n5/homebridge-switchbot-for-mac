const Switchbot = require('node-switchbot');

let Service;
let Characteristic;

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory('homebridge-switchbot-for-mac', 'SwitchBot-For-Mac', SwitchBotAccessory);
}

class SwitchBotAccessory {
  constructor(log, config) {
    this.log = log;
    this.macAddress = config.macAddress;
    this.device = null;
    this.active = false;
  }

  getServices() {
    const accessoryInformationService = new Service.AccessoryInformation();
    accessoryInformationService
      .setCharacteristic(Characteristic.Manufacturer, 'zizi4n5')

    const switchService = new Service.Switch();
    switchService
      .getCharacteristic(Characteristic.On)
        .on('get', this.getOn.bind(this))
        .on('set', this.setOn.bind(this));

    return [accessoryInformationService, switchService];
  }

  getOn(callback) {
    callback(null, this.active);
  }

  async setOn(value, callback) {
    const humanState = value ? 'on' : 'off';
    this.log(`Turning ${humanState}...`);

    try {
      if (this.device == null) {
        const switchbot = new Switchbot();

        // Find a Bot (WoHand)
        const bot_list = await switchbot.discover({ duration: 5000, model: 'H' });
        for(var bot of bot_list) {
          // Execute connect method because address cannot be obtained without a history of connecting.
          await bot.connect();
          this.log(`WoHand (${bot.address}) was found.`);
          if (bot.address.toLowerCase().replace(/[^a-z0-9]/g, '') == this.macAddress.toLowerCase().replace(/[^a-z0-9]/g, '')) {
            // The `SwitchbotDeviceWoHand` object representing the found Bot.
            this.device = bot;
            break;
          }
          await bot.disconnect();
        }

        if (this.device == null) {
          this.log(`WoHand (${this.macAddress}) was not found.`);
          throw new Error(`WoHand (${this.macAddress}) was not found.`);
        }
      }

      value ? await this.device.turnOn() : await this.device.turnOff();
      await this.device.disconnect();
      this.active = value;
      this.log(`WoHand (${this.device.address}) was turned ${humanState}`);
      callback();
    } catch (error) {
      this.log(`WoHand (${this.device.address}) was failed turning ${humanState}`);
      callback(`WoHand (${this.device.address}) was failed turning ${humanState}`);
    }
  }
}
