import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

// rrcd's room registry. Shared with rrcd, which rewrites a room's entry when
// an operator changes it from a chat client, so every key it does not need to
// know about is kept (looseObject) and every known key keeps rrcd's defaults.
export const roomShape = z.looseObject({
  founder: z.string().optional().catch(undefined),
  topic: z.string().optional().catch(undefined),
  key: z.string().optional().catch(undefined),
  moderated: z.boolean().catch(false),
  invite_only: z.boolean().catch(false),
  topic_ops_only: z.boolean().catch(false),
  no_outside_msgs: z.boolean().catch(false),
  private: z.boolean().catch(false),
  operators: z.array(z.string()).catch([]),
  voiced: z.array(z.string()).catch([]),
  bans: z.array(z.string()).catch([]),
})
export type Room = z.infer<typeof roomShape>

const shape = z.looseObject({
  rooms: z.record(z.string(), roomShape).catch({}),
})

export const roomsToml = FileHelper.toml(
  { base: sdk.volumes.main, subpath: 'rrcd/rooms.toml' },
  shape,
)
