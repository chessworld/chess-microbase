import jQuery from 'jquery'
import { Core, View } from 'seaturtle'

import { makePieceElement } from '../util/make-piece-element'

export const PawnPromotionView = Core.makeClass('PawnPromotionView', View.BaseView, (def) => {
  def.property('pieceSize');
  def.property('selectedType');
  def.property('color');
  def.property('position');

  def.initializer(function(options) {
    if (options == null) { options = {}; }
    this.super();
    this._pieceSize     = options.pieceSize;
    this._selectedType  = options.selectedType;
    this._color         = options.color;
    this._position      = options.position;
  });

  def.method('render', function() {
    const tailbg = jQuery('<div class="tail tailbg" />');
    const tailfg = jQuery('<div class="tail tailfg" />');
    const tails = jQuery([tailbg[0], tailfg[0]]);
    this._element.append(
      jQuery('<div class="wrapper">').append(
        this.renderChoice('q'),
        this.renderChoice('n'),
        this.renderChoice('r'),
        this.renderChoice('b')
      ),
      tailbg, tailfg
    );
    this._element.addClass(this.verticalPositionClass());

    // Position relatively close to piece
    this._element.css('left', this.horizontalPosition());
    return tails.css('left', this.tailPosition());
  });

  def.method('horizontalPosition', function() {
    const range = (this.pieceSize() * 8) - 248;
    return (range * this.position().x) / 7.0;
  });

  def.method('tailPosition', function() {
    const range = 198;
    return ((range * this.position().x) / 7.0) + 12;
  });

  def.method('verticalPositionClass', function() {
    if (this.position().y < 3) {
      return 'top';
    } else {
      return 'bottom';
    }
  });

  def.method('renderChoice', function(type) {
    const a = jQuery('<a href="javascript:;" class="pieceLink"></a>');
    if (type === this.selectedType()) { a.addClass('selected'); }
    const piece = jQuery('<div />');
    makePieceElement(piece, type, this.color(), this.pieceSize());
    a.append(piece);
    a.click(() => this.trigger('pieceChosen', type));
    a[0].ontouchstart = () => this.trigger('pieceChosen', type);
    return a;
  });
});
