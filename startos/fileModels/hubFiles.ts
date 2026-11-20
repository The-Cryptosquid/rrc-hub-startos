import { FileHelper } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

// The hub's Reticulum config. main.ts renders it whole from store.json.
export const rnsConfig = FileHelper.string({
  base: sdk.volumes.main,
  subpath: 'rns/config',
})

// Written by rrc-hub-prepare on every start: the hub's RRC address.
export const hubAddress = FileHelper.string({
  base: sdk.volumes.main,
  subpath: 'rrcd/hub_address',
})
