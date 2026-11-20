import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const user = z.looseObject({
  nick: z.string().optional().catch(undefined),
  first_seen: z.number().catch(0),
  last_seen: z.number().catch(0),
})

// Written by rrcd (patch 0001) each time a client connects: full identity
// hash -> last nickname and when it was seen. Read-only for the package.
const shape = z.looseObject({
  users: z.record(z.string(), user).catch({}),
})

export const seenUsersJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'rrcd/seen_users.json' },
  shape,
)
