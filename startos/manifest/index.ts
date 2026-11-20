import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'rrc-hub',
  title: 'RRC Hub: Reticulum Community Channels',
  license: 'MIT',
  packageRepo: 'https://github.com/The-Cryptosquid/rrc-hub-startos',
  upstreamRepo: 'https://github.com/kc1awv/rrcd',
  marketingUrl: 'https://rrc.kc1awv.net/',
  donationUrl: null,
  description: { short, long },
  // main: rrcd's files, the hub identity and its Reticulum config.
  // startos: package settings no subcontainer reads.
  volumes: ['main', 'startos'],
  images: {
    rrcd: {
      source: {
        dockerBuild: {
          dockerfile: 'Dockerfile',
          workdir: '.',
        },
      },
      arch: ['x86_64', 'aarch64'],
      emulateMissing: false,
    },
  },
})
