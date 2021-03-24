import { constants } from './constants.js'

const { JOIN_ROOM, MESSAGE } = constants.events.socket
const { MESSAGE_SENT, STATUS_UPDATED, ACTIVITY_LOG_UPDATE } = constants.events.app

export default class EventManager {
  #allUsers = new Map()

  constructor({ componentEmitter, socketClient }) {
    this.componentEmitter  = componentEmitter
    this.socketClient = socketClient
  }

  joinRoomAndWaitForMessage(data) {
    this.socketClient.sendMessage(JOIN_ROOM, data)

    this.componentEmitter.on(MESSAGE_SENT, msg => {
      this.socketClient.sendMessage(MESSAGE, msg)
    })
  }

  updateUsers(users) {
    const connectedUsers = users
    connectedUsers.forEach(({ id, userName }) => this.#allUsers.set(id, userName))
    this.#updateUsersComponent()
  }

  newUserConnected(message){
    const user = message
    this.#allUsers.set(user.id, user.userName)

    this.#updateUsersComponent()
    this.#updateActivityLogComponent(`${user.userName} joined`)
  }

  #updateActivityLogComponent(message) {
    this.componentEmitter.emit(
      ACTIVITY_LOG_UPDATE,
      message
    )
  }

  #updateUsersComponent() {
    this.componentEmitter.emit(
      STATUS_UPDATED,
      Array.from(this.#allUsers.values())
    )
  }

  getEvents() {
    const functions = Reflect.ownKeys(EventManager.prototype)
      .filter(fn => fn !== 'constructor')
      .map(name => [name, this[name].bind(this)])

    return new Map(functions)
  }
}
