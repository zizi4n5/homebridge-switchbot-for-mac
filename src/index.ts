import { API } from 'homebridge';

import { PLATFORM_NAME } from './settings';
import { SwitchBotAccessory } from './accessory'; 

/*
 * This method registers the accessory with Homebridge
 */
export default function (api: API): void {
  api.registerAccessory(PLATFORM_NAME, SwitchBotAccessory);
}
