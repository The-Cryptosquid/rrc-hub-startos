import { roomsToml } from '../fileModels/rooms.toml'
import { rrcdToml } from '../fileModels/rrcd.toml'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

// rrcd exits after creating any of its files that is missing, so the package
// writes rrcd.toml and rooms.toml before the first start (the identity comes
// from the prepare oneshot). On every init the merge also re-applies the
// settings the package fixes, and keeps everything else as it is.
export const seedFiles = sdk.setupOnInit(async (effects) => {
  await rrcdToml.merge(effects, {})
  await roomsToml.merge(effects, {})
  await storeJson.merge(effects, {})
})
