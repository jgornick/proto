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
  <ul class="tree" id="test_tree"></ul>
  ...
  <script type="text/javascript">
    var tree = new Proto.Tree('test_tree', {});
    
    // Create our first tree node and add it to the tree.
    var item1 = new Proto.Tree.Node({
      text: 'Item 1'
    });
    tree.add(item1);
    
    // Now, let's create a couple of tree nodes and add them to our first tree node.
    var item2 = new Proto.Tree.Node({
      text: 'Item 2'
    });
    var item4 = new Proto.Tree.Node({
      text: 'Item 4'
    });        
    item1.add(item2);
    item1.add(item4);
    
    // Add a child tree node to our newly created item 4.
    item4.add(new Proto.Tree.Node({
      text: 'Item 5'
    }));
    
    // Create another tree node and add that to our item 2 tree node.  Notice
    // how we binded a function to the onClick event.
    var item3 = new Proto.Tree.Node({
      text: 'Item 3',
      onClick: function(node) { alert(node.options.text); }
    });
    item2.add(item3);
    
    // Collapse all nodes in the tree.
    tree.close(true);
  </script>
  ...
  (end)

*/

/*
  Group: CSS
  
  Sample CSS:
  (start code)
  ul.tree, ul.tree ul {
    list-style-type: none;
    background: url(../img/vline.png) repeat-y;
    margin: 0;
    padding: 0;
    display: block;
  }
  
  ul.tree li.closed ul {
    display: none;
  }
  
  ul.tree ul {
    margin-left: -10px;
  }
  
  ul.tree li span.hover {
    text-decoration: underline;
  }      

  ul.tree li.children,
  ul.tree li.children.last {
    background: #fff url(folder_image.png) no-repeat;
  }
  
  ul.tree li,
  ul.tree li.last {
    margin: 0;
    padding: 0 20px;
    line-height: 1.2em;
    background: #fff url(image.png) no-repeat;
  }  
  (end)
*/

/* 
  Group: Properties
  
  Property: el
  (HTMLElement) The tree (ul) element.
  
  Property: nodes
  (Array) A list of <Proto.Tree.Node>.
*/

Proto.Tree = Class.create({
  /*
    Group: Constructor
    
    Constructor: initialize
    
    Constructor. Should not be called directly.
    
    Parameters:
      element - (String|HTMLElement) The tree element to convert.
    
    Returns:
      Proto.Tree
  */
  initialize: function (element) 
  {
    this.el = $(element);
    
    this.nodes = $A();
  },
  
  /* Group: Methods */
 
  /*
    Function: add
    
    Adds the specified <Proto.Tree.Node> to the el and nodes array.
    
    Parameters:
      node - (<Proto.Tree.Node>) The tree node to add.
  */
  add: function(node)
  {
    this.el.insert(node.el);
    this.nodes.push(node);
  },

  /*
    Function: open
    
    Expand tree nodes.  When all is specified true, will expand all tree nodes.
    Default behaivor will only expand the nodes on the same level as this node.
    
    Parameters:
      all - (Boolean) Tells whether to expand nodes recursivly. Defaults to: false.
  */
  open: function(all)
  {
    if (typeof all == 'undefined') all = false;
    this.nodes.invoke('open', all);
  },
  
  /*
    Function: close
    
    Collapse tree nodes.  When all is specified true, will collapse all tree nodes.
    Default behaivor will only collapse the nodes on the same level as this node.
    
    Parameters:
      all - (Boolean) Tells whether to collapse nodes recursivly. Defaults to: false.
  */
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
  <ul class="tree" id="test_tree"></ul>
  ...
  <script type="text/javascript">
    var tree = new Proto.Tree('test_tree', {});
    
    // Create our first tree node and add it to the tree.
    var item1 = new Proto.Tree.Node({
      text: 'Item 1',
      onClick: function(node) { alert('clicked'); });
    });
    
    tree.add(item1);
  </script>
  ...
  (end)
*/

/*
  Group: Options
  
  Propert: text
  (String) The text to use for the node. Default to blank.
  
  Property: onClick
  An event fired when the node is clicked.
*/

/* 
  Group: Properties
  
  Property: el
  (HTMLElement) The tree node (li) element.
  
  Property: childNodes
  (Array) List of <Proto.Tree.Node>.
*/
Proto.Tree.Node = Class.create({
  /*
    Group: Constructor
    
    Constructor: initialize
    
    Constructor. Should not be called directly.
    
    Parameters:
      options - (Object) Options used to setup the tree node.
    
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
  
  /* Group: Methods */

  /*
    Function: add
    
    Adds the specified <Proto.Tree.Node> to the el and childNodes array.
    
    Parameters:
      node - (<Proto.Tree.Node>) The tree node to add.
  */
  add: function(node)
  {
    var ul = new Element('ul');
    ul.insert(node.el);
    
    this.el.insert(ul);
    
    this._setHasChildren();
    
    if (this.childNodes.last())
      this.childNodes.last()._removeLast();
    
    this.childNodes.push(node);
    this.childNodes.last()._setLast();    
  },

  /*
    Function: open
    
    Expand tree nodes.  When all is specified true, will expand all tree nodes.
    Default behaivor will only expand the nodes on the same level as this node.
    
    Parameters:
      all - (Boolean) Tells whether to expand nodes recursivly. Defaults to: false.
  */
  open: function(all) 
  {
    if (typeof all == 'undefined') all = false;    
    
    this.el.removeClassName('closed');
    if (all) this.childNodes.invoke('open', all);    
  },
  
  /*
    Function: close
    
    Collapse tree nodes.  When all is specified true, will collapse all tree nodes.
    Default behaivor will only collapse the nodes on the same level as this node.
    
    Parameters:
      all - (Boolean) Tells whether to collapse nodes recursivly. Defaults to: false.
  */
  close: function(all) 
  {
    if (typeof all == 'undefined') all = false;
    
    this.el.addClassName('closed');
    if (all) this.childNodes.invoke('close', all);
  },
  
  /*
    Function: hasChildren
    
    Returns whether the node has children.
    
    Returns:
      (Boolean)
  */
  hasChildren: function()
  {
    return this.el.childNodes.length > 0;
  },

  _build: function()
  {
    this.el = new Element('li');
    var span = new Element('a', { href: '#'})
      .addClassName('node')
      .update(this.options.text);
    
    this.el.insert(span);
    
    this.el.observe('click', this._onClick.bind(this));
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
  
  _setLast: function() 
  {
    this.el.addClassName('last');
  },
  
  _removeLast: function()
  {
    this.el.removeClassName('last');    
  },
  
  _setHasChildren: function() {
    this.el.addClassName('children');
  },
  
  _removeHasChildren: function() {
    this.el.removeClassName('children');
  }
});
