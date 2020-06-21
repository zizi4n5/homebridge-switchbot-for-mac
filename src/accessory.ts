import {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  Characteristic,
  CharacteristicEventTypes,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  Logging,
  Service
} from "homebridge";

import Switchbot = require('node-switchbot');
import ping = require('net-ping');
const sleep = (msec: number) => new Promise(resolve => setTimeout(resolve, msec));


enum DiscoverState {
  Discovering,
  Discovered,
  NotFound,
}

class WoHand {

  private readonly delay: number;
  private readonly on: { macAddress: string };
  private readonly off: { macAddress: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private device: { [key: string]: any } = {};
  private discoverState: { [key: string]: DiscoverState } = {};

  constructor(private readonly log: Logging, config: Config) {
    this.delay = config.delay || 0;
    if (config.macAddress) {
      this.on = { macAddress: config.macAddress };
      this.off = { macAddress: config.macAddress };
    } else {
      this.on = { macAddress: config.on.macAddress };
      this.off = { macAddress: config.off.macAddress };
    }
    this.discover(this.on.macAddress);
    this.discover(this.off.macAddress);
  }

  async discover(macAddress: string) {
    if (this.discoverState[macAddress] === DiscoverState.Discovering || this.discoverState[macAddress] === DiscoverState.Discovered) return;
    this.discoverState[macAddress] = DiscoverState.Discovering;

    // Find a Bot (WoHand)
    const switchbot = new Switchbot();
    switchbot.ondiscover = async (bot) => {
      // Execute connect method because address cannot be obtained without a history of connecting.
      if (bot.address === '') await bot.connect();
      if (bot.connectionState === 'connected') await bot.disconnect();
      if (bot.address.toLowerCase().replace(/[^a-z0-9]/g, '') === macAddress.toLowerCase().replace(/[^a-z0-9]/g, '')) {
        // The `SwitchbotDeviceWoHand` object representing the found Bot.
        this.device[macAddress] = bot;
        this.discoverState[macAddress] = DiscoverState.Discovered;
        this.log(`WoHand (${macAddress}) was discovered`);
      }
    }

    await switchbot.wait(this.delay);
    await switchbot.discover({ duration: 60000, model: 'H' });

    if (this.discoverState[macAddress] !== DiscoverState.Discovered) {
      this.discoverState[macAddress] = DiscoverState.NotFound;
      this.log(`WoHand (${macAddress}) was not found`);
    }
  }

  async wait(macAddress: string) {
    while(this.discoverState[macAddress] !== DiscoverState.Discovered) {
      switch (this.discoverState[macAddress]) {
        case DiscoverState.Discovering:
          sleep(100);
          continue;
        case DiscoverState.NotFound:
          throw new Error(`WoHand (${macAddress}) was not found.`);
      }
    }
  }

  async turn(newState: boolean) {
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

export class SwitchBotAccessory implements AccessoryPlugin {
  private readonly Service: typeof Service = this.api.hap.Service;
  private readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  private readonly name: string;
  private readonly debug: boolean;
  private readonly device: WoHand;

  private readonly switchService: Service;
  private readonly informationService: Service;
  private active? :boolean;

  constructor(public readonly log: Logging, config: AccessoryConfig, public readonly api: API) {
    this.name = config.name;
    this.debug = config.debug || false;
    this.device = new WoHand(log, config as Config);

    this.switchService = new this.Service.Switch(this.name);
    this.switchService.getCharacteristic(this.Characteristic.On)
      .on(CharacteristicEventTypes.GET, this.getOn.bind(this))
      .on(CharacteristicEventTypes.SET, this.setOn.bind(this));

    this.informationService = new this.Service.AccessoryInformation()
      .setCharacteristic(this.Characteristic.Manufacturer, 'zizi4n5');

    if (config.ping) {
      const ipAddress = config.ping.ipAddress;
      const interval = Math.max(config.ping.interval || 2000, 2000);
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

  /*
   * This method is called directly after creation of this instance.
   * It should return all services which should be added to the accessory.
   */
  getServices(): Service[] {
    return [
      this.informationService,
      this.switchService,
    ];
  }

  private updateState(newState: boolean) {
    const humanState = newState ? 'on' : 'off';
    const previousState = this.active;
    const hasStateChanged = (previousState !== newState);

    if (hasStateChanged) {
      if (this.debug) this.log(`updateState: state changed, update UI (device ${humanState})`);
      this.active = newState;
      this.switchService.updateCharacteristic(this.Characteristic.On, newState);
    } else {
      if (this.debug) this.log(`updateState: state not changed, ignoring (device ${humanState})`);
    }
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory.
   */
  private getOn(callback: CharacteristicGetCallback) {
    callback(null, this.active || false);
  }
   
  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory.
   */
  private async setOn(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    const newState = value as boolean;
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
      const message = `WoHand (${this.device[humanState].macAddress}) was failed turning ${humanState}`;
      this.log(message);
      callback(Error(message));
    }
  }
}

interface Config extends AccessoryConfig {
  delay: number,
  macAddress: string,
  on: {
    macAddress: string
  },
  off: {
    macAddress: string
  },
  ping: {
    ipAddress: string,
    interval: number,
    retries: number,
    timeout: number
  },
  debug: boolean
}