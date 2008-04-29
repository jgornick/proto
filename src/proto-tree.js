/*
  Title: Proto.Tree
  
  About: Author
  Joe Gornick
  
  About: Version
  0.1
  
  About: License
  This file is licensed under the MIT license.
  
  About: Required Libraries
  Prototype JavaScript Framework 1.6.0.2 <http://prototypejs.org/download>
*/

if (Object.isUndefined(Proto)) { var Proto = { } };

/*
  Class: Proto.Tree
  
  Example:
  (start code)
  ...
  (end)

*/

/*
  Group: Options
*/

/* 
  Group: Properties
*/

Proto.Tree = Class.create({
  /*
    Group: Constructor
    
    Constructor: initialize
    
    Constructor. Should not be called directly.
    
    Parameters:
      element - 
      options - 
    
    Returns:
      Proto.Tree
  */
  initialize: function (element, options) 
  {
    this.options = {
    };
    Object.extend(this.options, options || {});

    this.el = $(element);
    
    this.nodes = $A();
  },
  
  add: function(node)
  {
    this.el.insert(node.el);
    this.nodes.push(node);
  },

  open: function(all)
  {
    if (typeof all == 'undefined') all = false;
    this.nodes.invoke('open', all);
  },
  
  close: function(all)
  {
    if (typeof all == 'undefined') all = false;
    this.nodes.invoke('close', all);
  }
});

/*
  Class: Proto.Tree.Node
  
  Example:
  (start code)
  ...
  (end)
*/

/*
  Group: Options
*/

/* 
  Group: Properties
*/
Proto.Tree.Node = Class.create({
  /*
    Group: Constructor
    
    Constructor: initialize
    
    Constructor. Should not be called directly.
    
    Parameters:
      options - 
    
    Returns:
      Proto.Tree.Node
  */
  initialize: function(options) 
  {
    this.options = {
      text: '',
      onClick: Prototype.emptyFunction
    };
    Object.extend(this.options, options || {});
    
    this.el = null;
    this.childNodes = $A();
    
    this._build();
  },

  add: function(node)
  {
    var ul = new Element('ul');
    ul.insert(node.el);
    
    this.el.insert(ul);
    
    this.setHasChildren();
    
    if (this.childNodes.last())
      this.childNodes.last().removeLast();
    
    this.childNodes.push(node);
    this.childNodes.last().setLast();    
  },

  _build: function()
  {
    this.el = new Element('li');
    var span = new Element('span').update(this.options.text);
    
    this.el.insert(span);
    
    this.el
      .setStyle({
        cursor: 'pointer'
      })
	    .observe('click', this._onClick.bind(this));
    
    this.el.down('span')
      .observe('mouseover', function() { this.addClassName('hover'); })
      .observe('mouseout', function() { this.removeClassName('hover'); });
  },
  
  _onToggle: function() 
  {
    if(this.el.hasClassName('closed'))
      this.open();
    else
      this.close();
  },

  _onClick: function(e) 
  {
    e.stop();
    
    if(this.hasChildren())    
      this._onToggle();
    
    this.options.onClick(this);
  },
  
  open: function(all) 
  {
    if (typeof all == 'undefined') all = false;    
    
    this.el.removeClassName('closed');
    if (all) this.childNodes.invoke('open', all);    
  },
  
  close: function(all) 
  {
    if (typeof all == 'undefined') all = false;
    
    this.el.addClassName('closed');
    if (all) this.childNodes.invoke('close', all);
  },

  setLast: function() 
  {
    this.el.addClassName('last');
  },
  
  removeLast: function()
  {
    this.el.removeClassName('last');    
  },
  
  setHasChildren: function() {
    this.el.addClassName('children');
  },
  
  removeHasChildren: function() {
    this.el.removeClassName('children');
  },  
  
  hasChildren: function()
  {
    return this.el.hasClassName('children');
  }
});
