/*
  Title: Proto.AreaSelector
  
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

// Add our element methods.
Element.addMethods(Proto.ElementMethods);

/*
  Class: Proto.AreaSelector
  
  Creates a visual selector when the user clicks and drags in the specified element.
  
  Example:
  (start code)
  ...
  (end)
*/

/*
  Group: Options
  
    Property: style
    The style object to use for setting inline styles.  The selector also can be 
    styled by using the "selector" class name.
    
    Property: onMouseDown((Object) coords)
    An event fired when mouse button is pressed.
    
    Property: onMouseMove((Object) coords)
    An event fired when mouse is moving while the mouse button is still pressed.
    
    Property: onMouseUp((Object) coords)
    An event fired after the mouse button is released.
*/

/* 
  Group: Properties
  
    Property: el
    The element where the selector will attach itself to.
    
    Property: options
    The options passed in the constructor.
*/
Proto.AreaSelector = Class.create({
  /*
    Group: Constructor
    
    Constructor: initialize
    
    Constructor. Should not be called directly.
    
    Parameters:
      el - A string or the element that the selector will attach to.
      options - The options object to use when setting up the selector.
    
    Returns:
      Proto.AreaSelector
  */
  initialize: function(el, options)
  {
    this.options = {
      style: {},
      onMouseDown: Prototype.emptyFunction,
      onMouseMove: Prototype.emptyFunction,
      onMouseUp: Prototype.emptyFunction
    };
    Object.extend(this.options, options || { });
    
    this.el = $(el);
    
    this.selectorDiv = 
      new Element('div', { className: 'selector' })
        .setStyle({
          position: 'absolute', 
          width: '0px',
          height: '0px',
          top: '0px',
          left: '0px',
          overflow: 'hidden'
        })
        .hide();
    this.selectorDiv.setStyle(this.options.style);
    
    this._coords = {x1: 0, y1: 0, x2: 0, y2: 0};

    this.el.insert({top: this.selectorDiv});
  },
  
  /*
    Group: Methods
  */
  
  /*
    Function: getCoords
    
    Get the coords of the selector.
    
    Returns:
      (Object)
      - x1
      - y1
      - x2
      - y2
  */
  getCoords: function()
  {
    return this._coords;
  },
  
  /*
    Function: enable
    
    Enables the selector.
    
    Returns:
      this
  */
  enable: function()
  {
    this.el.stopObserving('mousedown');
    this.el.observe('mousedown', this._mousedown.bindAsEventListener(this));
    
    return this;
  },
  
  /*
    Function: disable
    
    Disables the selector.
    
    Returns:
      this
  */
  disable: function()
  {
    this.el.stopObserving('mousedown');
    return this;
  },
  
  _mousedown: function(e)
  {
    this.offset = this.el.viewportOffset(); 
    this.dimensions = this.el.getDimensions(); // Includes border/padding
    this.borderWidth = this.el.getBorderWidth();
    this.selectorBorderWidth = this.selectorDiv.getBorderWidth();

    this.borderXOffset = (
      this.borderWidth.left +
      this.selectorBorderWidth.left
    );
        
    this.borderYOffset = (
      this.borderWidth.top +
      this.selectorBorderWidth.top
    );
   
    // Check to make sure we aren't in the border or the container.
    var borderLeftRange = 
      $R(this.offset[0], (this.offset[0] + this.borderWidth.left - 1));
    var borderRightRange = 
      $R((this.offset[0] + this.dimensions.width - this.borderWidth.right + 1), (this.offset[0] + this.dimensions.width));
    var borderTopRange = 
      $R(this.offset[1], (this.offset[1] + this.borderWidth.top - 1));
    var borderBottomRange = 
      $R((this.offset[1] + this.dimensions.height - this.borderWidth.bottom + 1), (this.offset[1] + this.dimensions.height));    
    
    if (borderLeftRange.include(e.pointerX()) || borderRightRange.include(e.pointerX()))
      return;
    if (borderTopRange.include(e.pointerY()) || borderBottomRange.include(e.pointerY()))
      return;
    
    this._coords.x1 = e.pointerX() - this.offset[0] - this.borderXOffset;
    this._coords.y1 = e.pointerY() - this.offset[1] - this.borderYOffset;
    
    this.options.onMouseDown(this._coords);
    
    this.selectorDiv.setStyle({
      top: this._coords.y1 + 'px', 
      left: this._coords.x1 + 'px',
      width: '1px', 
      height: '1px',
      zIndex: '10'
    }).show();
  
    document.observe('mousemove', this._mousemove.bindAsEventListener(this));
    document.observe('mouseup', this._mouseup.bindAsEventListener(this));

    // Prevent selecting of elements (text).
    if (Prototype.Browser.IE)
    {
      document.observe('selectstart', function(e) { e.stop(); }); // Prevent text selection
      document.observe('dragstart', function(e) { e.stop(); }); // Prevent image drag
    }
    else if (Prototype.Browser.Gecko)
      e.stop();
  },
  _mousemove: function(e)
  {
    var tempX1 = 0;
    var tempY1 = 0;
    
    this._coords.x2 = e.pointerX() - this.offset[0] - this.borderXOffset;
    this._coords.y2 = e.pointerY() - this.offset[1] - this.borderYOffset;
        
    // Don't want to go to far top/left
    if (e.pointerX() < (this.offset[0] + this.borderXOffset))
      this._coords.x2 = 0;
  
    if (e.pointerY() < (this.offset[1] + this.borderYOffset))
      this._coords.y2 = 0;
    
    var maxX2 = (
      this.offset[0] + 
      this.dimensions.width - 
      this.borderXOffset
    );
    
    var maxY2 = (
      this.offset[1] + 
      this.dimensions.height - 
      this.borderYOffset 
    );
    
    // Don't want to go to far right/bottom
    if (e.pointerX() > maxX2)
      this._coords.x2 = 
        (this.dimensions.width - this.borderWidth.leftright - this.selectorBorderWidth.leftright);
  
    if (e.pointerY() > maxY2)
      this._coords.y2 = 
        (this.dimensions.height - this.borderWidth.topbottom - this.selectorBorderWidth.topbottom);

    // Set the width and height.
    var w = Math.abs(this._coords.x2 - this._coords.x1);
    var h = Math.abs(this._coords.y2 - this._coords.y1);
    
    tempX1 = this._coords.x1;
	  tempY1 = this._coords.y1;
    
    if (this._coords.x2 < this._coords.x1)
      tempX1 = this._coords.x2;
    if (this._coords.y2 < this._coords.y1)
      tempY1 = this._coords.y2;
    
    this.options.onMouseMove({x1: tempX1, y1: tempY1, x2: this._coords.x2, y2: this._coords.y2});
        
    this.selectorDiv.setStyle({
      top: tempY1 + 'px', 
      left: tempX1 + 'px',
      width: w + 'px', 
      height: h + 'px'
    });
  },
  _mouseup: function(e)
  {
    this.selectorDiv.hide();
    
    document.stopObserving('mousemove');
    document.stopObserving('mouseup');
    
    if (Prototype.Browser.IE)
    {
      document.stopObserving('dragstart');
      document.stopObserving('selectstart');
    }

    this.options.onMouseUp(this.getCoords());
  } 
});