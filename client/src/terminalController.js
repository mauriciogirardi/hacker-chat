import ComponentsBuilder from './components.js'
import { constants } from './constants.js'

const {
  MESSAGE_RECEIVED,
  ACTIVITYLOG_UPDATE,
  STATUS_UPDATED,
  MESSAGE_SEND
} = constants.events.app

export default class TerminalController {
  #usersColors = new Map()

  constructor() { }

  #pickColor() {
    return `#${((1 << 24) * Math.random() | 0).toString(16)}-fg`
  }

  #getUserColor(userName) {
    if (this.#usersColors.has(userName))
      return this.#usersColors.get(userName)

    const color = this.#pickColor()
    this.#usersColors.set(userName, color)

    return color
  }

  #onInputReceived(eventEmitter) {
    return function () {
      const message = this.getValue()
      eventEmitter.emit(MESSAGE_SEND, message)
      this.clearValue()
    }
  }

  #onMessageReceived({ screen, chat }) {
    return msg => {
      const { userName, message } = msg
      const color = this.#getUserColor(userName)

      chat.addItem(`${color}{bold}${userName}{/}: ${message}`)

      screen.render()
    }
  }

  #onLogChanged({ screen, activityLog }) {
    return msg => {
      const [userName] = msg.split(/\s/)
      const color = this.#getUserColor(userName)

      activityLog.addItem(`{${color}}{bold}${msg.toString()}{/}`)

      screen.render()
    }
  }

  #onStatusChanged({ screen, status }) {
    return users => {
      const { content } = status.items.shift()

      status.clearItems()
      status.addItem(content)

      users.forEach(userName => {
        const color = this.#getUserColor(userName)
        status.addItem(`{${color}}{bold}${userName}{/}`)
      })

      screen.render()
    }
  }

  #registerEvents(eventEmitter, components) {
    eventEmitter.on(
      MESSAGE_RECEIVED,
      this.#onMessageReceived(components)
    )

    eventEmitter.on(
      ACTIVITYLOG_UPDATE,
      this.#onLogChanged(components)
    )

    eventEmitter.on(
      STATUS_UPDATED,
      this.#onStatusChanged(components)
    )
  }

  async initializeTable(eventEmitter) {
    const components = new ComponentsBuilder()
      .setScreen({ title: 'Mauricio Girardi ' })
      .setLayoutComponent()
      .setInputComponent(this.#onInputReceived(eventEmitter))
      .setChatComponent()
      .setActivityLogComponent()
      .setStatusComponent()
      .build()

    this.#registerEvents(eventEmitter, components)

    components.input.focus()
    components.screen.render()

  }
}