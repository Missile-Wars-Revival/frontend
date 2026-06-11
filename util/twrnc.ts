import { create } from 'twrnc';
import type { TwConfig } from 'twrnc';
import twConfigRaw from '../tailwind.config.js';

const twConfig = twConfigRaw as TwConfig;
export const tw = create(twConfig);
