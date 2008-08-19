/*
  Title: Proto.Toolbar
  
  About: Author
  Joe Gornick
  
  About: Version
  0.1
  
  About: License
  This file is licensed under the MIT license.
  
  About: Required Libraries
  Prototype JavaScript Framework 1.6.0.2 <http://prototypejs.org/download>
  
  Proto.ElementMethods <Proto.ElementMethods>
  
  Proto.Observable <Proto.Observable>
*/
if (typeof Proto == 'undefined') var Proto = {};

Element.addMethods(Proto.ElementMethods);

/*
  Class: Proto.Toolbar
  
  Create a toolbar.
  
  Example:
  (start code)
  ...
  <div id="container"></div>
  ...
  <script type="text/javascript">         
    var toolbar = new Proto.Toolbar($('container'));
    toolbar.addItem(new Proto.ToolbarButton({
      text: 'Pan',
      image: 'pan_toolbar.gif',
      checkOnClick: true,
      onClick: function(el) { toolbar.items.invoke('uncheck'); }
    }));
    toolbar.addItem(new Proto.ToolbarButton({
      text: 'Zoom Extents',
      image: 'zoom_extents_toolbar.gif',
      onClick: function(el) { }
    }));      
    toolbar.addItem(new Proto.ToolbarButton({
      text: 'Zoom In',
      image: 'zoom_in_toolbar.gif',
      checkOnClick: true,
      onClick: function(el) { toolbar.items.invoke('uncheck'); }
    })); 
  </script>
  (end)
*/

/*
  Group: CSS
    Sample CSS:
    (start code)
    .toolbar {
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 5;
    }
    
    .toolbarButtons {
      position: relative;
      margin: 0;
      padding: 0;
      list-style: none;     
      z-index: 2;        
    }

    .toolbarButtons li {
      margin: 0;
      padding: 5px;
      line-height: 1px;
    }

    .toolbarButtons li a {
      display: block;
      padding: 2px;
      padding-bottom: 1px;
    }
    
    .toolbarButtons li.raised a {
      border-top: 1px solid #C0C0C0;
      border-left: 1px solid #C0C0C0;
      border-bottom: 1px solid #535353;
      border-right: 1px solid #535353;
      padding: 1px;
      padding-bottom: 0px;        
    }
    
    .toolbarButtons li.pressed a {
      border-top: 1px solid #535353;
      border-left: 1px solid #535353;
      border-bottom: 1px solid #C0C0C0;
      border-right: 1px solid #C0C0C0;
      padding: 1px;
      padding-bottom: 0px;
    }

    .toolbarButtons li a img {
      border: 0;
    }          
    (end)
*/

/* 
  Group: Properties
  
    Property: items
    (Array) An array of available toolbar items.

    Property: container
    (HTMLElement) The toolbar container element.
*/
Proto.Toolbar = Class.create({
  /*
    Group: Constructor
    
    Constructor: initialize
    
    Constructor. Should not be called directly.
    
    Parameters:
      container - (String|HTMLElement) The toolbar container element.
    
    Returns:
      Proto.Toolbar
  */  
  initialize: function(container)
  {
    this.container = $(container);
    this.items = $A();
    
    this._build();
  },
  
  /* Group: Methods */
 
  /*
    Function: addItem
    
    Adds an item to the toolbar.
    
    Parameters:
      item - (<Proto.ToolbarButton>) The item to add to the toolbar.
  */
  addItem: function(item)
  {
    item.observe('image:loaded', this._updateDimensions.bind(this));
    
    this.items.push(item);   
    this.toolbar.insert(item.element);
  },  
  
  _build: function()
  {
    this.toolbarContainer = new Element('div', { className: 'toolbar' });
    
    this.toolbar = new Element('ul', { className: 'toolbarButtons' });
    
    this.toolbarBackground = new Element('div', { className: 'toolbarBackground' });
    this.toolbarBackground.setStyle({
      position: 'absolute',      
      top: 0,
      width: '1px',
      height: '1px',         
      backgroundColor: '#D9D6C0',    
      border: '1px solid #C4BA86',    
      opacity: 0.5
    });
    
    this.container.insert(
      this.toolbarContainer
        .insert(this.toolbar)
        .insert(this.toolbarBackground)
    );
  },
  
  _updateDimensions: function()
  {
    var d = this.toolbarContainer.getDimensions();
    var bd = this.toolbarBackground.getAllDimensions();
    
    this.toolbarBackground.setStyle({
      width: (d.width - bd.border.leftright - bd.padding.leftright) + 'px',
      height: (d.height - bd.border.topbottom - bd.padding.topbottom) + 'px'
    });
  } 
});

