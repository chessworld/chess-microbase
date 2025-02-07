import { Core, View } from 'seaturtle'

import { MoveView } from './move-view'

export const VariationView = Core.makeClass('VariationView', View.BaseView, (def) => {
  def.property('collapsed');
  def.property('maskAt');
  
  def.retainedProperty('clear');
  def.retainedProperty('numberAfter');
  
  def.initializer(function(options) {
    if (options == null) { options = {}; }
    this.super();
    this._collapsed = false;
    this._depth = options.depth;
    this._origin = options.origin;
    return this._element.addClass(this.classNames());
  });
  
  def.method('_maskAtChanged', function(o, maskAt) {
    this.uncollapse();
    if (maskAt) {
      let found = false;
      let next = false;
      return this.children().each(function(view) {
        if (view instanceof MoveView) {
          next = false;
          view.visible(!found);
        } else if (view instanceof VariationView) {
          if (next) {
            view.maskAt(view.children().first());
            view.show();
          } else {
            view.maskAt(null);
            view.visible(!found);
          }
        } else {
          view.visible(!found || next);
        }
        
        if (view === maskAt) {
          found = true;
          next = true;
          return view.masked(true);
        } else if (view.masked) {
          return view.masked(false);
        }
      });
    } else {
      return this.children().each(function(view) {
        view.show();
        view.masked && view.masked(false);
        if (view.maskAt) { return view.maskAt(null); }
      });
    }
  });
  
  // Adds move number for white with "..." as a header, use when variation
  // begins with a black move
  def.method('addBlackMoveNumberHeader', function(number) {
    const view = View.BaseView.create();
    view.element().addClass('moveNumber').text(`${number}...`);
    this.header(view);
    return view.release();
  });

  def.method('childAdded', function(children, child) {
    this.super(children, child);
    child.bind('shown', this, 'moveShown');
    return child.bind('hidden', this, 'moveHidden');
  });
  
  def.method('classNames', function() {
    if (this._depth > 0) {
      return `variation variation-${(this._depth - 1) % 5}`;
    } else {
      return "mainline";
    }
  });
  
  def.method('collapse', function() {
    if (!this._collapsed && !this._maskAt && (this._depth !== 0)) {
      let firstBlack;
      const toHide = [];
      let firstWhite = (firstBlack = true);
      this.children().each(view => {
        if (view instanceof MoveView) {
          if (view.color() === 'white') {
            if (firstWhite && !this.header()) {
              return firstWhite = false;
            } else {
              return toHide.push(view);
            }
          } else {
            if (firstBlack) {
              return firstBlack = false;
            } else {
              return toHide.push(view);
            }
          }
        } else {
          return toHide.push(view);
        }
      });
      
      if (toHide.length) {
        for (let view of Array.from(toHide)) {
          view.hide();
        }
        this.element().addClass('collapsed');
        return this._collapsed = true;
      }
    }
  });
  
  def.method('collapseOutside', function() {
    this.uncollapse();
    const parent = this.parent();
    parent.children().each(view => {
      if (view.collapse && (view !== this)) { return view.collapse(); }
    });
    if (parent.collapseOutside) { return parent.collapseOutside(); }
  });
  
  def.method('collapseVariations', function() {
    return this.children().each(function(view) {
      if (view.collapse) { return view.collapse(); }
    });
  });
  
  def.method('maskOrigin', function() {
    if (this._origin) {
      this.parent().maskOrigin();
      return this.parent().maskAt(this._origin);
    }
  });
  
  def.method('moveAfter', function(move) {
    let found = null;
    let next = false;
    this.children().each(function(view) {
      if (view === move) {
        return next = true;
      } else if (next && view instanceof MoveView) {
        found = view;
        return 'break';
      }
    });
    return found;
  });
  
  def.method('moveShown', function(move) {
    this.show();
    if (this._clear) { this._clear.show(); }
    if (this._numberAfter) { return this._numberAfter.show(); }
  });
  
  def.method('moveHidden', function(move) {
    if (!this.children().any('visible')) {
      this.hide();
      if (this._clear) { this._clear.hide(); }
      if (this._numberAfter) { return this._numberAfter.hide(); }
    }
  });
  
  def.method('setCollapsed', function(value) {
    if (value) {
      return this.collapse();
    } else {
      return this.uncollapse();
    }
  });
  
  def.method('uncollapse', function() {
    if (this._collapsed) {
      this._collapsed = false;
      this.element().removeClass('collapsed');
      return this.children().each('show');
    }
  });
});
