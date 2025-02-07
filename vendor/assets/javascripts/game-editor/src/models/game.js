import jQuery from 'jquery'

import { FINISH_REASONS } from '../constants'
import { Move } from './move'
import { GameState } from './game-state'

export class Game {
  static moveToPly(move) {
    let ply;
    if (move === '-') {
      return 0;
    } else if (move.indexOf('...') >= 0) {
      return ply = Number(move.replace(/\D/g, '')) * 2;
    } else {
      return ply = (Number(move.replace(/\D/g, '')) * 2) - 1;
    }
  }

  static plyToMove(ply) {
    if (ply === 0) {
      return '-';
    } else if ((ply % 2) === 1) {
      return `${Math.floor((ply + 1) / 2)}.`;
    } else {
      return `${Math.floor((ply + 1) / 2)}...`;
    }
  }

  constructor(data) {
    if (data == null) { data = {}; }
    this.tags = {};
    this.end = (this.start = new GameState(jQuery.extend({game: this}, data)));
    if (data.pgn || data.movetext) { this.error = this.loadPgn(data.pgn || data.movetext); }
  }

  finishReasonText() {
    if (this.end.endBoard.checkMate()) {
      return 'Checkmate';
    } else {
      return FINISH_REASONS[this.finishReason || '-'];
    }
  }

  isEmpty() {
    return this.start === this.end;
  }

