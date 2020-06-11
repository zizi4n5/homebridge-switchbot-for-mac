const Switchbot = require('node-switchbot');
const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

let Service;
let Characteristic;

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory('homebridge-switchbot-for-mac', 'SwitchBot-For-Mac', SwitchBotAccessory);
}

class WoHand {

  delay = 0;
  on = {};
  off = {};
  device = {};
  discoverState = {};

  constructor(log, config) {
    this.log = log;
    if (config.delay) {
      this.delay = config.delay;
    }
    if (config.macAddress) {
      this.on.macAddress = config.macAddress;
      this.off.macAddress = config.macAddress;
    } else {
      this.on.macAddress = config.on.macAddress;
      this.off.macAddress = config.off.macAddress;
    }
    this.discover(this.on.macAddress);
    this.discover(this.off.macAddress);
  }

  async discover(macAddress) {
    if (this.discoverState[macAddress] === 'discovering' || this.discoverState[macAddress] === 'discovered') return;
    this.discoverState[macAddress] = 'discovering';

    // Find a Bot (WoHand)
    const switchbot = new Switchbot();
    switchbot.ondiscover = async (bot) => {
      // Execute connect method because address cannot be obtained without a history of connecting.
      if (bot.address === '') await bot.connect();
      if (bot.connectionState === 'connected') await bot.disconnect();
      if (bot.address.toLowerCase().replace(/[^a-z0-9]/g, '') === macAddress.toLowerCase().replace(/[^a-z0-9]/g, '')) {
        // The `SwitchbotDeviceWoHand` object representing the found Bot.
        this.device[macAddress] = bot;
        this.discoverState[macAddress] = 'discovered';
        this.log(`WoHand (${macAddress}) was discovered`);
      }
    }

    await switchbot.wait(this.delay);
    await switchbot.discover({ duration: 60000, model: 'H' });

    if (this.discoverState[macAddress] !== 'discovered') {
      this.discoverState[macAddress] = 'not found';
      this.log(`WoHand (${macAddress}) was not found`);
    }
  }

  async wait(macAddress) {
    while(true) {
      switch (this.discoverState[macAddress]) {
        case 'discovering':
          sleep(100);
          break;
        case 'discovered':
          return;
        case 'not found':
          throw new Error(`WoHand (${macAddress}) was not found.`);
      }
    }
  }

  async turn(value) {
    if (value) {
      const macAddress = this.on.macAddress;
      await this.wait(macAddress);
      await this.device[macAddress].turnOn();
    } else {
      const macAddress = this.off.macAddress;
      await this.wait(macAddress);
      await this.device[macAddress].turnOff();
    }
  }
}

class SwitchBotAccessory {
  constructor(log, config) {
    this.log = log;
    this.device = new WoHand(log, config);
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
      await this.device.turn(value);
      this.active = value;
      this.log(`WoHand (${this.device[humanState].macAddress}) was turned ${humanState}`);
      callback();
    } catch (error) {
      let message = `WoHand (${this.device[humanState].macAddress}) was failed turning ${humanState}`;
      this.log(message);
      callback(message);
    }
  }
}
