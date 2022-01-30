import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { Responsive, WidthProvider } from 'react-grid-layout'
const GridLayout = WidthProvider(Responsive)

function innerHeight (el) {
  let height = el.clientHeight
  const style = window.getComputedStyle(el)

  height -= (parseInt(style.paddingTop) + parseInt(style.paddingBottom) + parseInt(style.borderTopWidth) + parseInt(style.borderBottomWidth))
  return height
}

function getY (transform) {
  return transform.replace('translate(', '').replace(')', '').replace(/\p\x/g, '').split(',')[1].trim()
}

/**
 * A class for displaying an item in a grid
 * Designed to be wrapped in a function, similar to a higher-order component. Otherwise
 * the layout will render incorrectly
 */
class ResponsiveGridLayout extends Component {
  constructor (props) {
    super(props)
    this.relayoutChildren = this.relayoutChildren.bind(this)
  }

  componentDidUpdate (prevProps) {
    this.relayoutChildren()
  }

  componentDidMount () {
    this.relayoutChildren()
    window.addEventListener('resize', this.relayoutChildren)
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.relayoutChildren)
  }

  /**
   * Iterate over children and trigger a relayout event
   */
  relayoutChildren () {
    function flattenReactChildrenToArray (nodeChildren, accumulated = []) {
      React.Children.forEach(nodeChildren, (childNode) => {
        accumulated.push(childNode)
        if (childNode && childNode.props && childNode.props.children) {
          flattenReactChildrenToArray(childNode.props.children, accumulated)
        }
      })
      return accumulated
    }

    // Relayout after a time period so that the rest of the layout can render properly
    window.setTimeout(() => {
      // eslint-disable-next-line react/no-find-dom-node
      const rootNode = ReactDOM.findDOMNode(this)

      const flat = flattenReactChildrenToArray(this.props.children)
      const heights = flat
        .map(this.recalculateChild.bind(this))
        .filter(p => p !== null)
        .reduce((prev, current) => {
          if (!prev[current.y]) return { ...prev, [current.y]: current.height }
          if (prev[current.y] < current.height) return { ...prev, [current.y]: current.height }

          return prev
        }, {})

      rootNode.style.height = Object.values(heights).reduce((a, b) => a + b, 0) + 'px'

      const translations = {}
      const entries = Object.entries(heights)
      const values = [parseInt(Object.keys(heights)[0], 10), ...Object.values(heights)]

      entries.forEach(([key, _], index) => {
        let y = 0

        for (let i = index; i >= 0; i--) {
          y += values[i]
        }

        translations[key] = y
      })

      flat.map(child => this.translateChild(rootNode, translations, child))
    }, 50)
  }

  translateChild (rootNode, translations, child) {
    for (let i = 0; i < rootNode.children.length; i++) {
      if (rootNode.children[i].getAttribute('i') === child.props.i) {
        const elem = rootNode.children[i]
        const y = getY(elem.style.transform)

        if (!translations[y]) return

        elem.style.transform = elem.style.transform.replace(`${y}px)`, `${translations[y]}px)`)
        break
      }
    }
  }

  recalculateChild (child) {
    if (!child.props.i) return null

    // eslint-disable-next-line react/no-find-dom-node
    const rootNode = ReactDOM.findDOMNode(this)
    let elem

    for (let i = 0; i < rootNode.children.length; i++) {
      if (rootNode.children[i].getAttribute('i') === child.props.i) {
        elem = rootNode.children[i]
        break
      }
    }

    elem.style.removeProperty('height')

    const height = innerHeight(elem)

    elem.style.height = height + 'px'

    return { y: getY(elem.style.transform), height }
  }

  render () {
    return <GridLayout {...this.props}>{this.props.children}</GridLayout>
  }
}

export default ResponsiveGridLayout
