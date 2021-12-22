import {
  cr,
  isModuleActive,
  createModuleLink,
} from './license-builder.helpers.mjs'

const template = document.createElement('template')

// Hack for triggering Prettier formatting.
const html = (str) => str

template.innerHTML = html`
  <style>
    label {
      flex-grow: 1;
    }
    .module-row {
      position: relative;
      display: flex;
      gap: 1rem;
      align-items: center;
      width: 100%;
      flex-flow: row nowrap;
    }
    .help-text {
      position: absolute;
      top: 40px;
      padding: 1rem;
      z-index: 10;
      right: 0;
      background-color: white;
      width: 300px;
      min-height: 50px;
      box-shadow: 10px 16px 9px -9px rgba(0, 0, 0, 0.5);
    }
    svg {
      width: 24px;
      height: 24px;
    }
  </style>
`

/**
 * Purpose: This components presents one or more actions
 * for a given module.
 */
export class ModuleListItem extends HTMLElement {
  constructor() {
    super()

    this.root = this.attachShadow({ mode: 'open' })
    this.root.appendChild(template.content.cloneNode(true))
    // Build any non-changing HTML
    this.checkbox = cr('input')
    this.checkbox.type = 'checkbox'
    this.checkboxLabel = cr('label')
    this.findButton = cr('button')
    this.findButton.innerHTML = `<svg title="" xmlns="http://www.w3.org/2000/svg" class="" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>`

    this.infoButton = cr('button')
    this.infoButton.innerHTML = `<svg title="" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20">
    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
    </svg>`

    this.helpTextDiv = cr('div')
    this.helpTextDiv.classList.add('help-text')

    const moduleRow = cr('div')
    moduleRow.classList.add('module-row')

    moduleRow.appendChild(this.checkbox)
    moduleRow.appendChild(this.checkboxLabel)
    moduleRow.appendChild(this.findButton)
    moduleRow.appendChild(this.infoButton)
    moduleRow.appendChild(this.helpTextDiv)

    this.root.appendChild(moduleRow)

    // Internal state
    this.showHelpText = false

    // Bind this.
    this.render = this.render.bind(this)
    this.checkboxHandler = this.checkboxHandler.bind(this)
    this.findButtonHandler = this.findButtonHandler.bind(this)
    this.infoButtonHandler = this.infoButtonHandler.bind(this)
  }

  static get observedAttributes() {
    return ['mod-id']
  }

  attributeChangedCallback() {
    this.render()
  }

  render() {
    const modId = this.getAttribute('mod-id')
    const module = document.querySelector(`license-module[mod-id="${modId}"]`)
    if (!module) {
      alert(`ModuleTooltip could not find mod-id ${modId}`)
      return
    }
    const title = module.getAttribute('title')
    this.checkbox.id = `input-${modId}`

    this.helpTextDiv.innerHTML = `<p>${module.getAttribute('help-text')}</p>`
    this.helpTextDiv.style = this.showHelpText
      ? 'display: block;'
      : 'display: none;'

    this.checkbox.checked = isModuleActive({ id: modId })
    this.checkboxLabel.setAttribute('for', `input-${modId}`)
    this.checkboxLabel.innerText = title

    const findButtonTitle = `Find module text for module ${title}`
    this.findButton.title = findButtonTitle
    this.findButton.setAttribute('aria-label', findButtonTitle)

    const infoButtonTitle = `See helptext for module ${title}`
    this.infoButton.title = infoButtonTitle
    this.infoButton.setAttribute('aria-label', infoButtonTitle)
  }

  checkboxHandler(e) {
    const isChecked = e.target.checked
    const id = this.getAttribute('mod-id')
    const destination = isChecked
      ? createModuleLink({ addModule: id })
      : createModuleLink({ removeModule: id })
    history.replaceState(null, '', destination)
    this.render()
  }

  /**
   * Scrolls the relevant module into view, and
   * makes it visible if it's not visible already.
   */
  findButtonHandler(e) {
    const id = this.getAttribute('mod-id')
    if (isModuleActive({ id })) {
      location.hash = id
    } else {
      const linkWithModules = createModuleLink({ addModule: id })
      history.replaceState(null, '', `${linkWithModules}#${id}`)
      this.render()
    }
    // Find license-module and focus first child link
    const targetNode = document.querySelector(`#${id}`)
    if (targetNode) {
      targetNode.scrollIntoView()
      targetNode.focus()
    }
  }

  infoButtonHandler(e) {
    this.showHelpText = !this.showHelpText
    this.render()
    if (this.showHelpText) {
      this.helpTextDiv.focus()
    }
  }

  connectedCallback() {
    window.addEventListener('locationchange', this.render)
    this.checkbox.addEventListener('click', this.checkboxHandler)
    this.findButton.addEventListener('click', this.findButtonHandler)
    this.infoButton.addEventListener('click', this.infoButtonHandler)
  }

  disconnectedCallback() {
    window.removeEventListener('locationchange', this.render)
    this.checkbox.removeEventListener('click', this.checkboxHandler)
    this.findButton.removeEventListener('click', this.findButtonHandler)
    this.infoButton.removeEventListener('click', this.infoButtonHandler)
  }
}
