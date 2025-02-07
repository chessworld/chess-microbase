import jQuery from 'jquery'
import { Core, View } from 'seaturtle'

import { MOVE_HEIGHT } from '../constants'

export const MoveView = Core.makeClass('MoveView', View.BaseView, (def) => {  
  def.property('state');
  def.property('color');
  def.property('comments');
  def.property('masked');
  
  def.initializer(function(options) {
    if (options == null) { options = {}; }
    this._state = options.state;
    this._comments = options.comments;
    this._masked = options.masked || false;
    this._color = (this._state.ply % 2) === 1 ? 'white' : 'black';
    this.initWithElement(jQuery(`<div class=\"MoveView ${this._color}\" />`));
    this.updateComment();
    this.updateMarkedup();
  });
  
  def.method('_maskedChanged', function(oldValue, newValue) {
    if (oldValue !== newValue) { return this.updateText(); }
  });
  
  def.method('render', function() {
    this._aTag = this.helper().linkTag('', () => {
      return this.trigger('jump', this._state);
    }); 
    this._aTag.appendTo(this._element);
    return this.updateText();
  });
  
  def.method('setComments', function(value) {
    this._comments = value;
    return this.updateComment();
  });
  
  def.method('updateComment', function() {
    return this._element.toggleClass('commented-move', !!(this._comments && this._state.hasComments()));
  });

  def.method('updateMarkedup', function() {
    return this._element.toggleClass('markedup-move', !!this._state.markup);
  });
  
  def.method('updateText', function() {
    if (this._aTag) {
      if (this._masked) {
        return this._aTag.text('(...)');
      } else {
        let s = '';
        if ((this._state.ply % 2) === 1) { s += ((this._state.ply + 1) / 2) + '. '; }
        s += this._state.move.toShort();
        this._aTag.text(s);
        if (this._state.move.annotation) {
          return this._aTag.append(`<span class="${this._state.move.annotationClass()} annotation">${this._state.move.convertAnnotation('HTML')}</span>`);
        }
      }
    }
  });
  
  def.method('scrollTo', function(within) {
    const scrollY = within[0].scrollTop;
    const y = this._element.position().top + scrollY;
    const scrollHeight = within.height();
    const minScrollY = y;
    let maxScrollY = (y + MOVE_HEIGHT) - scrollHeight;

    // Try to scroll to just under half way
    maxScrollY += (scrollHeight / 2) - MOVE_HEIGHT;
    
    const newScrollY = Math.max(Math.min(scrollY, minScrollY), maxScrollY);
    return within[0].scrollTop = newScrollY;
  });
  
  def.method('collapseAround', function() {
    const parent = this.parent();
    parent.collapseVariations();
    if (parent.collapseOutside) { return parent.collapseOutside(); }
  });
  
  def.method('displayNumber', function() {
    const move = Math.floor(this._state.ply / 2) + 1;
    if ((this._state.ply % 2) === 1) {
      return `${move}.`;
    } else {
      return `${move}...`;
    }
  });
  
  def.method('maskAround', function() {
    this.parent().maskOrigin();
    return this.parent().maskAt(this.parent().moveAfter(this));
  });
});
