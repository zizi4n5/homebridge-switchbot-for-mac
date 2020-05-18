const Switchbot = require('node-switchbot');

let Service;
let Characteristic;

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory('homebridge-switchbot-for-mac', 'SwitchBot-For-Mac', SwitchBotAccessory);
}

class DeviceInfo {
  constructor(macAddress) {
    this.macAddress = macAddress;
    this.device = null;
  }
}

class SwitchBotAccessory {
  constructor(log, config) {
    this.log = log;
    if (config.macAddress) {
      this.on = new DeviceInfo(config.macAddress);
      this.off = this.on;
    } else {
      this.on = new DeviceInfo(config.on.macAddress);
      this.off = new DeviceInfo(config.off.macAddress);
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
    let deviceInfo = null;
    this.log(`Turning ${humanState}...`);

    if (value) {
      deviceInfo = this.on;
    } else {
      deviceInfo = this.off;
    }

    try {
      if (deviceInfo.device === null) {
        deviceInfo.device = await this.connectDevice(deviceInfo.macAddress);
      }

      const device = deviceInfo.device;
      value ? await device.turnOn() : await device.turnOff();
      await device.disconnect();
      this.active = value;
      this.log(`WoHand (${deviceInfo.macAddress}) was turned ${humanState}`);
      callback();
    } catch (error) {
      let message = `WoHand (${deviceInfo.macAddress}) was failed turning ${humanState}`;
      this.log(message);
      callback(message);
    }
  }

  async connectDevice(macAddress) {
      const switchbot = new Switchbot();

      // Find a Bot (WoHand)
      const bot_list = await switchbot.discover({ duration: 5000, model: 'H' });
      for(var bot of bot_list) {
        // Execute connect method because address cannot be obtained without a history of connecting.
        if (bot.address === '') await bot.connect();
        if (bot.address.toLowerCase().replace(/[^a-z0-9]/g, '') === macAddress.toLowerCase().replace(/[^a-z0-9]/g, '')) {
          // The `SwitchbotDeviceWoHand` object representing the found Bot.
          if (bot.connectionState !== 'connected') await bot.connect();
          return bot;
        }
        if (bot.connectionState === 'connected') await bot.disconnect();
      }

      throw new Error(`WoHand (${macAddress}) was not found.`);
  }
}
