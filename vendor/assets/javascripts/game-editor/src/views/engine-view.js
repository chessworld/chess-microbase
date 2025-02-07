import jQuery from 'jquery'
import { Core, View } from 'seaturtle'

import { MoveView } from './move-view'

export const EngineView = Core.makeClass('EngineView', View.BaseView, (def) => {
  def.initializer(function(options) {
    if (options == null) { options = {}; }
    this.super();
    this.makeHeader();
    this._engineFilename = options.engine;
    return this._boardView = options.boardView;
  });
  
  def.destructor(function() {
    this.killEngine();
    return this.super();
  });
  
  def.method('analyze', function(state) {
    if (window.Worker) {
      this.killEngine();
      this.clearResetBoardViewTimer();
      
      this._state = state;
      const fen = state.endBoard.toFen({ply: state.ply});
      this._turn = fen.match(/\sw/) ? 'w' : 'b';
      
      if (state.endBoard.checkMate()) {
        return this.displayCheckmate();
      } else {
        this.makeEngine();
        this._engine.postMessage(`position ${fen}`);
        this._engine.postMessage('analyze');
        if (this._loaded) {
          jQuery('img', this.header().element()).show();
          return this.clearResult();
        }
      }
    }
  });
  
  def.method('clearResetBoardViewTimer', function() {
    if (this._resetBoardViewTimer) {
      clearTimeout(this._resetBoardViewTimer);
      return this._resetBoardViewTimer = null;
    }
  });
  
  def.method('clearResult', function() {
    jQuery('.score', this.header().element()).text('');
    return this.children().empty();
  });

  def.method('convertScore', function(score) {
    score /= 1000.0;
    if (this._turn === 'b') { score *= -1; }
    return score;
  });

  def.method('displayCheckmate', function() {
    jQuery('.score', this.header().element()).text('#');
    return this.children().empty();
  });
  
  def.method('displayResult', function(ply, score, movetext) {
    this.resetBoardView();
    
    const moves = movetext.split(/\s+/);
    score = movetext.match('#') ?
      `# in ${Math.ceil(moves.length / 2)}`
    :
      this.convertScore(score);
    
    jQuery('.score', this.header().element()).text(score);
    
    this.children().empty();
    
    let state = this._state;
    
    // Display 1... move number if starting from black move
    if ((state.ply % 2) === 1) {
      const view = View.BaseView.create();
      view.element().addClass('moveNumber').text(`${Math.ceil(state.ply / 2)}...`);
      this.addChild(view);
      view.release();
    }
    
    // Limit displayed moves to 6 lines of text
    let limit = (state.ply % 2) === 1 ? 11 : 12;
    
    // Display move views for each view
    return (() => {
      const result = [];
      for (let san of Array.from(moves)) {
        if (limit > 0) {
          limit--;
          const move = new Move({board: state.endBoard, short: san});
          state = new GameState({
            ply:    state.ply + 1,
            move
          });
          result.push(this.makeMoveView(state));
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  });
  
  def.method('killEngine', function() {
    jQuery('img', this.header().element()).hide();
    if (this._engine) {
      this._engine.terminate();
      return this._engine = null;
    }
  });
  
  def.method('makeEngine', function() {
    this._results = [];
    try {
      this._engine = new Worker(this._engineFilename);
      this._engine.onmessage = e => {
        let a;
        if (a = e.data.match(/^pv Ply:(\d+) Score:(-?\d+).*  (.*)$/)) {
          const ply = Number(a[1]);
          const score = Number(a[2]);
          const moves = a[3];
          this.displayResult(ply, score, moves);
          if (ply >= 99) {
            return this.killEngine();
          }
        }
      };
      return this._engine.error = function(e) {
        if (window.console) { return console.log(`Engine error: ${e.message}`); }
      };
    } catch (error) {
      const e = error;
      if (window.console) { console.log(`Error loading engine: ${e.message}`); }
      return this._engine = null;
    }
  });
  
  def.method('makeMoveView', function(state) {
    const view = MoveView.create({state});
    view.load();
    jQuery('a', view.element()).hover(() => {
      this._previewing = true;
      view.element().addClass('current');
      this.clearResetBoardViewTimer();
      this._boardView.board(state.endBoard);
      return this._boardView.updatePieces(200);
    }
    , () => {
      view.element().removeClass('current');
      return this.setResetBoardViewTimer();
    });
  
    this.addChild(view);
    return view.release();
  });
  
  def.method('makeHeader', function() {
    const header = View.BaseView.create();
    header.element().html('<h3>Analysis Engine</h3><img src="/assets/game_editor/analysis.gif" alt="..." /><div class="score"></div>');
    this.header(header);
    header.release();
    
    if (window.Worker) {
      if (!this._engine) { return jQuery('img', this.header().element()).hide(); }
    } else {
      jQuery('img', this.header().element()).hide();
      return this.header().element().append('<p>Sorry, your browser is not supported. <a target="_blank" href="https://chessmicrobase.uservoice.com/knowledgebase/articles/83951">Learn more</a></p>');
    }
  });
  
  def.method('resetBoardView', function() {
    if (this._previewing) {
      this._previewing = false;
      this._boardView.board(this._state.endBoard);
      this._boardView.updatePieces(100);
    }
    return this._resetBoardViewTimer = null;
  });
  
  def.method('setResetBoardViewTimer', function() {
    this.clearResetBoardViewTimer();
    return this._resetBoardViewTimer = setTimeout(this.method('resetBoardView'), 200);
  });
});
