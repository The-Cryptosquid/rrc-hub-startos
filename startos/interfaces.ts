import { i18n } from './i18n'
import { sdk } from './sdk'
import { rnsPort } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const rnsOrigin = await sdk.MultiHost.of(effects, 'rns').bindPort(rnsPort, {
    protocol: null,
    addSsl: null,
    preferredExternalPort: rnsPort,
    secure: { ssl: false },
  })
  const rns = sdk.createInterface(effects, {
    name: i18n('Reticulum TCP Server'),
    id: 'rns',
    description: i18n(
      'Phones and computers can connect to the hub directly by adding a TCP Client Interface with this address',
    ),
    type: 'p2p',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })
  return [await rnsOrigin.export([rns])]
})
