import jQuery from 'jquery'
import { Core, View } from 'seaturtle'

export const CommentView = Core.makeClass('CommentView', View.BaseView, (def) => {
  def.property('readOnly');
  def.property('state');
  def.property('size');
  def.property('beforeComments');
  
  def.initializer(function(options) {
    if (options == null) { options = {}; }
    this.super();
    this._element.addClass('game-comments');      
    this._state = options.state;
    this._readOnly = options.readOnly;
    return this._beforeComments = options.beforeComments !== false;
  });

  def.method('_readOnlyChanged', function(oldvalue, newvalue) {
    if (this._loaded && (oldvalue !== newvalue)) { return this.render(); }
  });
  
  def.method('_stateChanged', function(oldvalue, newvalue) {
    return this.update();
  });

  def.method('afterChanged', function() {
    const val = jQuery.trim(this._afterField.val());
    if (this._state.comment !== val) {
      this._state.comment = val;
      if (val === '') { this._state.comment = null; }
      return this.trigger('changed');
    }
  });

  def.method('beforeChanged', function() {
    const val = jQuery.trim(this._beforeField.val());
    if (this._state.beforeComment !== val) {
      this._state.beforeComment = val;
      if (val === '') { this._state.beforeComment = null; }
      return this.trigger('changed');
    }
  });
  
  def.method('render', function() {
    this._element.empty();
    if (this._readOnly) {
      this._beforeField = this.helper().tag('div');
      this._afterField = this.helper().tag('div');
    } else {
      this._beforeField = this.helper().tag('textarea');
      this._afterField = this.helper().tag('textarea'); 
      this._beforeField.on('changed keyup', this.method('beforeChanged'));
      this._afterField.on('changed keyup', this.method('afterChanged'));
      this._beforeField.keydown(e => e.stopPropagation());
      this._afterField.keydown(e => e.stopPropagation());
    }
    this._beforeField.addClass('game-comment-before');
    this._afterField.addClass('game-comment-after');
    this.update();
    this.updateSize();
    return this._element.append(this._beforeField, this._afterField);
  });
  
  def.method('setSize', function(size) {
    this._size = size;
    return this.updateSize();
  });
  
  def.method('update', function() {
    if (this._loaded) {
      if (this._state.mainline) {
        if (this._readOnly) {
          this._beforeField.text(this._state.beforeComment);
        } else {
          this._beforeField.val(this._state.beforeComment);
        }
        if (this._beforeComments) { this._beforeField.show(); }
      } else {
        this._beforeField.hide();
      }
      if (this._readOnly) {
        return this._afterField.text(this._state.comment || '');
      } else {
        return this._afterField.val(this._state.comment);
      }
    }
  });
  
  def.method('updateSize', function() {
    if (this._beforeField) { this._beforeField.css('width', this._size - 10); }
    if (this._afterField) { return this._afterField.css('width', this._size - 10); }
  });
});
