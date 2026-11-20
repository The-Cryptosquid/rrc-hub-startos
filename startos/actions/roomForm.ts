import { Room } from '../fileModels/rooms.toml'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

// The room settings shared by Create Room and Edit Room, named after the keys
// in rooms.toml.
export const roomSettingsSpec = (room: Partial<Room> = {}) =>
  InputSpec.of({
    topic: Value.text({
      name: i18n('Topic'),
      description: i18n('Shown to people when they join the room'),
      required: false,
      default: room.topic ?? null,
      maxLength: 300,
    }),
    key: Value.text({
      name: i18n('Room Key'),
      description: i18n(
        'A password people must enter to join. Leave empty for no key. Room operators and invited users can join without it.',
      ),
      required: false,
      default: room.key ?? null,
      maxLength: 128,
    }),
    private: Value.toggle({
      name: i18n('Hidden'),
      description: i18n(
        'Leave the room out of the room list. People can still join if they know its name.',
      ),
      default: room.private ?? false,
    }),
    invite_only: Value.toggle({
      name: i18n('Invite Only'),
      description: i18n(
        'Only room operators and people they invite with /invite can join',
      ),
      default: room.invite_only ?? false,
    }),
    moderated: Value.toggle({
      name: i18n('Moderated'),
      description: i18n(
        'Only room operators and voiced users can send messages. Everyone else can read.',
      ),
      default: room.moderated ?? false,
    }),
    topic_ops_only: Value.toggle({
      name: i18n('Only Operators Change the Topic'),
      default: room.topic_ops_only ?? true,
    }),
    no_outside_msgs: Value.toggle({
      name: i18n('Members Only'),
      description: i18n(
        'Only people who have joined can send messages to the room',
      ),
      default: room.no_outside_msgs ?? true,
    }),
  })

export type RoomSettings = {
  topic: string | null
  key: string | null
  private: boolean
  invite_only: boolean
  moderated: boolean
  topic_ops_only: boolean
  no_outside_msgs: boolean
}

// Empty text means "none": drop the key from rooms.toml rather than storing "".
export const roomSettingsToToml = (s: RoomSettings) => ({
  topic: s.topic?.trim() || undefined,
  key: s.key || undefined,
  private: s.private,
  invite_only: s.invite_only,
  moderated: s.moderated,
  topic_ops_only: s.topic_ops_only,
  no_outside_msgs: s.no_outside_msgs,
})
