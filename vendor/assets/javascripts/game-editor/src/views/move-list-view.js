import jQuery from 'jquery'
import { Core, View, Util } from 'seaturtle'

import { MoveView } from './move-view'
import { VariationView } from './variation-view'
import { FINISH_REASONS } from '../constants'

export const MoveListView = Core.makeClass('MoveListView', View.BaseView, (def) => {
  def.property('comments');
  def.property('game');
  def.property('active');
  def.property('activeView', 'read');
  def.property('mainline', 'read');
  def.property('trainingMode');
  def.property('presentationMode');
  def.accessor('activeView');

  def.initializer(function(options) {
    if (options == null) { options = {}; }
    this.super();
    this._moveViews = {};
    this._comments = options.comments;
    this._readOnly = options.readOnly;
    this.game(options.game);
    this.active(options.active || options.game.start);
    this._trainingMode = options.trainingMode;
    this._presentationMode = !!options.presentationMode;

    return this._element.addClass('MoveList');
  });

  def.method('_activeChanged', function(oldState, newState) {
    if (this._loaded) {
      jQuery('.MoveView', this._element).removeClass('current presentation-mode');

      this._activeView = newState && this._moveViews[newState.id];
      if (this._activeView) {
        this._activeView.element().addClass('current');
        if (this._presentationMode) { this._activeView.element().addClass('presentation-mode'); }
      }

      if (this._trainingMode) { this.updateMaskedMoves(); }
      this.updateCollapsedVariations();
      return this.scrollToActive();
    }
  });

  def.method('_gameChanged', function() {
    if (this._loaded) {
      this.reloadMoves();
      return this.updateFooter();
    }
  });

  def.method('_presentationModeChanged', function() {
    if (this._activeView) {
      return this._activeView.element().toggleClass('presentation-mode', this._presentationMode);
    }
  });

  def.method('_trainingModeChanged', function(oldValue, newValue) {
    if (this._loaded && (oldValue !== newValue)) {
      this.updateMaskedMoves();
      this.updateCollapsedVariations();
      return this.trigger('trainingModeChanged');
    }
  });

  def.method('addMove', function(state, previous) {
    // Find container to place new move in - mainline or variation
    const prevView = this._moveViews[previous.id];
    const parent = prevView ? prevView.parent() : this._mainline;

    // Add "..." if adding first move in game with a black move
    if (!prevView && (state.ply === 2)) {
      parent.addBlackMoveNumberHeader(1);
    }

    // Create view for move
    const view = MoveView.create({state, comments: this._comments});
    view.bind('jump', this, 'moveViewJump');
    parent.addChild(view);
    this._moveViews[state.id] = view;
    view.release();

    return this.updateFooter();
  });

  def.method('getActiveView', function() {
    let active;
    if (active = this.active()) {
      return this._moveViews[active.id];
    }
  });

  def.method('loadMovesTo', function(state, parent) {
    if (state && ((state.ply % 2) === 0)) {
      parent.addBlackMoveNumberHeader(state.ply / 2);
    }
    return (() => {
      const result = [];
      while (state) {
        let view = MoveView.create({state, comments: this._comments});
        view.bind('jump', this, 'moveViewJump');
        parent.addChild(view);
        this._moveViews[state.id] = view;

        let container = null;
        for (let variation of Array.from(state.variations)) {
          const clear = View.BaseView.create();
          clear.element().addClass('clear');
          parent.addChild(clear);

          container = VariationView.create({depth: variation.depth, origin: view});
          container.clear(clear);
          const footer = View.BaseView.create();
          footer.element().addClass('footer');
          container.footer(footer);
          footer.release();
          this.loadMovesTo(variation, container);
          parent.addChild(container);
          container.release();
          clear.release();
        }

        view.release();

        if (container && ((state.ply % 2) === 1)) {
          view = View.BaseView.create();
          view.element().addClass('moveNumber').text(`${((state.ply - 1) / 2) + 1}...`);
          container.numberAfter(view);
          parent.addChild(view);
          view.release();
        }
        result.push(state = state.next);
      }
      return result;
    })();
  });

  def.method('makeFooter', function() {
    let element;
    if (this._readOnly) {
      element = jQuery('<div class="finish-reason"></div>');
    } else {
      element = jQuery('<a href="javascript" class="finish-reason"></a>');
      Util.makePopup(element, () => {
        return (() => {
          const result = [];
          for (let reason in FINISH_REASONS) {
            var label = FINISH_REASONS[reason];
            result.push((reason => {
              return [label, () => {
                this._game.finishReason = reason === '-' ? null : reason;
                this.updateFooter();
                return this.trigger('finishReasonChanged');
              }
              ];
            })(reason));
          }
          return result;
        })();
    });
    }
    const footer = View.BaseView.createWithElement(element);
    this.footer(footer);
    return footer.release();
  });

  def.method('makeMainline', function() {
    const mainline = VariationView.create({depth: 0});
    this._mainline = mainline;
    this.addChild(mainline);
    return mainline.release();
  });

  def.method('markMoveDirty', function() {
    if (this._activeView) {
      return this._activeView.element().removeClass('current');
    }
  });

  def.method('moveViewJump', function(moveView, state) {
    return this.trigger('jump', state);
  });

  def.method('reloadMoves', function() {
    this._mainline = null;
    this._moveViews = {};
    this.children().empty();
    this.makeMainline();
    this.loadMovesTo(this._game.start.next, this._mainline);
    this._activeView = this._active && this._moveViews[this._active.id];
    if (this._trainingMode) { this.updateMaskedMoves(); }
    return this.updateCollapsedVariations();
  });

  def.method('render', function() {
    this.makeFooter();
    this.updateFooter();
    return this.reloadMoves();
  });

  def.method('scrollToActive', function() {
    if (this._activeView) {
      return this._activeView.scrollTo(this._element);
    } else {
      return this._element[0].scrollTop = 0;
    }
  });

  def.method('scrollToBottom', function() {
    return this._element[0].scrollTop = 30000;
  });

  def.method('setActiveView', function(view) {
    return this.active(view && view.state);
  });

  def.method('setComments', function(value) {
    if (this._comments !== value) {
      this._comments = value;
      return (() => {
        const result = [];
        for (let key in this._moveViews) {
          const view = this._moveViews[key];
          result.push(view.comments(this._comments));
        }
        return result;
      })();
    }
  });

  def.method('updateCollapsedVariations', function() {
    if (this._activeView) {
      return this._activeView.collapseAround();
    } else {
      return this._mainline && this._mainline.collapseVariations();
    }
  });

  def.method('updateMaskedMoves', function() {
    if (this._trainingMode) {
      if (this._activeView) {
        this._activeView.maskAround();
      } else {
        this._mainline.maskAt(this._mainline.children().first());
      }
    } else {
      this._mainline.maskAt(null);
    }
    return this.footer().visible(!this._mainline.maskAt() && !this._game.end.endBoard.checkMate());
  });

  def.method('updateMoveText', function(move) {
    let view;
    if (move.id && (view = this._moveViews[move.id])) {
      return view.updateText();
    }
  });

  def.method('updateFooter', function() {
    if (this._game.end.endBoard.checkMate()) {
      return this.footer().hide();
    } else {
      this.footer().show();

      const reason = FINISH_REASONS[this._game.finishReason] ?
        FINISH_REASONS[this._game.finishReason]
      : this._game.finishReason ?
        `Unknown: ${this._game.finishReason}`
      :
        'Not Finished';

      return this.footer().element().html(`${reason} <b class=\"caret\"></b>`);
    }
  });
});