/*
  Class: Proto.ToolbarButton
  
  Create a toolbar button item.
  
  Example:
  (start code)
  ...
  <div id="container"></div>
  ...
  <script type="text/javascript">         
    var toolbar = new Proto.Toolbar($('container'));
    toolbar.addItem(new Proto.ToolbarButton({
      text: 'Pan',
      image: 'pan_toolbar.gif',
      checkOnClick: true,
      onClick: function(el) { toolbar.items.invoke('uncheck'); }
    }));
  </script>
  (end)
  
  Notes:
  Mixes in <Proto.Observable>.
*/

/*
  Group: Options
  
    Property: text
    (String) Text to associate the button with.
    
    Property: image
    (String) Path to image for button.
    
    Property: checked
    (Boolean) Contains the value whether the button is checked or not.
    
    Property: checkOnClick
    (Boolean) Determines whether the button holds a state of being checked when
    clicked. The behaivor of a checked button would be pressed when clicked. 
    Defaults to false.
    
    Property: onClick
    An event fired when the button is clicked.
*/

/* 
  Group: Properties
  
    Property: options
    (Object) The options passed in the constructor.
*/
Proto.ToolbarButton = Class.create(Proto.Observable, {
  /*
    Group: Constructor
    
    Constructor: initialize
    
    Constructor. Should not be called directly.
    
    Parameters:
      options - (Object) Options to setup the toolbar button.
    
    Returns:
      Proto.ToolbarButton
  */   
  initialize: function(options)
  {
    this.options = {
      text: null,
      image: null,
      checked: false,
      checkOnClick: false,
      onClick: Prototype.emptyFunction
    };
    Object.extend(this.options, options || { });

    this._build();    
  },
  
  /* Group: Methods */
  
  /*
    Function: check
    
    Checks the button. Add a class name of 'pressed'. Fires the onClick.
  */
  check: function()
  {   
    this.options.checked = true;

    this._onClick();

    this.element.addClassName('pressed');    
  },

  /*
    Function: uncheck
    
    Unchecks the button.
  */
  uncheck: function()
  {
    this.options.checked = false;
    this.element.removeClassName('pressed');
  },
  
  _build: function()
  {
    this.element = new Element('li');
    
    var a = new Element('a', {
      href: '##',
      title: this.options.text
    });

    a.setStyle({
      outline: 'none'
    });
       
    a.observe('mousedown', this._onMouseDown.bind(this));
    a.observe('mouseover', this._onMouseOver.bind(this));
    a.observe('mouseout', this._onMouseOut.bind(this));

    var img = new Element('img', { 
      src: this.options.image, 
      alt: this.options.text
    });
    img.observe('load', function()
    {
      this.fire('image:loaded');
    }.bind(this));
    
    this.element.insert(a.insert(img));
  },
  
  _onClick: function()
  {
    this.options.onClick(this);
  },
  
  _onMouseDown: function(e)
  {
    this.element.removeClassName('raised');
       
    this.check();
    
    document.observe('selectstart', function(e) { e.stop(); }); // Prevent text selection
    document.observe('dragstart', function(e) { e.stop(); }); // Prevent image drag
    document.observe('mouseup', this._onMouseUp.bind(this));
    
    e.stop();
  },
  
  _onMouseUp: function()
  {
    if (!this.options.checkOnClick) this.uncheck();
      
    document.stopObserving('selectstart');
    document.stopObserving('dragstart');
    document.stopObserving('mouseup');
  },
  
  _onMouseOver: function()
  {
    if (this.options.checked) return;
    
    this.element.addClassName('raised');
  },
  
  _onMouseOut: function()
  {
    if (this.options.checked) return;
    
    this.element.removeClassName('raised');
  }
});
