import { BoardView } from '../views/board-view'
import { EngineView } from '../views/engine-view'
import { PositionSetupView } from '../views/position-setup-view'
import { MarkupView } from '../views/markup-view'

export const Palette = (def) => {
  def.retainedProperty('palette');

  def.method('hidePalette', function() {
    return this.switchPalette(null);
  });

  def.method('switchPalette', function(newPalette) {
    if (this.isPaletteMarkup()) { this.boardView().mode(BoardView.MODE_MOVE); }

    if (this.palette()) { this.children().remove(this.palette()); }
    this.palette(newPalette);
    if (this.palette()) { this.children().add(this.palette()); }
    this.engineButton().toggleClass('active', this.isPaletteEngine());
    this.positionSetupButton().toggleClass('active', this.isPalettePositionSetup());
    this.markupButton().toggleClass('active', this.isPaletteMarkup());
    this.updateSizing();
    this.moveListView().scrollToActive();

    // TODO move this code somewhere more sensible
    if ((this._boardView.mode() === BoardView.MODE_POSITION_SETUP) && !this.isPalettePositionSetup()) {
      return this._boardView.mode(BoardView.MODE_MOVE);
    }
  });

  def.method('showEngine', function() {
    this.switchPalette(EngineView.create({
      engine:     this.engine(),
      boardView:  this.boardView()
    })
    );
    return this.updateEngine();
  });

  def.method('showPositionSetup', function() {
    this.switchPalette(PositionSetupView.create({
      boardView:  this.boardView(),
      game:       this.game()
    })
    );
    this.boardView().mode(BoardView.MODE_POSITION_SETUP);
    return this.boardView().setupPiece('P');
  });

  def.method('showMarkup', function() {
    return this.switchPalette(MarkupView.create({
      boardView:  this.boardView()})
    );
  });

  def.method('isPaletteEngine', function() {
    return !!(this.palette() && this.palette() instanceof EngineView);
  });

  def.method('isPalettePositionSetup', function() {
    return !!(this.palette() && this.palette() instanceof PositionSetupView);
  });

  def.method('isPaletteMarkup', function() {
    return !!(this.palette() && this.palette() instanceof MarkupView);
  });

  def.method('updatePaletteSizing', function(boardSize) {
    if (this.palette()) {
      const paletteHeight = this.palette().element().outerHeight();
      this.moveListView().element().css('height', boardSize - paletteHeight - 12);
      return this.palette().element().css('top', boardSize - paletteHeight);
    } else {
      return this.moveListView().element().css('height', boardSize - 3);
    }
  });

  def.method('toggleEngine', function() {
    if (this.isPaletteEngine()) {
      return this.hidePalette();
    } else {
      return this.showEngine();
    }
  });

  def.method('togglePositionSetup', function() {
    if (this.isPalettePositionSetup()) {
      return this.hidePalette();
    } else {
      return this.showPositionSetup();
    }
  });

  def.method('toggleMarkup', function() {
    if (this.isPaletteMarkup()) {
      return this.hidePalette();
    } else {
      return this.showMarkup();
    }
  });
}
