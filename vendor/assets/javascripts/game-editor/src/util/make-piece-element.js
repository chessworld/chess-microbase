export const makePieceElement = (element, type, color, size) => {
  element.addClass('piece').css({
    font:     `${size}px/${size}px WebUSCF`,
    width:    size,
    height:   size
  });
  if (navigator.platform.match(/Win/)) {
    const typeValue = (() => { switch (type) {
      case 'p': return 0;
      case 'n': return 1;
      case 'b': return 2;
      case 'r': return 3;
      case 'q': return 4;
      case 'k': return 5;
    } })();
    const colorValue = (() => { switch (color) {
      case 'w': return 0;
      case 'b': return 1;
    } })();
    return element.css('background', `url(/assets/game_editor/Chess-Pieces-${size}.png) no-repeat -${size * typeValue}px -${size * colorValue}px`);
  } else {
    const code = (() => { switch (color) {
      case 'w': return type.toUpperCase();
      case 'b': return type;
    } })();
    return element.html(`<div class="bg">${String.fromCharCode(code.charCodeAt(0) + 8)}</div><div class="fg">${code}</div>`);
  }
};
