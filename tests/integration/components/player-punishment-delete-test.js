import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('player-punishment-delete', 'Integration | Component | player punishment delete', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{player-punishment-delete}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#player-punishment-delete}}
      template block text
    {{/player-punishment-delete}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
