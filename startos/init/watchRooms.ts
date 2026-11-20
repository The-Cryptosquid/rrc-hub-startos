import { createRoom } from '../actions/createRoom'
import { roomsToml } from '../fileModels/rooms.toml'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

// With only operator-made rooms allowed (the default), a hub without rooms has
// nothing anyone can join.
export const watchRooms = sdk.setupOnInit(async (effects) => {
  const count = await roomsToml
    .read((r) => Object.keys(r.rooms).length)
    .const(effects)
  if (!count) {
    await sdk.action.createOwnTask(effects, createRoom, 'important', {
      reason: i18n('Create a room so people have somewhere to talk'),
    })
  }
})
