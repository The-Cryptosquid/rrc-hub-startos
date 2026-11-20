import { Room, roomsToml } from '../fileModels/rooms.toml'
import { rrcdToml } from '../fileModels/rrcd.toml'
import { seenUsersJson } from '../fileModels/seenUsers.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  formatTime,
  identityHashRegex,
  knownUsers,
  normalizeHash,
  restartHub,
  shortHash,
} from '../utils'

const { InputSpec, Value, Variants } = sdk

const MANUAL = 'manual'

type Current = {
  hubOperator: boolean
  hubBanned: boolean
  operator: string[]
  voiced: string[]
  banned: string[]
}

const roomsWhere = (
  rooms: Record<string, Room>,
  hash: string,
  list: 'operators' | 'voiced' | 'bans',
) =>
  Object.entries(rooms)
    .filter(([, r]) => r[list].map(normalizeHash).includes(hash))
    .map(([name]) => name)

// The permission fields, prefilled with one user's current permissions.
const permissionFields = (roomNames: Record<string, string>, c: Current) => ({
  hubOperator: Value.toggle({
    name: i18n('Hub Operator'),
    description: i18n(
      'Can run hub-wide admin commands from a chat client (/stats, /reload, /kline) and open rooms even when only your rooms are allowed',
    ),
    default: c.hubOperator,
  }),
  hubBanned: Value.toggle({
    name: i18n('Banned From the Hub'),
    description: i18n('Disconnected whenever they try to connect'),
    default: c.hubBanned,
  }),
  operator: Value.multiselect({
    name: i18n('Room Operator In'),
    description: i18n(
      'Can moderate these rooms: change the topic and modes, invite, kick and ban',
    ),
    default: c.operator,
    values: roomNames,
  }),
  voiced: Value.multiselect({
    name: i18n('Voice In'),
    description: i18n(
      'Can send messages in these rooms while they are moderated',
    ),
    default: c.voiced,
    values: roomNames,
  }),
  banned: Value.multiselect({
    name: i18n('Banned From Rooms'),
    description: i18n('Cannot join these rooms'),
    default: c.banned,
    values: roomNames,
  }),
})

const noPermissions: Current = {
  hubOperator: false,
  hubBanned: false,
  operator: [],
  voiced: [],
  banned: [],
}

const inputSpec = InputSpec.of({
  user: Value.dynamicUnion(async () => {
    const hub = await rrcdToml.read((c) => c.hub).once()
    const rooms = (await roomsToml.read((r) => r.rooms).once()) ?? {}
    const seen = (await seenUsersJson.read((s) => s.users).once()) ?? {}
    const trusted = (hub?.trusted_identities ?? []).map(normalizeHash)
    const banned = (hub?.banned_identities ?? []).map(normalizeHash)
    const roomNames = Object.fromEntries(
      Object.keys(rooms)
        .sort()
        .map((n) => [n, n]),
    )
    const named = [
      ...trusted,
      ...banned,
      ...Object.values(rooms).flatMap((r) => [
        ...r.operators,
        ...r.voiced,
        ...r.bans,
      ]),
    ]

    const users = knownUsers(seen, named)
    const variants = Object.fromEntries(
      users.map((u) => {
        const when = formatTime(u.last_seen)
        const label = [
          u.nick ?? i18n('(no nickname)'),
          shortHash(u.hash),
          when
            ? i18n('seen ${when}', { when })
            : i18n('not seen since this was set'),
        ].join(' · ')
        const current: Current = {
          hubOperator: trusted.includes(u.hash),
          hubBanned: banned.includes(u.hash),
          operator: roomsWhere(rooms, u.hash, 'operators'),
          voiced: roomsWhere(rooms, u.hash, 'voiced'),
          banned: roomsWhere(rooms, u.hash, 'bans'),
        }
        return [
          u.hash,
          {
            name: label,
            spec: InputSpec.of({
              identity: Value.hidden<string | null>(),
              ...permissionFields(roomNames, current),
            }),
          },
        ]
      }),
    )
    variants[MANUAL] = {
      name: i18n('Someone else (enter their identity hash)'),
      spec: InputSpec.of({
        identity: Value.text({
          name: i18n('Identity Hash'),
          description: i18n(
            'Their Reticulum identity hash: 32 hexadecimal characters. It is not their LXMF address. Any permissions they already have are replaced by the ones below.',
          ),
          required: true,
          default: null,
          patterns: [
            {
              regex: identityHashRegex,
              description: i18n('Must be 32 hexadecimal characters'),
            },
          ],
        }),
        ...permissionFields(roomNames, noPermissions),
      }),
    }

    return {
      name: i18n('User'),
      description: i18n(
        'People who have connected, most recent first. Someone who has not connected yet can be added by their identity hash.',
      ),
      default: users[0]?.hash ?? MANUAL,
      disabled: false,
      variants: Variants.of(variants),
    }
  }),
})

const setMember = (list: string[], hash: string, member: boolean) => {
  const rest = list.filter((h) => normalizeHash(h) !== hash)
  return member ? [...rest, hash] : rest
}

export const manageUser = sdk.Action.withInput(
  'manage-user',
  {
    name: i18n('Manage User Permissions'),
    description: i18n(
      'Make someone a hub or room operator, give them voice, or ban them. Pick a user to see and change what they can do.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },
  inputSpec,
  async () => null,
  async ({ effects, input }) => {
    const { selection, value } = input.user
    const hash = normalizeHash(
      selection === MANUAL ? (value.identity ?? '') : selection,
    )
    if (!new RegExp(identityHashRegex).test(hash)) {
      throw new Error(i18n('Must be 32 hexadecimal characters'))
    }

    const hub = await rrcdToml.read((c) => c.hub).once()
    await rrcdToml.merge(effects, {
      hub: {
        trusted_identities: setMember(
          hub?.trusted_identities ?? [],
          hash,
          value.hubOperator,
        ),
        banned_identities: setMember(
          hub?.banned_identities ?? [],
          hash,
          value.hubBanned,
        ),
      },
    })

    const rooms = (await roomsToml.read((r) => r.rooms).once()) ?? {}
    const updated = Object.fromEntries(
      Object.entries(rooms).map(([name, r]) => [
        name,
        {
          operators: setMember(
            r.operators,
            hash,
            value.operator.includes(name),
          ),
          voiced: setMember(r.voiced, hash, value.voiced.includes(name)),
          bans: setMember(r.bans, hash, value.banned.includes(name)),
        },
      ]),
    )
    if (Object.keys(updated).length) {
      await roomsToml.merge(effects, { rooms: updated })
    }
    await restartHub(effects)

    return {
      version: '1',
      title: i18n('Permissions Updated'),
      message: i18n(
        'Saved for ${who}. The hub restarts to apply them, and clients reconnect within a few seconds.',
        { who: shortHash(hash) },
      ),
      result: null,
    }
  },
)
