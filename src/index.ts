import { API } from 'homebridge';

import { PLUGIN_NAME, PLATFORM_NAME } from './settings';
import { SwitchBotAccessory } from './accessory'; 

/*
 * This method registers the accessory with Homebridge
 */
export default function (api: API): void {
  api.registerAccessory(PLUGIN_NAME, PLATFORM_NAME, SwitchBotAccessory);
}
