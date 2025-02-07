import { Core, View } from 'seaturtle'

export const InsertMethodDialog = Core.makeClass('InsertMethodDialog', View.DialogView, (def) => {
  def.initializer(function(allowVariations, callback) {
    const wizard = ST.WizardView.create();
    wizard.height('auto');
    const options = {
      overwrite: 'Overwrite following moves <span class="insert-method-diagram insert-method-overwrite"></span>',
      variation: 'Create a variation <span class="insert-method-diagram insert-method-variation"></span>',
      mainline:  'Make this the mainline <span class="insert-method-diagram insert-method-mainline"></span>',
      replace:   'Replace, keep following moves if valid <span class="insert-method-diagram insert-method-replace"></span>'
    };
    
    if (!allowVariations) {
      delete options.variation;
      delete options.mainline;
    }
    
    wizard.addStep(function() {
      this.paragraph('How would you like to insert this move?');
      this.radioGroup({field: 'method', default: 'overwrite', options});
    });

    wizard.bind('finished', callback);

    this.super({
      title:  'Insert a move',
      view:   wizard
    });
    wizard.release();
  });
});
