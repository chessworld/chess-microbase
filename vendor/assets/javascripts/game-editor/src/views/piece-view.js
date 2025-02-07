import { Core, View } from 'seaturtle'

import { makePieceElement } from '../util/make-piece-element'

export const PieceView = Core.makeClass('PieceView', View.BaseView, (def) => {
  def.property('piece');
  def.property('position');
  def.property('flipped');
  def.property('moving');
  def.property('taken');
  def.property('size');

  def.initializer(function(data) {
    if (data == null) { data = {}; }
    this.super();

    this.piece(data.piece);
    this.position(data.position);
    this.taken(!!data.taken);
    this.size(data.size || 32);
    this.flipped(data.flipped);

    this.updatePiece();
    this.updatePosition();
    this.updateTaken();
  });

  def.method('_flippedChanged', function(oldValue, newValue) {
    return this.updatePosition();
  });

  def.method('_movingChanged', function(oldValue, moving) {
    if (moving) {
      return this._element.addClass('moving');
    } else {
      return this._element.removeClass('moving');
    }
  });

  def.method('positionCss', function() {
    let css;
    return css = this._flipped ?
      {
        left: (12.5 * (7 - this._position.x)) + '%',
        top:  (12.5 * (7 - this._position.y)) + '%'
      }
    :
      {
        left: (12.5 * this._position.x) + '%',
        top:  (12.5 * this._position.y) + '%'
      };
});

  def.method('setSize', function(size) {
    this._size = size;
    return this.updatePiece();
  });

  def.method('updatePiece', function() {
    return makePieceElement(this._element, this._piece.type, this._piece.color, this._size);
  });

  def.method('updatePosition', function(animate) {
    if (animate == null) { animate = 0; }
    if (animate) {
      return this._element.animate(this.positionCss(), animate);
    } else {
      return this._element.css(this.positionCss());
    }
  });

  def.method('updateTaken', function(animate) {
    if (animate == null) { animate = 0; }
    if (animate) {
      if (this._taken) {
        return this._element.fadeOut(animate);
      } else {
        return this._element.fadeIn(animate);
      }
    } else {
      if (this._taken) {
        return this._element.hide();
      } else {
        return this._element.show();
      }
    }
  });
});
