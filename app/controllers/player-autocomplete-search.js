import Ember from 'ember'

const { run, isBlank } = Ember

export default Ember.Controller.extend(
{ actions:
    { search(term) {
        return new Ember.RSVP.Promise((resolve, reject) => {
          run.debounce(this, this._performSearch, term, resolve, reject, 600)
        })
      }
    , onSelect(player) {
        this.get('target').transitionToRoute('player', player.id)
      }
    }
  , _performSearch(term, resolve, reject) {
      if (isBlank(term)) return resolve([])

      this.store
        .query('player', { filter: { name: term } })
        .then(function (players) {
          resolve(players)
        })
        .catch(function (e) {
          console.error(e)
          reject(e)
        })
    }
})
