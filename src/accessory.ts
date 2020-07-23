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

type Switchbot = typeof Switchbot;
type SwitchbotDeviceWoHand = typeof Switchbot.SwitchbotDeviceWoHand;

enum DiscoverState {
  Discovering,
  Discovered,
  NotFound,
}

class WoHand {

  private readonly delay: number;
  private readonly retries: number;
  private readonly on: { macAddress: string };
  private readonly off: { macAddress: string };
  private device: { [key: string]: SwitchbotDeviceWoHand } = {};
  private discoverState: { [key: string]: DiscoverState } = {};

  constructor(private readonly log: Logging, config: Config) {
    this.delay = config.delay || 0;
    this.retries = config.retries || 3;
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
    switchbot.ondiscover = async (bot: SwitchbotDeviceWoHand) => {
      bot.onconnect = () => { this.log.debug(`${macAddress} connected.`); };
      bot.ondisconnect = () => { this.log.debug(`${macAddress} disconnected.`); };
      // Execute connect method because address cannot be obtained without a history of connecting.
      if (bot.address === '') await bot.connect();
      if (bot.connectionState === 'connected') await bot.disconnect();
      if (bot.address.toLowerCase().replace(/[^a-z0-9]/g, '') === macAddress.toLowerCase().replace(/[^a-z0-9]/g, '')) {
        // The `SwitchbotDeviceWoHand` object representing the found Bot.
        this.device[macAddress] = bot;
        this.discoverState[macAddress] = DiscoverState.Discovered;
        this.log.info(`WoHand (${macAddress}) was discovered`);
      }
    }

    try {
      await switchbot.wait(this.delay);
      await switchbot.discover({ duration: 60000, model: 'H' });

      if (this.discoverState[macAddress] !== DiscoverState.Discovered) {
        this.discoverState[macAddress] = DiscoverState.NotFound;
        this.log.warn(`WoHand (${macAddress}) was not found`);
      }
    } catch (error) {
      this.discoverState[macAddress] = DiscoverState.NotFound;
      this.log.error(`Failed to discover WoHand (${macAddress}). Is Bluetooth enabled?`);
      if (error instanceof Error) {
        this.log.error(`${error.stack ?? error.name + ": " + error.message}`);
      }
    }
  }

  async wait(macAddress: string) {
    if (this.discoverState[macAddress] === DiscoverState.NotFound) {
      this.log.info(`WoHand (${macAddress}) was not found. so retry discover.`);
      this.discover(macAddress);
      await sleep(1000);
    }

    while(this.discoverState[macAddress] !== DiscoverState.Discovered) {
      switch (this.discoverState[macAddress]) {
        case DiscoverState.Discovering:
          await sleep(100);
          continue;
        case DiscoverState.NotFound:
          throw new Error(`WoHand (${macAddress}) was not found.`);
      }
    }
  }

  async turn(newState: boolean, retries = this.retries) {
    const humanState = newState ? 'on' : 'off';
    const macAddress = newState ? this.on.macAddress : this.off.macAddress;

    try {
      await this.wait(macAddress);
      newState ? await this.device[macAddress].turnOn() : await this.device[macAddress].turnOff();
    } catch (error) {
      const message = `WoHand (${macAddress}) was failed turning ${humanState}`;
      this.log.debug(message);
      if (error instanceof Error) {
        this.log.debug(`${error.stack ?? error.name + ": " + error.message}`);
      }

      if (0 < retries) {
        this.log.debug(`WoHand (${macAddress}) retry turning ${humanState}: ${this.retries - (retries - 1)} times`);
        await this.turn(newState, retries - 1)
      } else {
        throw error;
      }
    }
  }
}

export class SwitchBotAccessory implements AccessoryPlugin {
  private readonly Service: typeof Service = this.api.hap.Service;
  private readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  private readonly name: string;
  private readonly device: WoHand;

  private readonly switchService: Service;
  private readonly informationService: Service;
  private state? :boolean;

  constructor(private readonly log: Logging, config: AccessoryConfig, private readonly api: API) {
    this.name = config.name;
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
      log.info(`ping - ipAddress:${ipAddress} interval:${interval} retries:${retries} timeout:${timeout}`);
      setInterval(() => {
        session.pingHost(ipAddress, (error: Error, target: string) => {
          if (error && !(error instanceof ping.RequestTimedOutError)) {
            log.debug(`ping ${target} is error (${error.toString()})`);
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
    const previousState = this.state;
    const hasStateChanged = (previousState !== newState);

    if (hasStateChanged) {
      this.log.info(`updateState: state changed, update UI (device ${humanState})`);
      this.state = newState;
      this.switchService.updateCharacteristic(this.Characteristic.On, newState);
    } else {
      this.log.debug(`updateState: state not changed, ignoring (device ${humanState})`);
    }
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory.
   */
  private getOn(callback: CharacteristicGetCallback) {
    callback(null, this.state || false);
  }
   
  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory.
   */
  private async setOn(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    const newState = value as boolean;
    const humanState = newState ? 'on' : 'off';
    this.log.info(`Turning ${humanState}...`);

    if (newState === this.state) {
      this.log.info(`WoHand (${this.device[humanState].macAddress}) was already ${humanState}`);
      callback();
      return;
    }

    try {
      await this.device.turn(newState);
      this.state = newState;
      this.log.info(`WoHand (${this.device[humanState].macAddress}) was turned ${humanState}`);
      callback();
    } catch (error) {
      const message = `WoHand (${this.device[humanState].macAddress}) was failed turning ${humanState}`;
      this.log.error(message);
      if (error instanceof Error) {
        this.log.error(`${error.stack ?? error.name + ": " + error.message}`);
      }
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
  }
}
