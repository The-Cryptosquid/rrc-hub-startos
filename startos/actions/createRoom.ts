import { roomsToml } from '../fileModels/rooms.toml'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  maxRoomNameBytes,
  normalizeRoom,
  restartHub,
  roomNameBytes,
} from '../utils'
import { roomSettingsSpec, roomSettingsToToml } from './roomForm'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  name: Value.text({
    name: i18n('Room Name'),
    description: i18n(
      'What people type or pick to join. Stored in lowercase; up to 64 bytes.',
    ),
    required: true,
    default: null,
    placeholder: 'general',
    minLength: 1,
    maxLength: maxRoomNameBytes,
  }),
  settings: Value.object({ name: i18n('Room Settings') }, roomSettingsSpec()),
})

export const createRoom = sdk.Action.withInput(
  'create-room',
  {
    name: i18n('Create Room'),
    description: i18n(
      'Add a channel to the hub. Give people permissions in it with Manage User Permissions.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Rooms'),
    visibility: 'enabled',
  },
  inputSpec,
  async () => null,
  async ({ effects, input }) => {
    const name = normalizeRoom(input.name)
    if (!name) throw new Error(i18n('The room name cannot be blank'))
    if (roomNameBytes(name) > maxRoomNameBytes) {
      throw new Error(i18n('The room name is longer than 64 bytes'))
    }
    const rooms = (await roomsToml.read((r) => r.rooms).once()) ?? {}
    if (name in rooms) {
      throw new Error(
        i18n(
          'A room named "${name}" already exists. Use Edit Room to change it.',
          {
            name,
          },
        ),
      )
    }
    await roomsToml.merge(effects, {
      rooms: { [name]: roomSettingsToToml(input.settings) },
    })
    await restartHub(effects)
    return {
      version: '1',
      title: i18n('Room Created'),
      message: i18n(
        'The room "${name}" is ready. The hub restarts to open it, and clients reconnect within a few seconds.',
        { name },
      ),
      result: null,
    }
  },
)