  // Loads a branch from parsed tokens into a game state.
  // `next` is a function that returns the next token, or a falsy value if
  // all tokens have been fetched.
  loadMoves(state, next) {
    let token;
    let beforeComment = null;
    let variation = false;
    while ((token = next())) {
      var a;
      if (token.movetext) {
        var found, move;
        if (a = token.movetext.match(/^#(\w)$/)) {
          this.finishReason = a[1];
        } else if (token.movetext.match(/([a-h][1-8]|O-O|--)/)) {
          // Strip move number from beginning if present
          const text = token.movetext.replace(/^\d*\.*/, '');

          if (variation) {
            var error;
            move = new Move({'short': text, board: state.startBoard});
            const variationState = state.replaceMove(move, 'variation', this.loadId);
            this.loadedStates[this.loadId] = variationState;
            this.loadId += 1;
            if (beforeComment) { variationState.beforeComment = beforeComment; }
            if (error = this.loadMoves(variationState, next)) {
              return error;
            }
            variation = false;
          } else {
            move = new Move({'short': text, board: state.endBoard});
            state = state.addMove(move, this.loadId);
            this.loadedStates[this.loadId] = state;
            this.loadId += 1;
          }
        } else if (found = token.movetext.match(/^\$(\d+)$/)) {
          // Apply NAG to last move
          if (state.move) { state.move.annotation = Number(found[1]); }
        } else if (token.movetext.match(/^(1-0|0-1|1\/2-1\/2|\*)$/)) {
          this.result = token.movetext;
        } else if (!token.movetext.match(/^\s*\d+\.+\s*$/)) {
          return `Invalid token "${token.movetext}"`;
        }
      } else if (token.comment) {
        if (a = token.comment.match(/^#(\w)$/)) {
          this.finishReason = a[1];
        } else if (variation) {
          if (beforeComment) {
            beforeComment = `${beforeComment} ${token.comment}`;
          } else {
            beforeComment = token.comment;
          }
        } else {
          var result;
          if (state.comment) {
            state.comment += `${state.comment} ${token.comment}`;
          } else {
            state.comment = token.comment;
          }

          if (result = state.comment.match(/_MARK:([^_]+)_/)) {
            state.markup = result[1];
            state.comment = state.comment.replace(/\s*_MARK:[^_]+_/, '');
          }
        }
      } else if (token.tag) {
        this.setTag(token.tag, token.value);
      } else if (token.variation === 'begin') {
        variation = true;
      } else if (token.variation === 'end') {
        return null;
      }
    }

    return null;
  }

  // Loads game data from PGN text
  loadPgn(pgn) {
    // Replace weird dashes with hyphen
    pgn = pgn.replace(/[\u2012-\u2015]/g, '-');

    // Fix 0s in castling
    pgn = pgn.replace(/[O0]-[O0]-[O0]/g, 'O-O-O');
    pgn = pgn.replace(/[O0]-[O0]/g, 'O-O');

    // Parse text into tokens and load into game
    const tokens = this.tokenize(pgn);
    let i = 0;
    const next = () => tokens[i++];
    this.start.loadId = 0;
    this.loadedStates = {0: this.start};
    this.loadId = 1;
    return this.loadMoves(this.start, next);
  }

  // Follows branch from a given starting state, and appends PGN movetext to
  // array `s`. Recursively follows variations
  movetextFrom(state, s, options) {
    let first = true;              // Track if this is the first move in branch
    let variationClosed = false;   // Track if we just came out of a variation

    // Iterate through moves
    return (() => {
      const result = [];
      while (state) {
      // Add a space between moves
        var comment;
        if (!first) { s.push(' '); }

        // Display move number if on a white move, at the start of a branch,
        // or have just come out of a variation
        if (((state.ply % 2) === 1) || first || variationClosed) {
          s.push(Game.plyToMove(state.ply));
        }

        // Reset flags
        first = false;
        variationClosed = false;

        // Add before comment (only used at beginning of a variation)
        if (state.beforeComment) { s.push('{', state.beforeComment, '} '); }

        // Add text for this move
        s.push(state.move.toShort(options));

        // Add game comment, including markup
        if (comment = state.commentWithMarkup()) {
          s.push(' {', comment, '}');
        }

        // Add movetext for variations, in brackets
        for (let variation of Array.from(state.variations)) {
          s.push(' (');
          this.movetextFrom(variation, s, options);
          s.push(')');
          variationClosed = true;
        }

        // Go to the next move in branch
        result.push(state = state.next);
      }
      return result;
    })();
  }

  setTag(name, value) {
    this.tags[jQuery.trim(name)] = value;

    // Load FEN tag directly into @fen, and update starting board
    if (name.match(/^\s*FEN\s*$/i)) {
      return this.start.prepareBoard({fen: value});
    }
  }

  stateAtPly(ply) {
    let state = this.start;
    while (state && (state.ply < ply)) {
      state = state.next;
    }
    return state;
  }

  // Parses PGN text into tokens
  tokenize(movetext) {
    let tag_name;
    let state = 'default';
    const tokens = [];
    let text = (tag_name = '');
    for (let character of Array.from(movetext)) {
      switch (state) {
        case 'default':
          if (character === '[') {
            if (text.length) { tokens.push({movetext: text}); }
            text = '';
            state = 'tag';
          } else if (character === '{') {
            if (text.length) { tokens.push({movetext: text}); }
            text = '';
            state = 'comment';
          } else if (character === '(') {
            if (text.length) { tokens.push({movetext: text}); }
            text = '';
            tokens.push({variation: 'begin'});
          } else if (character === ')') {
            if (text.length) { tokens.push({movetext: text}); }
            text = '';
            tokens.push({variation: 'end'});
          } else if (character.match(/\s/)) {
            if (text.length) { tokens.push({movetext: text}); }
            text = '';
          } else {
            text += character;
          }
          break;
        case 'tag':
          if (character === ']') {
            state = 'default';
            text = '';
          } else if (character === '"') {
            state = 'tag_value';
            tag_name = text;
            text = '';
          } else {
            text += character;
          }
          break;
        case 'tag_value':
          if (character === '"') {
            state = 'tag';
            tokens.push({tag: tag_name, value: text});
            tag_name = (text = '');
          } else {
            text += character;
          }
          break;
        case 'comment':
          if (character === '}') {
            state = 'default';
            tokens.push({comment: text});
            text = '';
          } else {
            text += character;
          }
          break;
      }
    }

    if ((state === 'default') && text.length) { tokens.push({movetext: text}); }
    return tokens;
  }

  // Returns PGN movetext for game
  toMovetext(options) {
    let comment;
    if (options == null) { options = {}; }
    const s = [];
    if (comment = this.start.commentWithMarkup()) {
      s.push('{', comment, '} ');
    }
    this.movetextFrom(this.start.next, s, options);
    if (this.finishReason) { s.push(' {#', this.finishReason, '}'); }
    return s.join('');
  }

  // Returns full PGN for game, including tags, movetext and result
  toPgn() {
    const s = [];
    for (let tag in this.tags) {
      const value = this.tags[tag];
      s.push(`[${tag} \"${value}\"]\n`);
    }
    s.push("\n", this.toMovetext({annotations: true}), ' ', (this.result || '*'), "\n");
    return s.join('');
  }
};
