import { Board } from './board'
import { Game } from './game'

export class GameState {
  constructor(data) {
    // Reference to game used to keep "end" marker up to date. Only the
    // mainline retains this reference, it's dropped from all variations
    if (data == null) { data = {}; }
    this.game = data.game;

    this.depth = data.depth || 0;
    this.ply = data.ply || 0;
    this.prev = data.prev || null;
    this.next = data.next || null;
    this.mainline = null;
    this.variations = [];
    this.markup = data.markup || '';
    this.comment = data.comment || null;
    this.commentBefore = data.commentBefore || null;
    if (!this.id) { this.id = GameState.nextId++; }
    this.loadId = data.loadId;

    if (data.move) {
      this.move = data.move;
      this.startBoard = this.move.board;
      this.endBoard = this.move.then();
    } else if (data.board) {
      this.move = (this.startBoard = null);
      this.endBoard = data.board;
    } else {
      this.move = (this.startBoard = null);
      this.prepareBoard(data);
    }
  }

  commentWithMarkup() {
    let comment;
    if (this.markup) {
      comment = `_MARK:${this.markup}_`;
      if (this.comment) { comment = this.comment + ' ' + comment; }
      return comment;
    } else {
      return this.comment;
    }
  }

  // Adds a new state after this one using the specified move
  addMove(move, loadId) {
    const state = new GameState({
      ply:    this.ply + 1,
      game:   this.game,
      depth:  this.depth,
      prev:   this,
      move,
      loadId
    });
    this.next = state;
    if (this.game) { this.game.end = state; }
    return state;
  }

  // Removes this move from previous move and from game
  delete() {
    // Remove from previous move
    if (this.prev.next === this) {
      this.prev.next = null;
    }

    // Remove a variation from a mainline
    if (this.mainline) {
      const index = this.mainline.variations.indexOf(this);
      if (index >= 0) {
        this.mainline.variations.splice(index, 1);
      }
    }

    // Update game end if at top level
    if (this.game) {
      return this.game.end = this.prev;
    }
  }

  eachNode(options, callback) {
    if (options.includeSelf) {
      callback(this);
    }

    if (this.next && options.forward) {
      this.next.eachNode({ includeSelf: true, forward: true, variations: true }, callback);
    }
    if (this.prev && options.backward) {
      this.prev.eachNode({ includeSelf: true, backward: true, variations: true }, callback);
    }

    if (options.variations) {
      return Array.from(this.variations).map((variation) =>
        variation.eachNode({ includeSelf: true, forward: true, variations: true }, callback));
    }
  }

  hasComments() {
    return !!this.beforeComment || !!this.comment;
  }

  moveNumber() {
    if (this.prev === null) {
      return '-';
    } else {
      return Game.plyToMove(this.ply);
    }
  }

  moveNumberAndShort(options) {
    let text;
    if (options == null) { options = {}; }
    return text = this.move ?
      this.moveNumber() + ' ' + this.move.toShort(options)
    :
      this.moveNumber();
  }

  printDiagram() {
    return !!this.markup.match('DIAGRAM');
  }

  // Replaces this state with a new one using the specified move. Depending
  // on the method parameter, can also make either this or the new state a
  // variation of the other.
  replaceMove(move, method, loadId) {
    if (method == null) { method = 'overwrite'; }
    if (!this.move) { return; }

    const state = new GameState({
      ply:      this.ply,
      game:     this.game,
      depth:    this.depth,
      prev:     this.prev,
      next:     null,
      move,
      loadId
    });

    switch (method) {
      // Overwrites this state with a new one. This one is discarded
      case 'overwrite':
        this.prev.next = state;
        if (state.game) { this.game.end = state; }
        break;
      case 'variation':
        // Adds new state as a variation of this one
        this.variations.push(state);
        state.mainline = this;
        state.depth++;
        state.game = null;
        break;
      case 'mainline':
        // Swaps out new state for this one, and makes this a variation of the
        // other. Also moves any variations from this state to other
        state.variations.push(this);
        this.prev.next = state;
        state.variations = state.variations.concat(this.variations);
        this.variations = [];
        this.mainline = state;
        this.game = null;
        this.depth++;
        if (state.game) { state.game.end = state; }
        break;
      case 'replace':
        // Replaces the current state with a new one, then attempts to add
        // all valid following moves from the old line to the new one
        this.prev.next = state;
        if (state.game) { this.game.end = state; }
        let scan = this.next;
        let end = state;
        while (scan) {
          if (move = new Move({'short': scan.move.toShort(), board: end.endBoard})) {
            end = end.addMove(move);
            scan = scan.next;
          } else {
            scan = null;
          }
        }
        break;
      default:
        throw "Invalid insert method";
    }

    return state;
  }

  // Sets up an endBoard. Should only be used on a "start" state
  prepareBoard(data) {
    this.endBoard = new Board(data);
    if ((this.endBoard.turn === 'b') && ((this.ply % 2) !== 1)) { return this.ply += 1; }
  }

  toPrintHTML() {
    const html = [];
    let moves = [];
    let state = this;
    const moveDisplayOptions = {annotations: 'HTML'};
    while (state) {
      if (state.move) {
        // Display move numbers for white move, or first move in sequence
        if (((state.ply % 2) === 1) || !moves.length) {
          moves.push(state.moveNumber() + state.move.toShort(moveDisplayOptions));
        } else {
          moves.push(state.move.toShort(moveDisplayOptions));
        }
      }

      // Find non-move elements to insert
      let extras = [];

      // Prepare diagram if marked to print diagram
      if (state.printDiagram()) {
        extras.push(`<div class="diagram"><img src="/diagrams/${state.endBoard.toFenPosition()}` +
          '.png" /></div>'
        );
      }

      // Add comment (whitespace is deliberate to separate from moves when
      // displaying inline within a variation)
      if (state.comment && state.comment.match(/\S/)) {
        extras.push(` <div class="comment">${state.comment}</div> `);
      }

      // Add variations
      for (let variation of Array.from(state.variations)) {
        extras.push('<div class="variation"><div class="depth-indicator">' +
          (new Array(variation.depth+1)).join('&gt;') + '</div>' +
            variation.toPrintHTML() + '</div>'
        );
      }

      // If non-move stuff to display, flush moves and display
      if (extras.length) {
        html.push('<div class="moves">', moves.join(' '), '</div>');
        html.push(extras.join(''));
        moves = [];
        extras = [];
      }

      state = state.next;
    }

    // Flush remaining moves
    if (moves.length) {
      html.push('<div class="moves">', moves.join(' '), '</div>');
    }

    return html.join('');
  }
};

GameState.nextId = 1;
