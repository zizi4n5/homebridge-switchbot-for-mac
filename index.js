const Switchbot = require('node-switchbot');

let Service;
let Characteristic;

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory('homebridge-switchbot-for-mac', 'SwitchBot-For-Mac', SwitchBotAccessory);
}

class WoHand {
  constructor(log, macAddress) {
    this.log = log;
    this.macAddress = macAddress;
    this.discover();
  }

  async discover() {
    this.device = null;
    this.state = 'discovering';

    // Find a Bot (WoHand)
    const switchbot = new Switchbot();
    switchbot.ondiscover = async (bot) => {
      // Execute connect method because address cannot be obtained without a history of connecting.
      if (bot.address === '') await bot.connect();
      if (bot.connectionState === 'connected') await bot.disconnect();
      if (bot.address.toLowerCase().replace(/[^a-z0-9]/g, '') === this.macAddress.toLowerCase().replace(/[^a-z0-9]/g, '')) {
        // The `SwitchbotDeviceWoHand` object representing the found Bot.
        this.device = bot;
        this.state = 'discovered';
        this.log(`WoHand (${this.macAddress}) was discovered`);
      }
    }

    await switchbot.discover({ duration: 60000, model: 'H' });

    if (this.state !== 'discovered') {
      this.state = 'not found';
      this.log(`WoHand (${this.macAddress}) was not found`);
    }
  }

  async wait() {
    while(true) {
      switch (this.state) {
        case 'discovering':
          sleep(100);
          break;
        case 'discovered':
          return;
        case 'not found':
          throw new Error(`WoHand (${this.macAddress}) was not found.`);
      }
    }
  }

  async turn(value) {
    await this.wait();
    value ? await this.device.turnOn() : await this.device.turnOff();
  }
}

class SwitchBotAccessory {
  constructor(log, config) {
    this.log = log;
    if (config.macAddress) {
      this.on = new WoHand(log, config.macAddress);
      this.off = this.on;
    } else {
      this.on = new WoHand(log, config.on.macAddress);
      this.off = new WoHand(log, config.off.macAddress);
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

    if (value) {
      device = this.on;
    } else {
      device = this.off;
    }

    try {
      await device.turn(value);
      this.active = value;
      this.log(`WoHand (${device.macAddress}) was turned ${humanState}`);
      callback();
    } catch (error) {
      let message = `WoHand (${device.macAddress}) was failed turning ${humanState}`;
      this.log(message);
      callback(message);
    }
  }
}
