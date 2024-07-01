import { Command, flags } from '@oclif/command'

import { DEVICE_CONFIG_FLAGS, loadDeviceConfigs } from '../config/device'
import { downloadAllConfigs, fetchUpdateConfig, getCarrierSettingsUpdatesDir } from '../blobs/carrier'
import { forEachDevice } from '../frontend/devices'

export default class UpdateCarrierSettings extends Command {
  static description = 'download updated carrier protobuf configs.'

  static flags = {
    out: flags.string({
      char: 'o',
      description: 'override output directory',
    }),
    debug: flags.boolean({
      description: 'enable debug output',
      default: false,
    }),
    buildId: flags.string({
      description: 'override build ID',
      char: 'b',
    }),
    ...DEVICE_CONFIG_FLAGS,
  }

  async run() {
    let { flags } = this.parse(UpdateCarrierSettings)
    let devices = await loadDeviceConfigs(flags.devices)
    await forEachDevice(
      devices,
      false,
      async config => {
        if (config.device.has_cellular) {
          const buildId = flags.buildId ?? config.device.build_id
          const outDir = flags.out ?? getCarrierSettingsUpdatesDir(config)
          const updateConfig = await fetchUpdateConfig(config.device.name, buildId, flags.debug)
          if (flags.debug) console.log(updateConfig)
          await downloadAllConfigs(updateConfig, outDir, flags.debug)
        } else {
          this.log(`${config.device.name} is not supported due to lack of cellular connectivity`)
        }
      },
      config => `${config.device.name} ${flags.buildId ?? config.device.build_id}`,
    )
  }
}
