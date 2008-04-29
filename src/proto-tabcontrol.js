/*
  Title: Proto.TabControl
  
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
  Class: Proto.TabControl
  
  Creates a tab control.
  
  Example:
  (start code)
  ...
  <div id="container">
    <div class="tabPage">
	    <span class="tabText">Tab 1</span>  
    </div>
    <div class="tabPage">
	    <span class="tabText">Tab 2</span>  
      Page 2
    </div>
    <div class="tabPage">
	    <span class="tabText">Tab 3</span>  
      Page 3
    </div>	
  </div>
  ...
  <script type="text/javascript">
    new Proto.TabControl('container');
  </script>
  ...
  (end)
*/

/*
  Group: CSS
    Sample CSS:
    
    (start code)
    .tabs {
      width: 100%;
      margin: 0;
      padding: 8px 0 3px 3px;
      border-bottom: 1px solid #ACA899;
      background-color: #DDD;
      list-style-type: none;
      text-align: left;
      font-size: 1em;
      font-family: Verdana, sans-serif;
    }
    
    .tabs li {
      display: inline;
      margin-right: 3px;
    }
    
    .tabs li a {
      padding: 3px 4px;
      border: 1px solid #ACA899;
      background-color: #CCD9F4;
      color: #000;
      text-decoration: none;
      border-bottom: none;
    }
    
    .tabs li.hover a {
      background-color: #94B0E8;
      border-color: #000;
      border-bottom: 1px solid #ACA899;
    }      
    
    .tabs li.selected a {
      position: relative;
      background-color: #FFF;
      border-bottom: 1px solid #FFF;
    }
    
    .tabPagesContainer {
      margin: 0;
      padding: 0;
      top: 0;
      left: 0;
      width: 100%;
      position: absolute;
    }
    
    .tabPagesContainer .tabPage {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      padding: 5px;
    }  
    (end)
*/

/*
  Group: Options
  
    Property: selectedIndex
    (Integer) The selected tab to start with. Defaults to: 0.
    
    Property: onTabPageSelecting
    An event that fires before the tab page changes.  This allows the user to
    determine if the tab page should change or not.  Defaults to: function() { return true; }
    
    Property: onResize
    An event that fires when the tab control resizes.
*/

/* 
  Group: Properties
  
    Property: options
    (Object) The options passed in the constructor.
    
    Property: tabPages
    (Array) Tab pages available in the tab control. Each contains the <Proto.TabPage> object.  
    
    Property: selectedIndex
    (Integer) Current tab selected index.
*/
Proto.TabControl = Class.create({
  /*
    Group: Constructor
    
    Constructor: initialize
    
    Constructor. Should not be called directly.
    
    Parameters:
      container - (String|HTMLElement) The container to be converted to a tab control.
      options - (Object) Options used to setup the tab control.
    
    Returns:
      Proto.Splitter
  */   
  initialize: function(container, options)
  {
    this.options = {
      selectedIndex: 0,
      onTabPageSelecting: function() { return true; },
      onResize: Prototype.emptyFunction
    };
    Object.extend(this.options, options || { });
    
    this.container = $(container);

    this.tabPages = $A();
    this.selectedIndex = this.options.selectedIndex;
    
    this._setupUI();
    this._setupEvents();
  },
  
  /* Group: Methods */
  
  /*
    Function: updateDimensions
    
    Updates the tab controls dimensions.
  */
  updateDimensions: function()
  {
    var th = this.tabs.getHeight();

    this.tabPagesContainer.setStyle({
      top: th + 'px',
      width: this.container.offsetWidth + 'px',
      height: (this.container.offsetHeight - th) + 'px'
    });
    
    this._updateSelectedTabDimensions();
    
    this.options.onResize();
  },

  /*
    Function: selectTab
    
    Selects the passed in tab index or tab page object.
    
    Parameters:
      value - (Integer|<Proto.TabPage>) The tab page index or object to select.
  */
  selectTab: function(value)
  {
    var index = 0;
    
    if (typeof value == 'number')
      index = value;
    else if (typeof value == 'object')
      index = value.index;
      
    this._selectTabByIndex(index);
  },
  
  /*
    Function: addTabPage
    
    Add a <Proto.TabPage> object to the tab control.
    
    Parameters:
      tp - (<Proto.TabPage>) The tab page to add.
      
    Returns:
      <Proto.TabPage>
  */
  addTabPage: function(tp)
  {
    if (tp.index == -1)
      tp.index = this.tabPages.length;
      
    this.tabPages.push(tp);
    
    this.tabs.insert(tp.tab);
    this.tabPagesContainer.insert(tp.tabPage);
    
    return tp;
  },
  
  _setupUI: function()
  {
    // Make sure the container is positioned absolutely or relatively
    this.container.setStyle({
      position: (this.container.getStyle('position') == 'absolute') ? 'absolute' : 'relative',
      overflow: 'hidden'
    });
    
    // Build our tabs ul and insert into the container
    this.tabs = new Element('ul', { className: 'tabs' });
    this.container.insert(this.tabs);
    
    // Build our tab pages container and insert into the container
    this.tabPagesContainer = new Element('div', { className: 'tabPagesContainer' });
    this.container.insert(this.tabPagesContainer);
    
    // Build our tab pages
    this._buildTabPages();
    
    this.updateDimensions();
    
    // Show the selected index tab page.
    this.selectTab(this.selectedIndex);    
  },
  
  _setupEvents: function()
  {
    // Update the tab control's dimensions if the text resizes.
    document.observe('text:resized', this.updateDimensions.bind(this));    
    
    // Update the tab control's dimensions if the window resizes.
    Event.observe(window, 'resize', this.updateDimensions.bind(this));
    
    // Update the dimensions of the tab control if this containers div:resized
    // event is fired.  Also, use event delegation to select tab pages.
    this.container
      .observe('div:resized', this.updateDimensions.bind(this))
      .observe('tabpage:selected', this._onTabPageSelected.bindAsEventListener(this));
  },
  
  _buildTabPages: function()
  {
    var tabPages = this.container.childElements().grep(new Selector('.tabPage')); 
    
    tabPages.each(function(tp, i)
    {
      var tp = new Proto.TabPage(tp, {
        index: i
      });
      
      this.addTabPage(tp);
    }.bind(this));
  },
  
  _onTabPageSelected: function(e)
  {
    // Do not allow the tab page to change if the user returns false in the 
    // onTabChange event handler.
    if (!this.options.onTabPageSelecting(e)) return;
        
    this.selectTab(e.memo.tabPage);
    
    // Using event delegation, stop the event so it doesn't bubble anymore.
    e.stop();
  },
    
  _selectTabByIndex: function(index)
  {
    // Hide all tab pages
    this.tabPages.invoke('deselect');
        
    this.selectedIndex = index;
    this.tabPages[index].select();
    
    this._updateSelectedTabDimensions()
  },
  
  _updateSelectedTabDimensions: function()
  {
    var tpcd = this.tabPagesContainer.getAllDimensions();
    
    var tp = this.tabPages[this.selectedIndex];
    
    var tpb = tp.tabPage.getBorderWidth();
    var tpp = tp.tabPage.getPadding();
    
    var tabPageWidth = (this.tabPagesContainer.offsetWidth - tpb.leftright - tpp.leftright);
    var tabPageHeight = (this.tabPagesContainer.offsetHeight - tpb.topbottom - tpp.topbottom);      

    tp.tabPage.setStyle({
      width: tabPageWidth + 'px',
      height: tabPageHeight + 'px'
    });
  }
});

