/*
  Title: Proto.Splitter
  
  About: Author
  Joe Gornick
  
  About: Version
  0.1
  
  About: License
  This file is licensed under the MIT license.
  
  About: Required Libraries
  Prototype JavaScript Framework 1.6.0.2 <http://prototypejs.org/download>  
  
  Proto.ElementMethods <Proto.ElementMethods>
*/

if (typeof Proto == 'undefined') var Proto = {};

Element.addMethods(Proto.ElementMethods);

/*
  Class: Proto.Splitter
  
  Creates a vertical splitter control between two divs.
  
  Example:
  (start code)
  ...
  <div id="container">
    <div id="left_side">Left</div>
    <div id="right_side">Right</div>
  </div>
  ...
  <script type="text/javascript">
    new Proto.Splitter('left_side', 'right_side');
  </script>
  ...
  (end)
  
  Assumptions:
    - The elements to be split must be on the same level.
    
  Notes:
    - After the splitter has moved, each element (el1 and el2) will fire a 'div:resized'
    event on the element itself.  In our example above, if you wanted to know when the
    left side was resized, you would $('left_side').observe('div:resized', ...);.
    When the div is resized, the new dimensions are also available in the events
    memo field.
*/

/*
  Group: Options
  
    Property: splitterStyle
    (Object) An object containing style information for the splitter.  Uses the 
    Element.setStyle object format.
    
    Property: proxySplitterStyle
    (Object) An object containing style information for the proxy splitter.  Uses 
    the Element.setStyle object format.
    
    Property: minEl1Width
    (Integer) Specifies the minimum width of el1 (left side).  Defaults to 100.
    
    Property: minEl2Width
    (Integer) Specifies the minimum width of el2 (right side). Defaults to 100.
*/

