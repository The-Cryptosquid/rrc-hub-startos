import { sdk } from './sdk'

// main holds the hub identity (its address), rooms, permissions and settings;
// startos holds the network connections.
export const { createBackup, restoreInit } = sdk.setupBackups(
  async ({ effects }) => sdk.Backups.ofVolumes('main', 'startos'),
)
