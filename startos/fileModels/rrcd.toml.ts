import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { defaultAnnounceInterval, paths } from '../utils'

// rrcd's own config. The package owns the paths and fixes the settings below
// with literals; actions change the rest. rrcd itself also writes
// banned_identities here when an operator uses /kline in a chat client.
const hubShape = z.looseObject({
  configdir: z.literal(paths.rnsDir).catch(paths.rnsDir),
  identity_path: z.literal(paths.identity).catch(paths.identity),
  room_registry_path: z.literal(paths.rooms).catch(paths.rooms),
  seen_users_path: z.literal(paths.seenUsers).catch(paths.seenUsers),
  announce_on_start: z.literal(true).catch(true),
  announce_period_s: z
    .number()
    .positive()
    .catch(Number(defaultAnnounceInterval)),
  hub_name: z.string().catch('RRC Hub'),
  greeting: z.string().catch(''),
  // Rooms the operator creates are never pruned for inactivity.
  room_registry_prune_after_s: z.literal(0).catch(0),
  allow_unregistered_rooms: z.boolean().catch(false),
  trusted_identities: z.array(z.string()).catch([]),
  banned_identities: z.array(z.string()).catch([]),
})

const loggingShape = z.looseObject({
  level: z.string().catch('INFO'),
  rns_level: z.string().catch('WARNING'),
  console: z.literal(true).catch(true),
  file: z.literal('').catch(''),
})

const shape = z.looseObject({
  hub: hubShape.catch(() => hubShape.parse({})),
  logging: loggingShape.catch(() => loggingShape.parse({})),
})

export const rrcdToml = FileHelper.toml(
  { base: sdk.volumes.main, subpath: 'rrcd/rrcd.toml' },
  shape,
)