/*
  Class: Proto.TabPage
  
  Creates a tab page to be used with a tab control.
  
  Example:
  (start code)
  ...
  <div id="container">
    <div class="tabPage">
	    <span class="tabText">Tab 1</span>  
    </div>
    <div class="tabPage">
	    <span class="tabText">Tab 2</span>  
      Page 2
    </div>
  </div>
  ...
  <script type="text/javascript">
    var tabControl = new Proto.TabControl('container'); // Creates two tab pages.
    
    // Create and add the third tab page.
    var tp3 = new Proto.TabPage(null, {
      tabText: 'Page 3'
    }).update('Page 3');
    
    tabControl.addTabPage(tp3);
  </script>
  ...
  (end)
*/

/*
  Group: Options
  
    Property: index
    (Integer) The index of the tab. Defaults to: 0.
    
    Property: tabText
    (String) The text to use for the tab.    
*/

/* 
  Group: Properties
  
    Property: options
    (Object) The options passed in the constructor.
    
    Property: tab
    (HTMLElement) The tab (li) element.
    
    Property: tabPage
    (HTMLElement) The tab page (div) elemenet.

*/
Proto.TabPage = Class.create({
  /*
    Group: Constructor
    
    Constructor: initialize
    
    Constructor. Should not be called directly.
    
    Parameters:
      el - (String|HTMLElement) The element to convert to a tab page.
      options - (Object) Options used to setup the tab page.
    
    Returns:
      Proto.TabPage
  */    
  initialize: function(el, options)
  {
    this.options = {
      index: -1,
      tabText: null
    };
    Object.extend(this.options, options || { });

    this.tabPage = $(el);

    if ((typeof el == 'undefined') || (el == null)) 
      this.tabPage = new Element('div', { className: 'tabPage' });

    this.index = this.options.index;
    
    this._setupTabPage();
  },
  
  /* Group: Methods */
 
  /*
    Function: select
    
    Selects the tab page.
    
    Notes:
      This does not actually fire the tabpage:selected event, rather is updates
      class names on the tab and shows the tab page.  If you want to select a
      tab, use the <Proto.TabControl.selectTab> method.
    
    Returns:
      <Proto.TabPage>
  */
  select: function()
  {
    this.tab.removeClassName('hover').addClassName('selected');
    this.tabPage.show();
    return this;
  },
  
  /*
    Function: deselect
    
    Deselects the tab page.
    
    Returns:
      <Proto.TabPage>
  */
  deselect: function()
  {
    this.tab.removeClassName('selected');
    this.tabPage.hide();
    return this;
  },
  
  /*
    Function: update
    
    Updates the tab page content.
    
    Parameters:
      content - (String|Object) The content to update the tab page with.
      
    Notes:
      This is shortcut for this.tabPage.update(content)
      
    Returns:
      <Proto.TabPage>
  */
  update: function(content)
  {
    this.tabPage.update(content);
    return this;
  },
    
  _setupTabPage: function()
  {
    // Create our tab LI element
    this.tab = new Element('li');

    // Create the text element for the tab
    this.tabText = new Element('a', { href: '##' });
    
    if (this.tabPage.down('span.tabText')) 
    {
      this.tabText.update(this.tabPage.down('span.tabText').innerHTML);
      this.tabPage.down('span.tabText').remove();
    }
    else 
      this.tabText.update(this.options.tabText);

    // Insert the tab text element into the tab.
    this.tab.insert(this.tabText);
  
    // Add a hover class name to the tab.
    this.tab.addHoverClassName('hover');  
    
    this.tabText
      .observe('click', this._onTabClick.bindAsEventListener(this))
      .observe('focus', function() // Hide dotted line around link.
      {
        this.setStyle({outline: 'none'}); 
        this.hideFocus = true; 
      }); 
    
    // By default, deselect this tab.
    this.deselect();            
  },
  
  _onTabClick: function(e)
  {
    this.tab.fire('tabpage:selected', {tabPage: this});
    e.stop();
  }
});