/* 
  Group: Properties
  
    Property: options
    (Object) The options passed in the constructor.
*/
Proto.Splitter = Class.create({
  /*
    Group: Constructor
    
    Constructor: initialize
    
    Constructor. Should not be called directly.
    
    Parameters:
      el1 - (String|HTMLElement) The "left" element
      el2 - (String|HTMLElement) The "right" element      
      options - (Object) Options used to setup the splitter.
    
    Returns:
      Proto.Splitter
  */  
  initialize: function(el1, el2, options)
  {
    this.options = {
      splitterStyle: {},
      proxySplitterStyle: {},
      minEl1Width: 100,
      minEl2Width: 100
    };
    Object.extend(this.options, options || { });
    
    this.el1 = $(el1);
    this.el2 = $(el2);
    this.container = this.el1.up(0);
    
    this._setupUI();
    
    this.splitter.observe('mousedown', this._onMouseDown.bindAsEventListener(this));
    
    Event.observe(window, 'resize', this._updateDimensions.bind(this));
  },
  
  _setupUI: function()
  {
    // Make sure the container is positioned absolutely or relatively
    this.container.setStyle({
      position: (this.container.getStyle('position') == 'absolute') ? 'absolute' : 'relative',
      overflow: 'hidden'
    });
        
    this.el1.setStyle({ 
      position: 'absolute',
      margin: 0, 
      padding: 0
    });
    
    this.el2.setStyle({ 
      position: 'absolute',
      margin: 0, 
      padding: 0
    });        
    
    this.cd = this.container.getAllDimensions();
    this.prevcd = this.container.getAllDimensions();
    
    this.splitter = 
      new Element('div')
        .setStyle({
          position: 'absolute',
          margin: 0, 
          padding: 0,
          top: 0,
          left: 0,
          width: '5px',
          height: this.cd.content.height + 'px',
          left: this.options.minEl1Width + 'px',          
          zIndex: '5',
          overflow: 'hidden',
          cursor: 'w-resize',
          backgroundColor: '#CCC'
        });
    
    this.splitter.setStyle(this.options.splitterStyle);
    
    // Setup our proxy splitter.  This is shown when the user tries to resize el1/el2.
    this.proxySplitter = 
      new Element('div', {id: 'proxy_splitter'})
        .setStyle({
          position: 'absolute',
          margin: 0, 
          padding: 0,
          top: 0,
          left: 0,
          width: '5px',
          height: this.cd.content.height + 'px',
          left: this.options.minEl1Width + 'px',
          zIndex: '10',          
          overflow: 'hidden',
          cursor: 'w-resize',
          backgroundColor: '#AAA'
        }).hide(); 

    this.proxySplitter.setStyle(this.options.proxySplitterStyle);
    this.proxySplitter.makeSameSize(this.splitter);

    this.el1.insert({after: this.splitter});
	  this.splitter.insert({after: this.proxySplitter});
    
    this._updateDimensions();
  },
  
  _setSplitterByPercent: function(percent)
  {
    var left = 
      (Math.round(this.cd.content.width  * (percent / 100)) - 
      (this.sd.dimensions.width / 2));
    
    // Make sure we don't go to far to the left/right
    if ((this.cd.contentoffset.left + left) < this.options.minEl1Width) 
      left = this.options.minEl1Width;
    if (((this.cd.contentoffset.left + this.cd.content.width) - left) < this.options.minEl2Width) 
      left = (this.cd.contentoffset.left + this.cd.content.width) - this.options.minEl2Width;    
    
    this.splitter.setStyle({left: left + 'px'});
    this.proxySplitter.makeSamePosition(this.splitter);
  },
  
  _updateDimensions: function()
  {
    this.cd = this.container.getAllDimensions();
    
    this.el1d = this.el1.getAllDimensions();
    this.el2d = this.el2.getAllDimensions();
    
    var so = (this.cd.contentoffset.left + this.el1d.dimensions.width); // Splitter Offset
    
    // If the width has changed of the container, then persist the same percentage
    // of the splitter.
    if (this.cd.dimensions.width != this.prevcd.dimensions.width)
      this._setSplitterByPercent((Math.round(so / this.prevcd.content.width * 100)));
    
    // Position our splitter to where the proxy splitter is.
    this.splitter.makeSamePosition(this.proxySplitter);
    
    // Update the height of the splitters
    this.splitter.setStyle({height: this.cd.content.height + 'px'});
    this.proxySplitter.setStyle({height: this.cd.content.height + 'px'});
    
    // Get the new splitter dimensions
    this.sd = this.splitter.getAllDimensions();

    // Set the new el1 and el2 width/height and left for el2.
    var el1Width = 
      (this.sd.positionedoffset.left) -
      (this.el1d.border.leftright - this.el1d.padding.leftright);
        
    var el1Height = 
      (this.cd.content.height) - 
      (this.el1d.border.topbottom + this.el1d.padding.topbottom);
    
    var el2Left = 
      (this.sd.positionedoffset.left) +
      (this.sd.dimensions.width);
        
    var el2Width = 
      (this.cd.content.width) -
      (this.sd.positionedoffset.left + this.sd.dimensions.width) - 
      (this.el2d.border.leftright - this.el2d.padding.leftright);
    
    var el2Height = 
      (this.cd.content.height) - 
      (this.el2d.border.topbottom + this.el2d.padding.topbottom);

    if (!(Prototype.Browser.IE || Prototype.Browser.WebKit || Prototype.Browser.Opera)) 
    {
      el1Width += (this.cd.border.left + this.cd.padding.left);
      el2Left += (this.cd.border.left + this.cd.padding.left);
      el2Width -= (this.cd.border.left + this.cd.padding.left);
    }
    else if (Prototype.Browser.Opera) // Opera handles border/padding with offsets
    {
      el1Width -= (this.cd.border.left + this.cd.padding.left);
      el2Left -= (this.cd.border.left + this.cd.padding.left);
      el2Width += (this.cd.border.left + this.cd.padding.left);
    }
    
    this.el1.setStyle({
      width: el1Width + 'px',
      height: el1Height + 'px'
    });
    
    this.el1.fire('div:resized', {
      width: el1Width, 
      height: el1Height
    });
      
    this.el2.setStyle({
      left: el2Left + 'px',
      width: el2Width + 'px',
      height: el2Height + 'px'
    });
    
    this.el2.fire('div:resized', {
      left: el2Left,
      width: el2Width, 
      height: el2Height
    });
    
    this.prevcd = this.container.getAllDimensions();    
  },
  
  _onMouseDown: function(e)
  {
    document.observe('mousemove', this._onMouseMove.bindAsEventListener(this));
    document.observe('mouseup', this._onMouseUp.bindAsEventListener(this));
    
    this.cd = this.container.getAllDimensions();
    this.sd = this.splitter.getAllDimensions();
    this.el1d = this.el1.getAllDimensions();
    
    // Gather our max left and right coords
    this.maxLeft = 
      this.cd.contentoffset.left + this.options.minEl1Width;
    
    this.maxRight = 
      (this.cd.contentoffset.left + this.cd.content.width) - // Container Content Right X
      (this.sd.dimensions.width) - // Splitter Width
      (this.options.minEl2Width); // Min El2 Width

    // Pointer Offset
    var so = (this.cd.contentoffset.left + this.el1d.dimensions.width); // Splitter Offset
    this.pointerOffset = (e.pointerX() - so);
        
    // Show the proxy splitter at the same position of the splitter
    this.proxySplitter.makeSamePosition(this.splitter).show();
        
    // Prevent selecting of elements (text).
    if (Prototype.Browser.IE || Prototype.Browser.WebKit)
    {
      document.observe('selectstart', function(e) { e.stop(); }); // Prevent text selection
      document.observe('dragstart', function(e) { e.stop(); }); // Prevent image drag
    }
    else
      e.stop();
  },
  
  _onMouseMove: function(e)
  { 
    var pointerX = (e.pointerX() - this.pointerOffset);
    var left = (pointerX - this.cd.contentoffset.left);
      
    if (pointerX < this.maxLeft) left = (this.maxLeft - this.cd.contentoffset.left);
    if (pointerX > this.maxRight) left = (this.maxRight - this.cd.contentoffset.left);

    this.proxySplitter.setStyle({
      left: left  + 'px'
    });
  },
  
  _onMouseUp: function(e)
  {
    document.stopObserving('mousemove');
    document.stopObserving('mouseup');
    
    this.proxySplitter.hide();
    
    this._updateDimensions();
        
    if (Prototype.Browser.IE || Prototype.Browser.WebKit)
    {
      document.stopObserving('dragstart');
      document.stopObserving('selectstart');
    }
  }
});