import { rnsConfig } from './fileModels/hubFiles'
import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  Connection,
  LocalServer,
  localServers,
  mainMounts,
  paths,
  renderRnsConfig,
  rnsPort,
  splitAddress,
} from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting RRC Hub!'))

  // Re-runs (restarting the hub) whenever Network Connections changes, and
  // when a local service it should connect to is installed, removed or moves.
  const connections: Connection[] =
    (await storeJson.read((s) => s.connections).const(effects)) ?? []

  const connected: string[] = []
  const missing: string[] = []
  for (const id of Object.keys(localServers) as LocalServer[]) {
    const enabled = await storeJson.read((s) => s[id]).const(effects)
    if (!enabled) continue
    const server = localServers[id]
    const address = await sdk.host
      .getBridgeAddress(effects, {
        packageId: server.packageId,
        hostId: server.hostId,
        internalPort: server.internalPort,
      })
      .const()
    if (address) {
      connections.push({ name: server.name, ...splitAddress(address) })
      connected.push(server.name)
    } else {
      missing.push(server.name)
    }
  }
  await rnsConfig.write(effects, renderRnsConfig(connections))

  const sub = await sdk.SubContainer.of(
    effects,
    { imageId: 'rrcd' },
    mainMounts(),
    'rrcd-sub',
  )

  const daemons = sdk.Daemons.of(effects)
    .addOneshot('prepare', {
      subcontainer: sub,
      exec: { command: ['rrc-hub-prepare'] },
      requires: [],
    })
    .addDaemon('rrcd', {
      subcontainer: sub,
      // rrcd checks for its identity and room registry at the command-line
      // paths (default ~/.rrcd) before it reads the config, and exits after
      // creating any it cannot find, so all three are passed here.
      exec: {
        command: [
          'rrcd',
          '--config',
          paths.config,
          '--identity',
          paths.identity,
          '--room-registry',
          paths.rooms,
        ],
      },
      ready: {
        display: i18n('Reticulum TCP Server'),
        gracePeriod: 30_000,
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, rnsPort, {
            successMessage: i18n(
              'The hub is running and accepting Reticulum connections on port 4242',
            ),
            errorMessage: i18n(
              'The hub is not accepting connections yet. Check the logs if this persists.',
            ),
          }),
      },
      requires: ['prepare'],
    })

  if (!connected.length && !missing.length) return daemons

  // What the switches resolved to is fixed until main runs again, so report
  // it once.
  return daemons.addHealthCheck('local-servers', {
    ready: {
      display: i18n('Services on This Server'),
      gracePeriod: 0,
      trigger: sdk.trigger.onceTrigger,
      fn: async () =>
        missing.length
          ? {
              result: 'failure',
              message: i18n(
                'Not installed: ${names}. Install it, or turn its switch off in Network Connections.',
                { names: missing.join(', ') },
              ),
            }
          : {
              result: 'success',
              message: i18n('Connected to ${names}', {
                names: connected.join(', '),
              }),
            },
    },
    requires: [],
  })
})
