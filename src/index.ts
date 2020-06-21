import { API } from 'homebridge';

import { PLATFORM_NAME } from './settings';
import { SwitchBotAccessory } from './accessory'; 

/*
 * This method registers the accessory with Homebridge
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export = (api: API) => {
  api.registerAccessory(PLATFORM_NAME, SwitchBotAccessory);
};
