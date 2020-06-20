const Switchbot = require('node-switchbot');
const ping = require('net-ping');
const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

let Service;
let Characteristic;

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory('homebridge-switchbot-for-mac', 'SwitchBot-For-Mac', SwitchBotAccessory);
}

class WoHand {

  on = {};
  off = {};
  device = {};
  discoverState = {};

  constructor(log, config) {
    this.log = log;
    this.delay = config.delay || 0;
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

  async turn(newState) {
    if (newState) {
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
    this.serviceManager = null;
    this.debug = config.debug || false;
    this.log = log;
    this.device = new WoHand(log, config);
    this.active = null;
    if (config.ping) {
      const ipAddress = config.ping.ipAddress;
      const interval = Math.max(config.ping.interval || 2000, 2000);
      const session = ping.createSession({ retries: 1, timeout: 1000 });
      const retries = Math.max(config.ping.retries || 1, 1);
      const timeout = Math.min(config.ping.timeout || interval / (retries + 1), interval / (retries + 1));
      const session = ping.createSession({ retries: retries, timeout: timeout });
      this.log(`ping - ipAddress:${ipAddress} interval:${interval} retries:${retries} timeout:${timeout}`);
      setInterval(() => {
        session.pingHost(ipAddress, (error, target) => {
          if (error && !(error instanceof ping.RequestTimedOutError)) {
            this.log(`ping ${target} is error (${error.toString()})`);
          }
          this.updateState(!error);
        })
      }, interval);
    }
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

    this.serviceManager = switchService;
    return [accessoryInformationService, switchService];
  }

  updateState(newState) {
    if (!this.serviceManager) return;

    const humanState = newState ? 'on' : 'off';
    const previousState = this.active;
    const hasStateChanged = (previousState !== newState);

    if (hasStateChanged) {
      if (this.debug) this.log(`updateState: state changed, update UI (device ${humanState})`);
      this.active = newState;
      this.serviceManager.getCharacteristic(Characteristic.On);
    } else {
      if (this.debug) this.log(`updateState: state not changed, ignoring (device ${humanState})`);
    }
  }

  getOn(callback) {
    callback(null, this.active || false);
  }

  async setOn(newState, callback) {
    const humanState = newState ? 'on' : 'off';
    this.log(`Turning ${humanState}...`);

    if (newState === this.active) {
      this.log(`WoHand (${this.device[humanState].macAddress}) was already ${humanState}`);
      callback();
      return;
    }

    try {
      await this.device.turn(newState);
      this.active = newState;
      this.log(`WoHand (${this.device[humanState].macAddress}) was turned ${humanState}`);
      callback();
    } catch (error) {
      let message = `WoHand (${this.device[humanState].macAddress}) was failed turning ${humanState}`;
      this.log(message);
      callback(message);
    }
  }
}
