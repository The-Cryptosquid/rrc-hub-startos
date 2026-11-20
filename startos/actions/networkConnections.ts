import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value, List } = sdk

const inputSpec = InputSpec.of({
  nomadnet: Value.toggle({
    name: i18n('Connect to Nomad Network on This Server'),
    description: i18n(
      'Share the Reticulum connections of the Nomad Network service installed on this server. Requires Nomad Network to be installed and running.',
    ),
    default: false,
  }),
  meshchat: Value.toggle({
    name: i18n('Connect to MeshChat on This Server'),
    description: i18n(
      'Share the Reticulum connections of the MeshChat service installed on this server. Requires MeshChat to be installed and running, with a TCP Server Interface on port 4242 added in MeshChat.',
    ),
    default: false,
  }),
  connections: Value.list(
    List.obj(
      {
        name: i18n('Reticulum Servers'),
        description: i18n(
          'Other servers the hub connects out to, so people anywhere on those networks can reach it. Without any connection, only devices that connect to this hub directly can use it.',
        ),
        default: [],
      },
      {
        spec: InputSpec.of({
          name: Value.text({
            name: i18n('Name'),
            description: i18n('A label for this connection'),
            required: false,
            default: null,
            maxLength: 64,
            patterns: [
              {
                regex: '^[^\\[\\]]*$',
                description: i18n('Square brackets are not allowed'),
              },
            ],
          }),
          host: Value.text({
            name: i18n('Host'),
            description: i18n(
              'Hostname or IP address of a Reticulum TCP server, such as a public transport node or Nomad Network on this server',
            ),
            required: true,
            default: null,
            placeholder: 'reticulum.example.com',
            patterns: [
              {
                regex: '^[A-Za-z0-9.:\\-]+$',
                description: i18n('Must be a hostname or IP address'),
              },
            ],
          }),
          port: Value.number({
            name: i18n('Port'),
            required: true,
            default: 4242,
            min: 1,
            max: 65535,
            step: 1,
            integer: true,
          }),
        }),
        displayAs: '{{name}} {{host}}:{{port}}',
        uniqueBy: { all: ['host', 'port'] },
      },
    ),
  ),
})

export const networkConnections = sdk.Action.withInput(
  'network-connections',
  {
    name: i18n('Network Connections'),
    description: i18n(
      'Choose the Reticulum servers the hub connects to. The hub restarts to apply changes.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },
  inputSpec,
  async () => {
    const store = await storeJson.read().once()
    return {
      nomadnet: store?.nomadnet ?? false,
      meshchat: store?.meshchat ?? false,
      connections: (store?.connections ?? []).map((c) => ({
        name: c.name || null,
        host: c.host,
        port: c.port,
      })),
    }
  },
  // main.ts reads these reactively, so writing them restarts the hub.
  async ({ effects, input }) => {
    await storeJson.merge(effects, {
      nomadnet: input.nomadnet,
      meshchat: input.meshchat,
      connections: input.connections.map((c) => ({
        name: c.name?.trim() ?? '',
        host: c.host.trim(),
        port: c.port,
      })),
    })
  },
)
