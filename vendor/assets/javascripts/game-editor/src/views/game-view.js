import jQuery from 'jquery'
import { Core, View } from 'seaturtle'

import { Toolbars } from '../mixins/toolbars'
import { Palette } from '../mixins/palette'
import { InsertMethodDialog } from './insert-method-dialog'
import { BoardView } from './board-view'
import { CommentView } from './comment-view'
import { MoveListView } from './move-list-view'
import { BranchPopupView } from './branch-popup-view'
import { FINISH_REASONS_LONG } from '../constants'
import { PawnPromotionView } from './pawn-promotion-view'
import { Game } from '../models/game'
import { GameState } from '../models/game-state'

export const GameView = Core.makeClass('GameView', View.BaseView, (def) => {
  def.property('size');
  def.property('game');
  def.property('readOnly');
  def.property('comments');
  def.property('moveList');
  def.property('engine');

  def.retainedProperty('boardToolbar');
  def.retainedProperty('boardView');
  def.retainedProperty('commentView');
  def.retainedProperty('editToolbar');
  def.retainedProperty('moveListView');
  def.retainedProperty('moveToolbar');
  def.retainedProperty('branchPopup');

  def.include(Toolbars);
  def.include(Palette);

  def.initializer(function(options) {
    if (options == null) { options = {}; }
    const self = this;

    this.super();

    this._options         = options;
    this._allowVariations = options.allowVariations !== false;
    this._beforeComments  = options.beforeComments || false;
    this._engine          = options.engine;
    this._comments        = options.comments;
    this._moveList        = options.moveList !== false;
    this._nextStateID     = 1;
    this._readOnly        = options.readOnly || false;
    this._size            = options.size || 600;
    this._useFinishDialog = options.useFinishDialog || false;

    this._game = new Game(options); // The current game

    this._state = this._game.end;      // The currently displayed game state

    this._dirtyState = null;       // Modified "dirty" version of the state
                              // created when changes made in presentation
                              // mode

    // Try to run update step after view has been added to DOM
    setTimeout(this.method('updateMove'), 1);
  });

  def.method('boardViewMoves', function(boardView, moves, pieceView) {
    if (this._presentationMode) {
      const lastMove = moves[moves.length - 1];
      this._dirtyState = new GameState({
        move: lastMove,
        ply: lastMove.movingPieceColor() === 'b' ? 0 : 1
      });
      this._dirtyState.endBoard.changeTurn(lastMove.movingPieceColor() === 'b' ? 'w' : 'b');
      boardView.board(this._dirtyState.endBoard);
      boardView.updatePieces();
      this._moveListView.markMoveDirty();
      return this.updateEngine();
    } else if (!this._readOnly) {
      this.updateToggleButtons();
      if (this._state.next) {
        // See if there are already any versions with the same move
        if (moves.length === 1) {
          if (this._state.next.move && this._state.next.move.eq(moves[0])) {
            this.gotoState(this._state.next);
            return;
          }
          for (let variation of Array.from(this._state.variations)) {
            if (variation.move && variation.move.eq(moves[0])) {
              this.gotoState(variation);
              return;
            }
          }
        }

        pieceView.updatePosition();
        return InsertMethodDialog.create(this._allowVariations, (wizard, data) => {
          return Array.from(moves).map((move) =>
            this.makeMove(move, data.method, true));
        });
      } else {
        return (() => {
          const result = [];
          for (let move of Array.from(moves)) {
            result.push(this.makeMove(move));
          }
          return result;
        })();
      }
    }
  });

  def.method('boardViewMarkupChanged', function(boardView) {
    if (this._presentationMode) {
      if (!this._dirtyState) { this._dirtyState = new GameState({board: boardView.board(), ply: this._state.ply}); }
      this._dirtyState.markup = boardView.markupText();
      return this._moveListView.markMoveDirty();
    } else if (!this._readOnly) {
      let view;
      this._state.markup = boardView.markupText();
      if (view = this._moveListView.activeView()) {
        view.updateMarkedup();
      }
      return this.trigger('gameChanged', this._game);
    }
  });

  def.method('boardViewModeChanged', function(boardView, mode) {
    return jQuery('i', this._markupButton).attr('class', (() => { switch (mode) {
      case BoardView.MODE_MOVE:
        return 'icon-markup';
      case BoardView.MODE_MARKUP_SQUARE_GREEN:
        return 'icon-markup-square-green';
      case BoardView.MODE_MARKUP_SQUARE_YELLOW:
        return 'icon-markup-square-yellow';
      case BoardView.MODE_MARKUP_SQUARE_RED:
        return 'icon-markup-square-red';
      case BoardView.MODE_MARKUP_ARROW_GREEN:
        return 'icon-markup-arrow-green';
      case BoardView.MODE_MARKUP_ARROW_YELLOW:
        return 'icon-markup-arrow-yellow';
      case BoardView.MODE_MARKUP_ARROW_RED:
        return 'icon-markup-arrow-red';
      case BoardView.MODE_MARKUP_ERASE:
        return 'icon-markup-erase';
    } })()
    );
  });

  def.method('boardViewStartingPositionChanged', function(boardView, fen) {
    this.trigger('startingPositionChanged', fen);
    return this._state.ply = this._state.endBoard.turn === 'w' ? 0 : 1;
  });

  def.method('branchChosen', function(view, state) {
    return this.gotoState(state);
  });

  def.method('changeMoveAnnotation', function(annotation) {
    this._state.move.annotation = annotation;
    this._moveListView.updateMoveText(this._state);
    return this.trigger('gameChanged', this._game);
  });

  def.method('changePromotion', function(state, type, method) {
    if (method == null) { method = 'overwrite'; }
    const move = this._state.move.dup({promotion: type});
    this._state = this._state.replaceMove(move, method);
    this._boardView.board(this._state.endBoard);
    this._boardView.updatePieces();
    this._moveListView.reloadMoves();
    this.updateMove();
    return this.hidePawnPromotion();
  });

  def.method('clearResetBoardTimeout', function() {
    if (this._resetBoardTimeout) {
      clearTimeout(this._resetBoardTimeout);
      return this._resetBoardTimeout = null;
    }
  });

  def.method('closeBranchPopup', function() {
    if (this._branchPopup) {
      this._branchPopup.returnKeyboardFocus();
      this.removeChild(this._branchPopup);
      return this.branchPopup(null);
    }
  });

  def.method('commentViewChanged', function() {
    let view;
    this.trigger('gameChanged', this._game);
    if (view = this._moveListView.activeView()) {
      return view.updateComment();
    }
  });

  def.method('deleteMove', function() {
    if (confirm('Are you sure you want to delete this move? Any following moves will also be deleted.')) {
      this._state.delete();
      this._moveListView.reloadMoves();
      this.gotoState(this._state.mainline || this._state.prev);
      if (this._game.isEmpty()) { this._positionSetupButton.show(); }
      return this.trigger('gameChanged', this._game);
    }
  });

  def.method('finish', function() {
    if (this._game.end.endBoard.checkMate()) {
      return this.trigger('finished');
    } else {
      return this.showFinishDialog();
    }
  });

  def.method('flip', function() {
    this._boardView.flip();
    return this.updateToggleButtons();
  });

  def.method('goBack', function(animate) {
    if (animate == null) { animate = 200; }
    if (this._state.prev) { return this.gotoState(this._state.prev, animate); }
  });

  def.method('goForward', function(animate) {
    if (animate == null) { animate = 200; }
    if (this._branchPopup) {
      return this.gotoState(this._branchPopup.active(), animate);
    } else if (this._state.next && this._state.next.variations.length) {
      return this.openBranchPopup(this._state.next);
    } else {
      if (this._state.next) { return this.gotoState(this._state.next, animate); }
    }
  });

  def.method('gotoEnd', function(animate) {
    if (animate == null) { animate = 200; }
    if (this._game.end) { return this.gotoState(this._game.end, animate); }
  });

  def.method('gotoPly', function(ply, animate) {
    let state;
    if (animate == null) { animate = 200; }
    if (state = this._game.stateAtPly(ply)) {
      return this.gotoState(state, animate);
    }
  });

  def.method('gotoState', function(state, animate) {
    if (animate == null) { animate = 200; }
    if (this._branchPopup) { this.closeBranchPopup(); }

    this._dirtyState = null;
    this._state = state;
    if (this._boardView) {
      this._boardView.board(state.endBoard);
      this._boardView.updatePieces(animate);
      if (animate > 0) {
        this._boardView.clearMarkup(true);
        setTimeout(() => {
          return this._boardView.markupText(state.markup);
        }
        , animate);
      } else {
        this._boardView.markupText(state.markup);
      }
    }
    this.updateMove();
    return this.trigger('switchedState', state);
  });

  def.method('gotoStart', function(animate) {
    if (animate == null) { animate = 200; }
    return this.gotoState(this._game.start, animate);
  });

  def.method('keyDown', function(key) {
    switch (key) {
      case View.BaseView.VK_LEFT:
        this.goBack();
        return true;
        break;
      case View.BaseView.VK_RIGHT:
        this.goForward();
        return true;
        break;
    }

    if (this._presentationMode && (key === View.BaseView.VK_ESCAPE)) {
      this.gotoState(this._state);
      return true;
    }

    if (this.markupButtonVisible()) {
      switch (key) {
        case 48: case 96: // 0
          this._boardView.mode(BoardView.MODE_MOVE);
          return true;
          break;
        case 49: case 97: // 1
          this._boardView.mode(BoardView.MODE_MARKUP_SQUARE_GREEN);
          return true;
          break;
        case 50: case 98: // 2
          this._boardView.mode(BoardView.MODE_MARKUP_SQUARE_YELLOW);
          return true;
          break;
        case 51: case 99: // 3
          this._boardView.mode(BoardView.MODE_MARKUP_SQUARE_RED);
          return true;
          break;
        case 52: case 100: // 4
          this._boardView.mode(BoardView.MODE_MARKUP_ARROW_GREEN);
          return true;
          break;
        case 53: case 101: // 5
          this._boardView.mode(BoardView.MODE_MARKUP_ARROW_YELLOW);
          return true;
          break;
        case 54: case 102: // 6
          this._boardView.mode(BoardView.MODE_MARKUP_ARROW_RED);
          return true;
          break;
        case 55: case 103: // 7
          this._boardView.mode(BoardView.MODE_MARKUP_ERASE);
          return true;
          break;
      }
    }

    return false;
  });

  def.method('loadGame', function(game, display) {
    if (display == null) { display = 'start'; }
    this._boardView.clearPieces();
    this._game = game;
    this._moveListView.game(game);
    if (display === 'end') {
      return this.gotoState(this._game.end);
    } else {
      return this.gotoState(this._game.start);
    }
  });

  def.method('loadMovetext', function(movetext, display) {
    if (display == null) { display = 'start'; }
    const game = new Game({movetext});
    return this.loadGame(game, display);
  });

  def.method('makeBoardView', function() {
    const boardView = BoardView.create(jQuery.extend({
      board:    this._state.endBoard
    }, this._options)
    );
    boardView.bind('moves', this, 'boardViewMoves');
    boardView.bind('markupChanged', this, 'boardViewMarkupChanged');
    boardView.bind('modeChanged', this, 'boardViewModeChanged');
    boardView.bind('startingPositionChanged', this, 'boardViewStartingPositionChanged');
    this.boardView(boardView);
    this.addChild(boardView);
    boardView.release();

    // Display opening markup with a delay to help ensure correct sizing of
    // Raphael canvas
    return setTimeout(() => {
      return this._boardView.markupText(this._state.markup);
    }
    , 100);
  });

  def.method('makeCommentView', function() {
    const commentView = CommentView.create({
      state:          this._state,
      readOnly:       this._readOnly || this._presentationMode,
      beforeComments: this._beforeComments
    });
    commentView.bind('changed', this, 'commentViewChanged');
    this.commentView(commentView);
    this._children.add(commentView);
    return commentView.release();
  });

  def.method('makeFooter', function() {
    const footer = View.BaseView.create();
    footer.load();
    footer.addChild(this._moveListView);
    footer.addChild(this._moveToolbar);
    footer.addChild(this._boardToolbar);
    footer.addChild(this._editToolbar);
    this.footer(footer);
    return footer.release();
  });

  def.method('makeMove', function(move, method, reload) {
    if (method == null) { method = 'overwrite'; }
    if (reload == null) { reload = false; }
    const oldState = this._state;

    if (this._state.next) {
      this._state = this._state.next.replaceMove(move, method);
    } else {
      this._state = this._state.addMove(move);
    }

    if (reload) {
      this._moveListView.reloadMoves();
    } else {
      this._moveListView.addMove(this._state, oldState);
    }

    // Update board view
    this._boardView.clearMarkup(true);
    this._boardView.board(this._state.endBoard);
    this._boardView.updatePieces();

    this.updateMove();

    // Display pawn promotion box if move is a pawn promotion
    if (!this._readOnly) { this.updatePawnPromotionBox(); }

    this._moveListView.updateFooter();
    this._positionSetupButton.hide();

    this.trigger('gameChanged', this._game);

    if (this._state.endBoard.checkMate()) {
      return this.trigger('checkmate', this._state.startBoard.turn);
    }
  });

  def.method('makeMoveListView', function() {
    const moveListView = MoveListView.create(jQuery.extend(
      {}, this._options, {
        game:     this._game,
        active:   this._state,
        comments: this._comments,
        readOnly: this._readOnly
      }
    ));
    if (!this._moveList) { moveListView.hide(); }
    moveListView.bind('jump', this, 'moveListViewJump');
    moveListView.bind('finishReasonChanged', this, 'moveListViewFinishReasonChanged');
    this.moveListView(moveListView);
    this.addChild(this._moveListView);
    return moveListView.release();
  });

  def.method('markupTextWithMovePreviews', function(element, after) {
    if (after == null) { after = false; }
    const self = this;

    // Start with working board at current position
    const rootBoard = after ? this._state.endBoard : this._state.startBoard;
    if (!rootBoard) { return; }

    return element.each(function() {
      const boards = [];

      let board = rootBoard;
      let { ply } = self._state;
      if (!after) { ply -= 1; }

      const output = [];

      // Scan each word
      const words = jQuery(this).text().split(/\s+/);
      for (let word of Array.from(words)) {
        // Move working board to specific move number if given
        var found;
        if (found = word.match(/^[\[\{\<\(]?(\d+\.+)/)) {
          const newPly = Game.moveToPly(found[1]) - 1;
          // Can move anywhere from starting position, otherwise only
          // backwards; this restriction prevents board getting reset
          // when future numbers are encountered
          if ((newPly !== ply) && ((board === rootBoard) || (newPly < ply))) {
            if (found = self._game.stateAtPly(newPly)) {
              board = found.endBoard;
              ({ ply } = found);
            }
          }
        }

        // Look for words that could be moves
        if (found = word.match(/([RNBKQ]?[a-h]?[1-8]?x?[a-h][1-8]=?[RNBQ]?|[O0]-[O0]-?[O0]?|--)/)) {
          // Find a valid move on working board
          let move = new Move({'short': found[1], board});

          // If no valid move on working board, look for a valid move
          // at current position
          if ((move.special === 'null') && (word !== '--')) {
            move = new Move({'short': found[1], board});
          }

          // Update the working board
          board = move.then();
          ply += 1;

          // If valid move found, link it
          if (move.special !== 'null') {
            boards.push(board);
            output.push(`<a href="javascript:;" class="live-move" data-board="${boards.length - 1}">${word}</a>`);
          } else {
            output.push(word);
          }
        } else {
          output.push(word);
        }
      }

      jQuery(this).html(output.join(' '));

      // Activate all of the move links
      return jQuery('a.live-move', this).hover(function() {
        self.clearResetBoardTimeout();
        // Display board position after this move on board view
        const boardIdx = Number(jQuery(this).attr('data-board'));
        self._boardView.board(boards[boardIdx]);
        return self._boardView.updatePieces(200);
      }
      , () =>
        // Set a timeout to return to current position after mouse cursor
        // has been away from moves for a little while. This helps to stop
        // the board from "jumping" when going between moves
        self.setResetBoardTimeout()
      );
    });
  });

  def.method('moveListViewFinishReasonChanged', function(view) {
    return this.trigger('gameChanged', this._game);
  });

  def.method('moveListViewJump', function(view, state) {
    return this.gotoState(state);
  });

  def.method('moveNumberHtml', function() {
    return this._state.moveNumberAndShort({annotations: 'HTML'});
  });

  def.method('openBranchPopup', function(state) {
    if (this._branchPopup) { this.closeBranchPopup(); }

    const popup = BranchPopupView.create({state});
    popup.bind('chosen', this, 'branchChosen');
    popup.bind('cancelled', this, 'closeBranchPopup');
    this.branchPopup(popup);
    this.addChild(popup);
    popup.element().css({
      position:   'absolute',
      left:       63,
      top:        (this._boardView.size() - popup.element().outerHeight()) + 7
    });
    popup.takeKeyboardFocus();
    return popup.release();
  });

  // Generates a print version of the game, including summary of metadata,
  // game moves and comments (with variations displayed as a comment), and
  // inserted static diagrams on any moved marked to print diagrams
  def.method('print', function(footer) {
    const html = ['<div class="print-game"><div class="summary">'];

    // Generate summary using PGN tags
    if (this._game.tags.Event) {
      html.push('<div class="event">', this._game.tags.Event);
      if (this._game.tags.Date) {
        const date = this._game.tags.Date.split('.');
        html.push(', ', date[0]);
      }
      html.push('</div>');
    }
    html.push('<div class="player white">', this._game.tags.White || 'Unknown');
    if (this._game.tags.WhiteElo) {
      html.push('<span class="rating">', this._game.tags.WhiteElo, '</span>');
    }
    html.push('</div><div class="player black">', this._game.tags.Black || 'Unknown');
    if (this._game.tags.BlackElo) {
      html.push('<span class="rating">', this._game.tags.BlackElo, '</span>');
    }
    html.push('</div>');
    if (this._game.tags.Opening) {
      html.push('<div class="opening">', this._game.tags.Opening, '</div>');
    }
    html.push('</div>');

    // Display game
    html.push(this._game.start.toPrintHTML());

    html.push('<div class="result">', this._game.result, ' ',
      this._game.finishReasonText(), '</div>');

    // Display footer
    if (footer) {
      html.push('<div class="footer">', footer, '</div>');
    }

    html.push('</div>');

    return this.helper().print(html.join(''),
      {stylesheets: ['/assets/print.css']});
  });

  // Changes promotion type for a pawn promotion move
  def.method('promotePawn', function(type) {
    if (this._state.next) {
      return InsertMethodDialog.create(this._allowVariations, (wizard, data) => {
        return this.changePromotion(this._state, type, data.method);
      });
    } else {
      return this.changePromotion(this._state, type, 'overwrite');
    }
  });

  def.method('render', function() {
    this.makeBoardView();
    this.makeMoveListView();
    if (this._comments) { this.makeCommentView(); }
    this.makeToolbars();
    this.makeFooter();
    return this.updateSizing();
  });

  def.method('setComments', function(value) {
    if (this._comments !== value) {
      this._comments = value;
      if (value) {
        if (!this._commentView) { this.makeCommentView(); }
        this._commentView.show();
      } else if (this._commentView) {
        this._commentView.hide();
      }
      return this._moveListView.comments(value);
    }
  });

  def.method('setMoveList', function(value) {
    this._moveList = value;
    if (this._loaded) {
      this._moveListView.visible(value);
      this._editToolbar.visible(value);
      this._moveNumber.toggle(!value);
      this.updateSizing();
      return this.updateMove();
    }
  });

  def.method('setReadOnly', function(value) {
    this._readOnly = value;
    return this._boardView.readOnly(value);
  });

  def.method('setResetBoardTimeout', function() {
    if (!this._resetBoardTimeout) {
      return this._resetBoardTimeout = setTimeout(() => {
        this._boardView.board(this._state.endBoard);
        return this._boardView.updatePieces(200);
      }
      , 500);
    }
  });

  def.method('setSize', function(size) {
    if (this._size !== size) {
      this._size = size;
      if (this._loaded) { return this.updateSizing(); }
    }
  });

  def.method('showFinishDialog', function() {
    const wizard = View.WizardView.create();
    wizard.height('auto');
    wizard.data().finishReason = this._finishReason || '-';
    wizard.addStep(function() {
      return this.radioGroup({field: 'finishReason', options: FINISH_REASONS_LONG});
    });
    View.DialogView.createWithTitleView('How did this game end?', wizard);
    wizard.bind('finished', (wizard, data) => {
      const finishReason = data.finishReason && (data.finishReason !== '-') ?
        data.finishReason
      :
        null;
      if (finishReason !== this._game.finishReason) { this.finishReason(finishReason); }
      return this.trigger('finished');
    });
    return wizard.release();
  });

  def.method('showPawnPromotion', function(color, selected, position) {
    if (!this._pawnPromotionView) {
      this._pawnPromotionView = PawnPromotionView.create({
        selectedType:   selected,
        color,
        position,
        pieceSize:      this._boardView.squareSize()
      });
      this._pawnPromotionView.bind('pieceChosen', this, 'pawnPromotionViewPieceChosen');
      return this.children().add(this._pawnPromotionView);
    }
  });

  def.method('hidePawnPromotion', function() {
    if (this._pawnPromotionView) {
      this.children().remove(this._pawnPromotionView);
      return this._pawnPromotionView = null;
    }
  });

  def.method('pawnPromotionViewPieceChosen', function(view, type) {
    this.hidePawnPromotion();
    return this.promotePawn(type);
  });

  def.method('toggleIllegalMove', function() {
    this._boardView.recordIllegalMove(!this._boardView.recordIllegalMove());
    return this.updateToggleButtons();
  });

  def.method('togglePresentationMode', function() {
    this._presentationMode = !this._presentationMode;

    if (!this._presentationMode) { this.gotoState(this._state); }
    if (this._presentationMode && this._boardView.recordIllegalMove()) { this.toggleIllegalMove(); }
    if (this._presentationMode && this._positionSetupView) { this.togglePositionSetup(); }

    this._presentationModeButton.toggleClass('active', this._presentationMode);

    this._boardView.presentationMode(this._presentationMode);
    this._moveListView.presentationMode(this._presentationMode);

    if (this._commentView) {
      this._commentView.readOnly(this._readOnly || this._presentationMode);
    }

    return this.updateButtonVisibility();
  });

  def.method('toggleTrainingMode', function() {
    const mode = !this._moveListView.trainingMode();
    this._moveListView.trainingMode(mode);

    // If training mode switched on when at end of game, jump back to start
    // so that user can see some effect come of activating it
    if (mode && (this._state === this._game.end)) {
      this.gotoStart();
    }

    return this.updateToggleButtons();
  });

  def.method('updateEngine', function() {
    if (this.palette() && this.palette().analyze) {
      return this.palette().analyze(this._dirtyState || this._state);
    }
  });

  def.method('updateMove', function() {
    // Update hilighted move in move list
    if (this._moveListView) { this._moveListView.active(this._state); }

    // Update displayed move number
    if (this._moveNumber) { this._moveNumber.html(this.moveNumberHtml()); }

    this.hidePawnPromotion();

    // Update comments display
    if (this._commentView) { this._commentView.state(this._state); }

    if (this._loaded) { this.updateButtonVisibility(); }
    return this.updateEngine();
  });

  def.method('updatePawnPromotionBox', function() {
    const { move } = this._state;
    if (move && (move.special === 'promotion')) {
      this.hidePawnPromotion();
      return this.showPawnPromotion(
        move.board.turn,
        move.promotion,
        this._boardView.convertPosition(move.to)
      );
    } else {
      return this.hidePawnPromotion();
    }
  });

  def.method('updateSizing', function() {
    let boardSize = this._size;
    if (this._moveList) { boardSize -= 220; }
    this._boardView.size(boardSize);
    boardSize = this._boardView.size();
    let height = boardSize + 41;
    if (this._comments) { height += 80; }
    this._element.css({
      width: this._size,
      height
    });

    this.updatePaletteSizing(boardSize);

    this._moveToolbar.element().css({
      top:    boardSize + 10
    });
    this._boardToolbar.element().css({
      top:    boardSize + 10,
      right:  this._size - boardSize - 1
    });
    this._editToolbar.element().css({
      top:    boardSize + 10
    });
    if (this._commentView) { return this._commentView.size(this._size); }
  });
});
