import jQuery from 'jquery'
import { Core, View, Util } from 'seaturtle'

import { BoardView } from '../views/board-view'

// This module handles creating and updating all of the toolbar buttons
// shown on a GameView
export const Toolbars = (def) => {
  def.property('engineButton');
  def.property('positionSetupButton');
  def.property('markupButton');

  // Constructs the board toolbar. This toolbar is shown below the chess
  // board, on the right hand side
  def.method('makeBoardToolbar', function() {
    const view = View.BaseView.create();
    view.element().addClass('toolbar toolbar-board');

    const bar = jQuery('<div class="btn-toolbar"></div>').appendTo(view.element());

    this._presentationModeButton = this.makeToolbarButton('presentation-mode',
      'Presentation Mode', true, 'togglePresentationMode');
    this._flipButton = this.makeToolbarButton('rotate', 'Flip Board', true, 'flip');

    bar.append(this.makeToolbarGroup(this._presentationModeButton, this._flipButton));

    this.boardToolbar(view);
    return view.release();
  });

  // Constructs the edit toolbar. This toolbar is shown below the move list
  def.method('makeEditToolbar', function() {
    const view    = View.BaseView.create();
    const element = view.element().addClass('toolbar toolbar-edit');
    const toolbar = jQuery('<div class="btn-toolbar" />').appendTo(element);

    this._positionSetupButton = this.makeToolbarButton('position-setup', 'Position Setup', true, 'togglePositionSetup');
    this._positionSetupButtonGroup = this.makeToolbarGroup(this._positionSetupButton);
    toolbar.append(this._positionSetupButtonGroup);

    this._markupButtonGroup = this.makeToolbarGroup(this.makeMarkupButton());
    toolbar.append(this._markupButtonGroup);

    this._illegalMoveButton = this.makeToolbarButton('illegal-move', 'Record Illegal Move', true, 'toggleIllegalMove');
    this._moveButtonsGroup = this.makeToolbarGroup(this.makeMoveButton(), this._illegalMoveButton);
    toolbar.append(this._moveButtonsGroup);

    this._trainingModeButton = this.makeToolbarButton('training-mode', 'Training Mode', true, 'toggleTrainingMode');
    this._trainingModeButton.addClass('wide');
    this._trainingModeGroup = this.makeToolbarGroup(this._trainingModeButton);
    if (this._moveListView.trainingMode()) {
      this._trainingModeButton.addClass('active');
    }
    toolbar.append(this._trainingModeGroup);

    if (this._engine) {
      const group = jQuery('<div class="btn-group"></div>').appendTo(toolbar);
      this._engineButton = this.makeToolbarButton('analysis-engine', 'Analysis Engine', true, 'toggleEngine').appendTo(group);
    }

    if (!this._moveList) { view.hide(); }
    this.editToolbar(view);
    return view.release();
  });

  // Constructs a button to allow the user to switch between board markup
  // modes
  def.method('makeMarkupButton', function() {
    this._markupButton = this.makeToolbarButton('markup', 'Graphic Annotations', true, 'toggleMarkup');
    this._markupButton.addClass('wide');
    return this._markupButton;
  });

  // Constructs a button allowing the user to annotate or delete the
  // currently selected move in the move list
  def.method('makeMoveButton', function() {
    this._moveButton = this.makeToolbarButton('annotate', 'Edit Move', true);
    this._moveButton.addClass('wide');
    Util.makePopup(this._moveButton, () => {
      const annotations = [
        ['None',  0],
        ['!',     1],
        ['?',     2],
        ['!!',    3],
        ['??',    4]
      ];
      const options = Core.List.createWithArray(annotations).mapArray(a => {
        return [a[0], () => this.changeMoveAnnotation(a[1])];
    });
      options.push(['More...', () => {
        let dialog;
        const view = View.BaseView.create();
        view.element().addClass('annotation-select');
        for (let id in Move.NAG_HTML) {
          var text = Move.NAG_HTML[id];
          (id => {
            return view.element().append(view.helper().linkTag(text, () => {
              this.changeMoveAnnotation(id);
              if (dialog && dialog.close) { return dialog.close(); }
            }).attr('title', Move.NAG_NAMES[id])
            );
          })(id);
        }
        return dialog = View.DialogView.create({
          title: 'Choose annotation',
          view
        });
      }
      ]);
      options.push('-', ['Delete', this.method('deleteMove')]);
      return options;
    }
    , null, null, {bottom: true, offsetY: 5});
    return this._moveButton;
  });

  // Constructs the move toolbar. This toolbar is shown below the chess
  // board, on the left hand side
  def.method('makeMoveToolbar', function() {
    const self    = this;
    const view    = View.BaseView.create();
    const element = view.element().addClass('toolbar toolbar-move');

    this._moveNumber = jQuery('<span class="moveNumber"></span>');
    if (this._moveList) { this._moveNumber.hide(); }

    this._nextButton = this.makeToolbarButton('next', 'Next Move', false, 'goForward');
    this._nextButton.addClass('wide');

    element.append(jQuery('<div class="btn-toolbar" />').append(
      this.makeToolbarGroup(this.makeToolbarButton('first', 'First Move', false, 'gotoStart')),
      this.makeToolbarGroup(
        this.makeToolbarButton('prev', 'Previous Move', false, 'goBack').addClass('wide'),
        this._nextButton
      ),
      this.makeToolbarGroup(this.makeToolbarButton('last', 'Last Move', false, 'gotoEnd')),
      this.makeToolbarGroup(this._moveNumber).css('vertical-align', 'top')
    )
    );
    this.moveToolbar(view);
    return view.release();
  });

  // Creates a toolbar button as an HTML element
  def.method('makeToolbarButton', function(icon, alt, tooltip, method) {
    const tag = jQuery(`<a class="btn"><i class="icon-${icon}">${alt}</i></a>`);
    if (tooltip) { tag.attr('title', alt); }
    if (method) {
      tag.click(() => {
        return this[method]();
      });
      if (Util.detectTouch()) {
        var bind = () => {
          // Only bind touch events after element added to the DOM
          if (tag.closest('html').length) {
            return tag.on('touchstart', e => {
              e.preventDefault();
              return this[method]();
            });
          } else {
            return setTimeout(bind, 100);
          }
        };
        bind();
      }
    }
    return tag;
  });

  // Creates a toolbar button group as an HTML element. Takes any number
  // of button elements as arguments and appends them to the group
  def.method('makeToolbarGroup', function() {
    const div = jQuery('<div class="btn-group" />');
    div.append.apply(div, arguments);
    return div;
  });

  // Makes all GameView toolbars
  def.method('makeToolbars', function() {
    this.makeMoveToolbar();
    this.makeBoardToolbar();
    return this.makeEditToolbar();
  });

  // Checks if the markup button is currently visible
  def.method('markupButtonVisible', function() {
    return this._markupButtonGroup.is(':visible');
  });

  // Updates the shown/hidden status of all buttons based on the current
  // mode. When a mode button is hidden this way, also deactivates that mode.
  def.method('updateButtonVisibility', function() {
    // Update training mode button
    const trainingModeVisible = !!(this._readOnly || this._presentationMode);
    this._trainingModeGroup.toggle(trainingModeVisible);
    if (!trainingModeVisible && this._moveListView.trainingMode()) {
      this.toggleTrainingMode();
    }

    // Update position setup button
    this._positionSetupButtonGroup.toggle(
      !this._readOnly &&
      !this._presentationMode &&
      (this._game.start === this._game.end)
    );

    // Update markup button
    const markupButtonVisible = this._presentationMode || !this._readOnly;
    this._markupButtonGroup.toggle(markupButtonVisible);
    if (!markupButtonVisible) {
      this._boardView.mode(BoardView.MODE_MOVE);
    }

    // Update move buttons
    const moveButtonVisible = !this._readOnly && !this._presentationMode &&
      (this._state !== this._game.start);
    const illegalMoveButtonVisible = !this._readOnly && !this._presentationMode;
    this._moveButton.toggle(moveButtonVisible);
    this._illegalMoveButton.toggle(illegalMoveButtonVisible);
    this._moveButton.toggleClass('solitary', !illegalMoveButtonVisible);
    this._illegalMoveButton.toggleClass('solitary', !moveButtonVisible);
    return this._moveButtonsGroup.toggle(moveButtonVisible || illegalMoveButtonVisible);
  });

  // Updates the "active" status of toggleable toolbar buttons
  def.method('updateToggleButtons', function() {
    this._flipButton.toggleClass('active', this._boardView.flipped());

    if (this._illegalMoveButton) {
      this._illegalMoveButton.toggleClass('active', this._boardView.recordIllegalMove());
    }

    if (this._trainingModeButton) {
      return this._trainingModeButton.toggleClass('active', !!this._moveListView.trainingMode());
    }
  });
}
