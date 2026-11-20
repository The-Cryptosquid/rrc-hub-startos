import { roomsToml } from '../fileModels/rooms.toml'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { restartHub } from '../utils'
import { roomSettingsSpec, roomSettingsToToml } from './roomForm'

const { InputSpec, Value, Variants } = sdk

// One variant per room, each prefilled with that room's current settings, so
// picking a room shows what it is set to now.
const inputSpec = InputSpec.of({
  room: Value.dynamicUnion(async () => {
    const rooms = (await roomsToml.read((r) => r.rooms).once()) ?? {}
    const names = Object.keys(rooms).sort()
    return {
      name: i18n('Room'),
      description: null,
      default: names[0] ?? null,
      disabled: false,
      variants: Variants.of(
        Object.fromEntries(
          names.map((name) => [
            name,
            { name, spec: roomSettingsSpec(rooms[name]) },
          ]),
        ),
      ),
    }
  }),
})

export const editRoom = sdk.Action.withInput(
  'edit-room',
  // Read reactively: StartOS exports this metadata at init and re-exports it
  // only when a .const() read changes, so .once() would leave the action
  // disabled after the first room is created.
  async ({ effects }) => {
    const roomCount =
      (await roomsToml
        .read((r) => Object.keys(r.rooms).length)
        .const(effects)) ?? 0
    return {
      name: i18n('Edit Room'),
      description: i18n("Change a room's topic, key and access settings"),
      warning: null,
      allowedStatuses: 'any',
      group: i18n('Rooms'),
      visibility: roomCount
        ? 'enabled'
        : { disabled: i18n('There are no rooms yet. Use Create Room first.') },
    }
  },
  inputSpec,
  async () => null,
  async ({ effects, input }) => {
    const name = input.room.selection
    const rooms = (await roomsToml.read((r) => r.rooms).once()) ?? {}
    if (!(name in rooms)) {
      throw new Error(i18n('The room "${name}" no longer exists', { name }))
    }
    await roomsToml.merge(effects, {
      rooms: { [name]: roomSettingsToToml(input.room.value) },
    })
    await restartHub(effects)
    return {
      version: '1',
      title: i18n('Room Updated'),
      message: i18n(
        'The hub restarts to apply the new settings for "${name}". Clients reconnect within a few seconds.',
        { name },
      ),
      result: null,
    }
  },
)
