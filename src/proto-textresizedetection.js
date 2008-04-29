/*
  Title: Proto.TextResizeDetection
  
  About: Author
  Joe Gornick
  
  About: Version
  0.1
  
  About: License
  This file is licensed under the MIT license.
  
  About: Required Libraries
  Prototype JavaScript Framework 1.6.0.2 <http://prototypejs.org/download>
*/
if (typeof Proto == 'undefined') { var Proto = { } };

/*
  Class: Proto.TextResizeDetection
  
  Allows a user to observe if the text size has changed within a page.  This is 
  useful for resizing elements.
  
  Example:
  (start code)
  ...
  <script type="text/javascript">
    document.observe('text:resized', function(e)
    {
      alert('Text size has changed! Current size: ' + e.memo.currentSize + ' - Previous size: ' + e.memo.previousSize);
    });
    
    new Proto.TextResizeDetection(1000);
  </script>
  ...
  (end)
  
  Notes:
  When the text resizes, the 'text:resized' event will fire on the document. The
  memo in the event also contains current and previous text size information.
*/
Proto.TextResizeDetection = Class.create({
  /*
    Group: Constructor
    
    Constructor: initialize
    
    Constructor. Should not be called directly.
    
    Parameters:
      time - (Integer) The amount of time to periodically check for text size changes.
      This value is represented in milliseconds. Defaults to 1 second.
    
    Returns:
      Proto.TextResizeDetection
  */
  initialize: function(time)
  {
    // Default to 1 second.
    if (typeof time == 'undefined') time = 1000;
    
    // Convert the time to seconds since PeriodicalExecuter uses seconds.
    this.time = (time / 1000);
    this.size = 0;
    
    // Create our text resize span.
    this._createSpan();
    
    // Automatically start text resize.
    this.start();
  },
  
  start: function()
  {
    // Get the current height of the span.
    this.size = this.el.offsetHeight;
    // Start our PeriodicalExecuter
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