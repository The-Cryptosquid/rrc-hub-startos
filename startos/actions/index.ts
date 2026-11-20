import { sdk } from '../sdk'
import { createRoom } from './createRoom'
import { deleteRoom } from './deleteRoom'
import { editRoom } from './editRoom'
import { hubInfo } from './hubInfo'
import { hubSettings } from './hubSettings'
import { manageUser } from './manageUser'
import { networkConnections } from './networkConnections'

export const actions = sdk.Actions.of()
  .addAction(hubInfo)
  .addAction(manageUser)
  .addAction(createRoom)
  .addAction(editRoom)
  .addAction(deleteRoom)
  .addAction(hubSettings)
  .addAction(networkConnections)
