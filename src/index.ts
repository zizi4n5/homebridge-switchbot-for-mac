import { API } from 'homebridge';

import { PLATFORM_NAME } from './settings';
import { SwitchBotAccessory } from './accessory'; 

/*
 * Initializer function called when the plugin is loaded.
 */
export = (api: API) => {
  api.registerAccessory(PLATFORM_NAME, SwitchBotAccessory);
};
