/**
 * @author Joe Gornick
 * @version 0.1
 * 
 * @requires Prototype JavaScript Framework 1.6.0.2 - http://prototypejs.org/download
 * @requires Proto.ElementMethods - proto-methods.js
 * @requires Proto.Observable - proto-observable.js 
 * 
 * @license MIT
 */

if (typeof Proto == 'undefined') var Proto = {};

Element.addMethods(Proto.ElementMethods);

Proto.Toolbar = Class.create({
  initialize: function(container, options)
  {
    this.options = {
    };
    Object.extend(this.options, options || { });
    
    this.container = $(container);
    this.items = $A();
    
    this._build();
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
  },
  
  addItem: function(item)
  {
    item.observe('image:loaded', this._updateDimensions.bind(this));
    
    this.items.push(item);   
    this.toolbar.insert(item.element);
  }  
});

Proto.ToolbarButton = Class.create(Proto.Observable, {
  initialize: function(options)
  {
    this.options = {
      text: null,
      image: null,
      imageDimensions: { width: 24, height: 24 },
      checked: false,
      checkOnClick: false,
      onClick: Prototype.emptyFunction
    };
    Object.extend(this.options, options || { });

    this._build();    
  },
  
  check: function()
  {   
    this.options.checked = true;

    this._onClick();

    this.element.addClassName('pressed');    
  },
  
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
