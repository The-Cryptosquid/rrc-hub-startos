import { roomsToml } from '../fileModels/rooms.toml'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { restartHub } from '../utils'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  room: Value.dynamicSelect(async () => {
    const rooms = (await roomsToml.read((r) => r.rooms).once()) ?? {}
    const names = Object.keys(rooms).sort()
    return {
      name: i18n('Room'),
      description: null,
      default: null,
      values: Object.fromEntries(names.map((n) => [n, n])),
    }
  }),
})

export const deleteRoom = sdk.Action.withInput(
  'delete-room',
  // Read reactively: StartOS exports this metadata at init and re-exports it
  // only when a .const() read changes, so .once() would leave the action
  // disabled after the first room is created.
  async ({ effects }) => {
    const roomCount =
      (await roomsToml
        .read((r) => Object.keys(r.rooms).length)
        .const(effects)) ?? 0
    return {
      name: i18n('Delete Room'),
      description: i18n(
        'Remove a room with its settings and permissions. People in it are disconnected from it.',
      ),
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
    const name = input.room
    const data = await roomsToml.read().once()
    if (!data || !(name in data.rooms)) {
      throw new Error(i18n('The room "${name}" no longer exists', { name }))
    }
    const { [name]: _removed, ...rest } = data.rooms
    await roomsToml.write(effects, { ...data, rooms: rest })
    await restartHub(effects)
    return {
      version: '1',
      title: i18n('Room Deleted'),
      message: i18n(
        'The room "${name}" is gone. The hub restarts to close it.',
        { name },
      ),
      result: null,
    }
  },
)
