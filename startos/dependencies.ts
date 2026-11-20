import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'

// Optional: each is a current dependency only while its switch in Network
// Connections is on. The hub then reaches that service's Reticulum TCP
// server over the StartOS bridge (main.ts).
export const dependencies = sdk.Dependencies.of()
  .addDependency(
    sdk.Dependency.optional('nomadnet', {
      description: i18n(
        "The hub connects to Nomad Network's Reticulum server to reach the networks it is connected to",
      ),
      metadata: {
        title: 'Nomad Network',
        icon: 'https://raw.githubusercontent.com/The-Cryptosquid/nomadnet-startos/24a7f59c4812824154fcb26bc2cf84dbd80f1b08/icon.png',
      },
      // The first release, which already serves Reticulum on host 'rns'.
      versionRange: '>=1.5.0:0',
      kind: 'running',
      healthChecks: [],
      enabled: async ({ effects }) =>
        !!(await storeJson.read((s) => s.nomadnet).const(effects)),
    }),
  )
  .addDependency(
    sdk.Dependency.optional('reticulum-meshchat', {
      description: i18n(
        "The hub connects to MeshChat's Reticulum server to reach the networks it is connected to",
      ),
      metadata: {
        title: 'MeshChat',
        icon: 'https://raw.githubusercontent.com/Start9-Community/reticulum-meshchat-startos/bad39ad8c479dc93bf7e75020a4be7806d5e532d/icon.png',
      },
      // 2.4.0:2 added MeshChat's Reticulum TCP Server interface.
      versionRange: '>=2.4.0:2',
      kind: 'running',
      healthChecks: [],
      enabled: async ({ effects }) =>
        !!(await storeJson.read((s) => s.meshchat).const(effects)),
    }),
  )
