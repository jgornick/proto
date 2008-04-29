/**
 * @author Joe Gornick
 * @version 0.1
 * 
 * @requires Prototype JavaScript Framework 1.6.0.2 - http://prototypejs.org/download
 * @requires Proto.ElementMethods - proto-methods.js
 * 
 * @license MIT
 */

if (typeof Proto == 'undefined') var Proto = {};

Element.addMethods(Proto.ElementMethods);

Proto.TabControl = Class.create({
  initialize: function(container, options)
  {
    this.options = {
      selectedIndex: 0,
      tabsStyle: {},
      tabStyle: {},
      tabSelectedStyle: {},
      tabHoverStyle: {},
      tabDisabledStyle: {},
      tabPagesContainerStyle: {},
      tabPageStyle: {},      
      disableInlineStyles: false,
      onTabPageSelecting: function() { return true; },
      onResize: Prototype.emptyFunction
    };
    Object.extend(this.options, options || { });
    
    this.container = $(container);

    this.tabPages = $A();
    this.selectedIndex = this.options.selectedIndex;
    
    this._setupUI();

    document.observe('text:resized', this._updateDimensions.bind(this));    
    this.container.observe('div:resized', this._updateDimensions.bind(this));
    Event.observe(window, 'resize', this._updateDimensions.bind(this));
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
    
    if (!this.options.disableInlineStyles)
    {
      this.tabs.setStyle({
        width: '100%',

        margin: 0,

        padding: '8px 0 3px 3px',
        
        borderBottom: '1px solid #ACA899',
        backgroundColor: '#DDD',
        
        listStyleType: 'none',
        textAlign: 'left',
        fontSize: '1em',
        fontFamily: 'Verdana, sans-serif'
      })
      .setStyle(this.options.tabsStyle);
    }
    
    this.container.insert(this.tabs);
    
    // Build our tab pages container and insert into the container
    this.tabPagesContainer = new Element('div', { className: 'tab-pages-container' });
    
    if (!this.options.disableInlineStyles)
    {
      this.tabPagesContainer.setStyle({
        margin: 0,
        padding: 0,
        top: 0,
        left: 0,
        width: '100%',
        position: 'absolute'
      })
      .setStyle(this.options.tabPagesContainerStyle);
    }
    
    this.container.insert(this.tabPagesContainer);
    
    // Build our tab pages
    this._buildTabPages();
    
    this._updateDimensions();
    
    // Show the selected index tab page.
    this.selectTab(this.selectedIndex);    
  },
  
  _updateDimensions: function()
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
  
  _buildTabPages: function()
  {
    var tabPages = this.container.childElements().grep(new Selector('.tabpage')); 

    tabPages.each(function(tp, i)
    {
      this.tabPages.push(new Proto.TabPage(tp, {
        index: i,
        tabStyle: this.options.tabStyle,
        tabSelectedStyle: this.options.tabSelectedStyle,
        tabHoverStyle: this.options.tabHoverStyle,
        tabDisabledStyle: this.options.tabDisabledStyle,
        tabPageStyle: this.options.tabPageStyle,
        disableInlineStyles: this.options.disableInlineStyles
      }));
    }.bind(this));
       
    var tabs = this.container.down('ul.tabs');    
    var tabPagesContainer = this.container.down('div.tab-pages-container');
    
    this.tabPages.each(function(tp)
    {
      tabs.insert(tp.tab);
      tabPagesContainer.insert(tp.tabPage);
      
      tp.tab.observe('tabpage:selected', this._onTabPageSelected.bindAsEventListener(this));
    }.bind(this));
  },
  
  _onTabPageSelected: function(e)
  {
    // Do not allow the tab page to change if the user returns false in the 
    // onTabChange event handler.
    if (!this.options.onTabPageSelecting(e)) return;
        
    this.selectTab(e.memo.tabPage);
  },
  
  selectTab: function(value)
  {
    var index = 0;
    
    if (typeof value == 'number')
      index = value;
    else if (typeof value == 'object')
      index = value.index;
      
    this._selectTabByIndex(index);
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

Proto.TabPage = Class.create({
  initialize: function(el, options)
  {
    this.options = {
      index: 0,
      tabStyle: {},
      tabSelectedStyle: {},
      tabHoverStyle: {},
      tabDisabledStyle: {},
      tabPageStyle: {},
      disableInlineStyles: false
    };
    Object.extend(this.options, options || { });
    
    this.tabStyle = {
      margin: '0 3px 0 0',
      padding: '3px 4px',
      border: '1px solid #ACA899',
      backgroundColor: '#CCD9F4',
      color: '#000',

      textDecoration: 'none',

      borderBottom: 'none'
    };
    Object.extend(this.tabStyle, this.options.tabStyle || { });
    
    this.tabSelectedStyle = {
      position: 'relative',
      backgroundColor: '#FFF',
      borderBottom: '1px solid #FFF'
    };
    Object.extend(this.tabSelectedStyle, this.options.tabSelectedStyle || { });    
    
    this.tabHoverStyle = {
      backgroundColor: '#94B0E8',
      borderColor: '#000',
      borderBottom: '1px solid #ACA899'
    };
    Object.extend(this.tabHoverStyle, this.options.tabHoverStyle || { });
    
    this.tabDisabledStyle = {
    };
    Object.extend(this.tabDisabledStyle, this.options.tabDisabledStyle || { });    
    
    this.tabPage = $(el);

    this.index = this.options.index;
    
    this._setupTabPage();
  },
  
  _setupTabPage: function()
  {
    // Create our tab LI element
    this.tab = new Element('li');
    
    // Create the text element for the tab and get the text from the element
    this.tabText = new Element('a', { href: '##' })
      .update(this.tabPage.down('span.tab-text').innerHTML);

    if (!this.options.disableInlineStyles)
    {
      // Take the marginRight and set it to the LI instead of the A.
      var margin = this.tabStyle.margin;
      
      if (margin != null)
        this.tabStyle.margin = 0;
      else
        margin = 0;
                 
      this.tabText.setStyle(this.tabStyle);

      this.tab.setStyle({
        margin: margin,
        display: 'inline'
      });  
    }
    
    // Insert the tab text element into the tab.
    this.tab.insert(this.tabText);
            
    this.tabPage.down('span.tab-text').remove();
    
    this.tabPage.setStyle({
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      padding: '5px'
    });
    this.tabPage.setStyle(this.options.tabPageStyle);
    
    // Start to observe our mouseover, mouseout events
    this._observeTabMouseHoverEvents();    

    this.tabText
      .observe('click', this._onTabClick.bindAsEventListener(this))
      .observe('focus', function() // Hide dotted line around link.
      {
        this.setStyle({outline: 'none'}); 
        this.hideFocus = true; 
      });       
  },
  
  _onTabClick: function(e)
  {
    this.tab.fire('tabpage:selected', {tabPage: this});
    e.stop();
  },
  
  _observeTabMouseHoverEvents: function()
  {
    this.tab.observe('mouseover', function(e) 
    { 
      this.tabText.setStyle(this.tabHoverStyle);
      this.tab.addClassName('hover');      
    }.bind(this));

    this.tab.observe('mouseout', function(e) 
    { 
      this.tabText.setStyle(this.tabStyle);
      this.tab.removeClassName('hover');      
    }.bind(this));      
  },
  
  _stopObservingTabMouseHoverEvents: function()
  {
    this.tab.stopObserving('mouseover');
    this.tab.stopObserving('mouseout');
  },
  
  select: function()
  {
    this._stopObservingTabMouseHoverEvents();
    
    this.tabText.setStyle(this.tabSelectedStyle);
    this.tab.addClassName('selected');
    this.tab.setStyle({
      borderBottom: this.tabText.getStyle('border-bottom'),
      backgroundColor: this.tabText.getStyle('background-color')
    });    
    
    this.tabPage.show();
  },
  
  deselect: function()
  {
    this._observeTabMouseHoverEvents();
    
    this.tabText.setStyle(this.tabStyle);
    this.tab.removeClassName('selected');      
    this.tab.setStyle({
      borderBottom: this.tabText.getStyle('border-bottom'),
      backgroundColor: this.tabText.getStyle('background-color')
    });    
    this.tabPage.hide();
  },
  
  update: function(content)
  {
    this.tabPage.update(content);
    return this;
  }
});