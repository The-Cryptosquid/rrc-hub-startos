import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const connection = z.looseObject({
  name: z.string().catch(''),
  host: z.string(),
  port: z.number().int().min(1).max(65535),
})

// Package-side settings rrcd has no place for: the Reticulum servers the hub
// connects out to, and whether to connect to Nomad Network and MeshChat on
// this server. main.ts renders them into the Reticulum config.
const shape = z.looseObject({
  connections: z.array(connection).catch([]),
  // Connect to these services on this server over the StartOS bridge.
  nomadnet: z.boolean().catch(false),
  meshchat: z.boolean().catch(false),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.startos, subpath: 'store.json' },
  shape,
)
