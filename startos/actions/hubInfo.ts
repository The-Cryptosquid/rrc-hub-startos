import { hubAddress } from '../fileModels/hubFiles'
import { roomsToml } from '../fileModels/rooms.toml'
import { rrcdToml } from '../fileModels/rrcd.toml'
import { seenUsersJson } from '../fileModels/seenUsers.json'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  formatTime,
  knownUsers,
  LocalServer,
  localServers,
  normalizeHash,
} from '../utils'

export const hubInfo = sdk.Action.withoutInput(
  'hub-info',
  {
    name: i18n('Hub Info'),
    description: i18n(
      "The hub's address for joining, its rooms, operators and recent users",
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },
  async () => {
    const address = (await hubAddress.read().once())?.trim()
    const hub = await rrcdToml.read((c) => c.hub).once()
    const rooms = (await roomsToml.read((r) => r.rooms).once()) ?? {}
    const seen = (await seenUsersJson.read((s) => s.users).once()) ?? {}
    const store = await storeJson.read().once()
    const connectionLines = [
      ...(Object.keys(localServers) as LocalServer[])
        .filter((id) => store?.[id])
        .map((id) =>
          i18n('${name} on this server', { name: localServers[id].name }),
        ),
      ...(store?.connections ?? []).map(
        (c) => `${c.name ? `${c.name}: ` : ''}${c.host}:${c.port}`,
      ),
    ]

    const nickOf = (hash: string) => seen[hash]?.nick
    const who = (hash: string) => {
      const h = normalizeHash(hash)
      const nick = nickOf(h)
      return nick ? `${nick} (${h})` : h
    }

    const roomLines = Object.entries(rooms)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, r]) => {
        const flags = [
          r.key ? i18n('key') : null,
          r.private ? i18n('hidden') : null,
          r.invite_only ? i18n('invite only') : null,
          r.moderated ? i18n('moderated') : null,
        ].filter(Boolean)
        const ops = r.operators.map(
          (h) => nickOf(normalizeHash(h)) ?? h.slice(0, 12),
        )
        return [
          `${name}${flags.length ? ` [${flags.join(', ')}]` : ''}${r.topic ? ` — ${r.topic}` : ''}`,
          ops.length ? `    ${i18n('operators')}: ${ops.join(', ')}` : null,
        ]
          .filter(Boolean)
          .join('\n')
      })

    const operators = (hub?.trusted_identities ?? []).map(who)
    const recent = knownUsers(seen, [], 20)
      .filter((u) => u.last_seen > 0)
      .map((u) => `${formatTime(u.last_seen)}  ${u.nick ?? '-'}  ${u.hash}`)

    const none = i18n('None')
    return {
      version: '1',
      title: i18n('Hub Info'),
      message: address
        ? i18n(
            'People join by adding this hub address in their RRC client (in Ratspeak: Channels). Their device must reach the hub through a shared Reticulum server or by connecting to it directly.',
          )
        : i18n(
            'The hub has not started yet, so it has no address. Start the service and run this again.',
          ),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Hub Address'),
            description: hub?.hub_name ?? null,
            value: address || i18n('Not created yet'),
            copyable: !!address,
            qr: !!address,
            masked: false,
            launchable: false,
          },
          {
            type: 'multiline',
            name: i18n('Rooms'),
            description: null,
            value: roomLines.join('\n') || none,
            copyable: false,
            qr: false,
            masked: false,
            filename: null,
          },
          {
            type: 'multiline',
            name: i18n('Hub Operators'),
            description: null,
            value: operators.join('\n') || none,
            copyable: true,
            qr: false,
            masked: false,
            filename: null,
          },
          {
            type: 'multiline',
            name: i18n('Recent Users'),
            description: i18n(
              'Last 20 to connect (UTC), with their identity hash',
            ),
            value: recent.join('\n') || none,
            copyable: true,
            qr: false,
            masked: false,
            filename: null,
          },
          {
            type: 'multiline',
            name: i18n('Network Connections'),
            description: null,
            value: connectionLines.join('\n') || none,
            copyable: false,
            qr: false,
            masked: false,
            filename: null,
          },
        ],
      },
    }
  },
)
