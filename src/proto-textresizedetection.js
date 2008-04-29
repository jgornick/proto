/**
 * @author Joe Gornick
 * @version 0.1
 * 
 * @requires Prototype JavaScript Framework 1.6.0.2 - http://prototypejs.org/download
 * 
 * @license MIT
 */

if (typeof Proto == 'undefined') { var Proto = { } };

/**
 * Proto.TextResizeDetection allows a user to observe if the text size has changed within
 * a page.  This is useful for resizing elements.
 * 
 * @param {Object} time - Specified in seconds
 */
Proto.TextResizeDetection = Class.create({
  initialize: function(time)
  {
    this.time = (time / 1000);
    this.size = 0;
    this._createSpan();
    this.start();
  },
  
  start: function()
  {
    this.size = this.el.offsetHeight;
    this.pe = new PeriodicalExecuter(this._onTextResize.bind(this), this.time);
  },
  
  stop: function()
  {
    this.pe.stop(); 
    this.pe = null;   
  },
  
  _createSpan: function()
  {
    this.el = 
      new Element('span', {id: '_text_resize_detection_span'})
      .setStyle({
        position: 'absolute',
        top: '-9999px',
        left: '-9999px'
      })
      .update('&nbsp;');
    
    $(document.body).insert({top: this.el});
  },
      
  _onTextResize: function()
  {
    var currentSize = this.el.offsetHeight;
    if (this.size != currentSize) 
    {
      document.fire('text:resized', {
        previousSize: this.size,
        currentSize: currentSize
      });
      this.size = currentSize;
    }  
  }
});