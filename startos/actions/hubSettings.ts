import { rrcdToml } from '../fileModels/rrcd.toml'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  announceIntervals,
  defaultAnnounceInterval,
  restartHub,
  toAnnounceInterval,
} from '../utils'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  hub_name: Value.text({
    name: i18n('Hub Name'),
    description: i18n('The name clients show for this hub'),
    required: true,
    default: 'RRC Hub',
    minLength: 1,
    maxLength: 64,
  }),
  greeting: Value.textarea({
    name: i18n('Greeting'),
    description: i18n(
      'A message shown to everyone who connects. Leave empty for none.',
    ),
    required: false,
    default: null,
    maxLength: 1000,
  }),
  only_my_rooms: Value.toggle({
    name: i18n('Only Allow Rooms I Create'),
    description: i18n(
      'When on, people can join only the rooms made with Create Room. When off, anyone can open a temporary room by joining a name that does not exist; it disappears when empty. Hub operators can always open rooms.',
    ),
    default: true,
  }),
  announce_interval: Value.select({
    name: i18n('Announce Interval'),
    description: i18n(
      'How often the hub announces itself on the Reticulum network so clients can find it. Shorter is found faster but sends more traffic.',
    ),
    default: defaultAnnounceInterval,
    values: announceIntervals,
  }),
})

export const hubSettings = sdk.Action.withInput(
  'hub-settings',
  {
    name: i18n('Hub Settings'),
    description: i18n(
      "The hub's name, greeting, who can open rooms, and how often it announces itself",
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },
  inputSpec,
  async () => {
    const hub = await rrcdToml.read((c) => c.hub).once()
    if (!hub) return null
    return {
      hub_name: hub.hub_name,
      greeting: hub.greeting || null,
      only_my_rooms: !hub.allow_unregistered_rooms,
      announce_interval: toAnnounceInterval(hub.announce_period_s),
    }
  },
  async ({ effects, input }) => {
    await rrcdToml.merge(effects, {
      hub: {
        hub_name: input.hub_name.trim(),
        greeting: input.greeting?.trim() ?? '',
        allow_unregistered_rooms: !input.only_my_rooms,
        announce_period_s: Number(input.announce_interval),
      },
    })
    await restartHub(effects)
  },
)
