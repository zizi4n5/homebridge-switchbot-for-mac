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
    if (config.macAddress) {
      this.mode = '1';
      this.macAddress = config.macAddress;
      this.device = null;
    } else {
      this.mode = '2';
      this.on = {};
      this.on.macAddress = config.on.macAddress;
      this.on.device = null;
      this.off = {};
      this.off.macAddress = config.off.macAddress;
      this.off.device = null;
    }
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
    let device = null;
    this.log(`Turning ${humanState}...`);

    switch (this.mode) {
      case '1':
        if (!this.device) this.device = await this.connectDevice(this.macAddress);
        device = this.device;
        break;
      case '2':
        if (value) {
          if (!this.on.device) this.on.device = await this.connectDevice(this.on.macAddress);
          device = this.on.device;
        } else {
          if (!this.off.device) this.off.device = await this.connectDevice(this.off.macAddress);
          device = this.off.device;
        }
        break;
    }

  try {
      if (device == null) {
        this.log(`WoHand (${macAddress}) was not found.`);
        throw new Error(`WoHand (${macAddress}) was not found.`);
      }

      value ? await device.turnOn() : await device.turnOff();
      await device.disconnect();
      this.active = value;
      this.log(`WoHand (${this.device.address}) was turned ${humanState}`);
      callback();
    } catch (error) {
      this.log(`WoHand (${this.device.address}) was failed turning ${humanState}`);
      callback(`WoHand (${this.device.address}) was failed turning ${humanState}`);
    }
  }

  async connectDevice(macAddress) {
      const switchbot = new Switchbot();

      // Find a Bot (WoHand)
      const bot_list = await switchbot.discover({ duration: 5000, model: 'H' });
      for(var bot of bot_list) {
        // Execute connect method because address cannot be obtained without a history of connecting.
        await bot.connect();
        this.log(`WoHand (${bot.address ?? 'undefined'}) was found.`);
        if (bot.address.toLowerCase().replace(/[^a-z0-9]/g, '') == macAddress.toLowerCase().replace(/[^a-z0-9]/g, '')) {
          // The `SwitchbotDeviceWoHand` object representing the found Bot.
          return bot;
        }
        await bot.disconnect();
      }

      return null;
  }
}
