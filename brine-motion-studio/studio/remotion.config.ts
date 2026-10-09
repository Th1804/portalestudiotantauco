import {Config} from '@remotion/cli/config';
import fs from 'node:fs';
// Chrome del sistema solo si existe (box Linux) o si se define BMS_CHROME; si no, Remotion usa su Chrome Headless Shell.
const exe = process.env.BMS_CHROME || (process.platform === 'linux' && fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : null);
if (exe) Config.setBrowserExecutable(exe);
Config.setConcurrency(Number(process.env.BMS_CONCURRENCY ?? 1));
Config.setVideoImageFormat('jpeg');
