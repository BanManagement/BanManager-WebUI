import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('breadcrumb', 'Integration | Component | breadcrumb', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{breadcrumb}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#breadcrumb}}
      template block text
    {{/breadcrumb}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
