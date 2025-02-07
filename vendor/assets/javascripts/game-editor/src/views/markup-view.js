import jQuery from 'jquery'
import { Core, View } from 'seaturtle'

import { BoardView } from './board-view'

export const MarkupView = Core.makeClass('MarkupView', View.BaseView, (def) => {
  def.initializer(function(options) {
    if (options == null) { options = {}; }
    this.super();
    this.boardView = options.boardView;
    return this.boardView.bind('modeChanged', this, 'updateMode');
  });

  def.destructor(function() {
    this.boardView.unbind('modeChanged', this);
    return this.super();
  });

  def.method('render', function() {
    let mode;
    const colors = ['green', 'yellow', 'red'];
    let html = `\
<div class=\"markup-row\"> \
<a class=\"markup-tool markup-tool-large markup-tool-selected\" data-mode=\"${BoardView.MODE_MOVE}\"> \
<i class=\"icon-markup\"></i> \
</a> \
<a class=\"markup-tool markup-tool-large\" data-mode=\"${BoardView.MODE_MARKUP_ERASE}\"> \
<i class=\"icon-markup-erase\"></i> \
</a> \
</div> \
<div class=\"markup-row\">\
`;
    for (var color of Array.from(colors)) {
      mode = BoardView[`MODE_MARKUP_SQUARE_${color.toUpperCase()}`];
      html += `\
<a class=\"markup-tool\" data-mode=\"${mode}\"> \
<i class=\"icon-markup-square-${color}\"></i> \
</a>\
`;
    }
    html += `\
</div> \
<div class=\"markup-row\">\
`;
    for (color of Array.from(colors)) {
      mode = BoardView[`MODE_MARKUP_ARROW_${color.toUpperCase()}`];
      html += `\
<a class=\"markup-tool\" data-mode=\"${mode}\"> \
<i class=\"icon-markup-arrow-${color}\"></i> \
</a>\
`;
    }
    html += `\
</div> \
<div class=\"markup-row\"> \
<a class=\"markup-tool markup-tool-large\" data-action=\"togglePrintDiagram\"> \
<i class=\"icon-print-diagram\"></i> \
</a> \
<a class=\"markup-tool markup-tool-large\" data-action=\"clearMarkup\"> \
<i class=\"icon-markup-clear\"></i> \
</a> \
</div>\
`;
    this.element().html(html);
    return this._bind();
  });

  def.method('updateMode', function() {
    const mode = this.boardView.mode();
    jQuery('.markup-tool', this.element()).removeClass('markup-tool-selected');
    return jQuery(`.markup-tool[data-mode=${mode}]`).addClass('markup-tool-selected');
  });

  def.method('_bind', function() {
    const self = this;

    jQuery('.markup-tool[data-mode]', this.element()).click(function() {
      return self.boardView.mode(Number(jQuery(this).attr('data-mode')));
    });

    return jQuery('.markup-tool[data-action]', this.element()).click(function() {
      const action = jQuery(this).attr('data-action');
      return self.boardView[action]();
    });
  });
});
