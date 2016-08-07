import Ember from 'ember'

export default Ember.Component.extend(
{ classNames: [ 'isotope' ]
, items: []
, _destroyIsotope() {
    if (this.$() && this.get('_initialisedIsotope')) {
      this.$().isotope('destroy')
      this.set('_initialisedIsotope', false)
    }
  }
, _initialiseIsotope() {
    Ember.run.scheduleOnce('afterRender', this, function () {
      if (this.$()) {
        this.$().isotope(
          { itemSelector: '.item'
          , masonry:
            { gutter: 25
            }
          , layout: 'masonry'
          })

        this.set('_initialisedIsotope', true)

        this.$().imagesLoaded(function () {
          this._reloadLayout()
        }.bind(this))

        this.sendAction('onLoaded')
        this.sendAction('onDrawn')
      }
    })
  }
, _reloadLayout() {
    Ember.run.scheduleOnce('afterRender', this, function () {
      if (Ember.isBlank(this.$())) return

      var api = this.$().data('isotope')

      if (api) {
        api.reloadItems()
        // disable transition
        var transitionDuration = api.options.transitionDuration

        api.options.transitionDuration = 0
        api.layout()
        // reset transition
        api.options.transitionDuration = transitionDuration

        this.sendAction('onDrawn')
      }
    })
  }
, didInsertElement: function () {
    this._super()

    this._initialiseIsotope()
  }
, willDestroyElement() {
    this._super()
    this._destroyIsotope()
  }
, itemsDidChange: function () {
    Ember.run.scheduleOnce('afterRender', this, function () {
      this._reloadLayout()
      if (!this.$()) return

      this.$().imagesLoaded(function () {
        this._reloadMasonryLayout()
      }.bind(this))
    })
  }.observes('items.length')
})
