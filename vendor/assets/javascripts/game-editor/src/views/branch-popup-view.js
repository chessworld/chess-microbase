import jQuery from 'jquery'
import { Core, View } from 'seaturtle'

export const BranchPopupView = Core.makeClass('BranchPopupView', View.BaseView, (def) => {
  def.property('state');
  def.property('activeChoice');
  def.accessor('active');
  
  def.initializer(function(options) {
    if (options == null) { options = {}; }
    this.initWithElement(jQuery('<ul class="BranchPopupView" />'));
    this._state = options.state;
    this._choices = [];
    this._choices.push(this._state);
    this._activeChoice = 0;
    return Array.from(this._state.variations).map((variation) =>
      this._choices.push(variation));
  });
  
  def.method('_activeChoiceChanged', function(oldValue, newValue) {
    jQuery('li', this._element).eq(oldValue).removeClass('active');
    return jQuery('li', this._element).eq(newValue).addClass('active');
  });
  
  def.method('getActive', function() {
    return this._choices[this._activeChoice];
  });
  
  def.method('keyDown', function(key) {
    switch (key) {
      case View.BaseView.VK_UP:
        this.activeChoice(this._activeChoice <= 0 ?
          this._choices.length - 1
        :
          this._activeChoice - 1
        );
        return true;
      case View.BaseView.VK_DOWN:
        this.activeChoice(this._activeChoice >= (this._choices.length - 1) ?
          0
        :
          this._activeChoice + 1
        );
        return true;
      case View.BaseView.VK_RIGHT: case View.BaseView.VK_RETURN:
        this.trigger('chosen', this.active());
        return true;
      case View.BaseView.VK_LEFT: case View.BaseView.VK_ESCAPE:
        this.trigger('cancelled');
        return true;
    }
  });
  
  def.method('render', function() {
    this._choices.forEach((choice, i) => {
      const li = jQuery('<li />');
      li.html(choice.moveNumberAndShort());
      if (i < 1) { li.addClass('active'); }
      if (i >= (this._choices.length - 1)) { li.addClass('last'); }
      li.mouseover(() => {
        return this.activeChoice(i);
      });
      li.click(() => {
        this.activeChoice(i);
        return this.trigger('chosen', this.active());
      });
      this._element.append(li);
    })
  })
})
