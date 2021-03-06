/*
  Title: Proto.Accordion
  
  About: Author
  Joe Gornick
  
  About: Version
  0.1
  
  About: License
  This file is licensed under the MIT license.
  
  About: Required Libraries
  Prototype JavaScript Framework 1.6.0.2 <http://prototypejs.org/download>
  
  Proto.ElementMethods <Proto.ElementMethods>
  
  About: Optional Libraries
  Script.aculo.us Effects.js 1.8.0 <http://script.aculo.us/downloads>
*/

if (typeof Proto == 'undefined') var Proto = {};

Element.addMethods(Proto.ElementMethods);

/*
  Class: Proto.Accordion
  
  Convert your elements to an accordion.
  
  Example:
  (start code)
  ...
  <ul id="accordion">
    <li class="toggle">Toggle #1</li>
    <li class="content">Toggle #1 Content</li>
    <li class="toggle">Toggle #2</li>
    <li class="content">Toggle #2 Content</li>
    <li class="toggle">Toggle #3</li>
    <li class="content">Toggle #3 Content</li>
  </ul>
  ...
  <script type="text/javascript">
    var accordion = new Proto.Accordion('accordion', {
      useEffects: true
    });
  </script>
  (end)
  
  Assumptions:
    - The element to follow an element with class of "toggle" must be class of "content"
*/

/*
  Group: CSS
    Sample CSS:
    (start code)
    .toggle {
      font-size: 1em;
      
      height: 2em;
      line-height: 2em;
      
    	display: block;
      margin: 0;
    	padding: 0 25px;  
      
    	background: #DDD;
      color: #000;
    	border-bottom: 1px solid #ACA899;
      
      font-weight: normal;
    	text-decoration: none;
    	
      outline: none;
     
    	cursor: pointer;
    }

    .toggle.active {
    	background-color: #FFC848;
    	color: #000;
    	border-bottom: 1px solid #FBAF00;
    }
    
    .content {
    	background-color: #FFF;
    	color: #000;
    	overflow: hidden;
    }

    .content div.contentBody {
      padding: 20px;
    }
    (end)
*/

/*
  Group: Options
  
    Property: sectionIndex
    (Integer) Used to specify the section to show after loaded.
    
    Property: useEffects
    (Boolean) Use script.aculo.us slide effects when toggling sections.  Requires script.aculo.us effects library.
    
    Property: effectOptions
    (Object) Script.aculo.us slide effect options.
    
    Property: singleActive
    (Boolean) Only show no more than one section at any given time.
    
    Property: onShowSection
    An event which fires after the section is showing.
    
    Property: onHideSection
    An event which fires after the section is hidden.
*/

/* 
  Group: Properties
  
    Property: sections
    (Array) An array of available accordion sections.
    
    Property: options
    (Object) The options passed in the constructor.
    
    Property: el
    (HTMLElement) The accordion element.
*/

Proto.Accordion = Class.create({
  /*
    Group: Constructor
    
    Constructor: initialize
    
    Constructor. Should not be called directly.
    
    Parameters:
      el - (String|HTMLElement) A string or the element that will be converted to an accordion.
      options - (Object) The options object to use when setting up the accordion.
    
    Returns:
      Proto.Accordion
  */
  initialize: function(el, options)
  {
    this.options = {
      sectionIndex: null,
      useEffects: false,
      effectOptions: {},
      singleActive: false,
      accordionHeight: 0,
      onShowSection: Prototype.emptyFunction,
      onHideSection: Prototype.emptyFunction
    };
    Object.extend(this.options, options || { });
    
    this.el = $(el);
    
    this.sections = $A();
    
    this._animating = false;
    
    // Gather our toggles
    this.el.childElements().grep(new Selector('.toggle')).each(function(toggle, i)
    {
      this._addSection({
        toggle: toggle,
        content: toggle.next(),
        active: false,
        index: i     
      });
    }.bind(this));
    
    this.hideAllSections({ useEffects: false }); // Hide all sections by default
    
    // If the sectionIndex is specified, then toggle that section.
    if (this.options.sectionIndex != null) 
      this.toggleSection(this.options.sectionIndex); 
  },

  /* Group: Methods */
  
  /*
    Function: toggleSection
    
    Toggles the section.
    
    Parameters:
      section - (Object) The section object to toggle.
      options - (Object) The options object to use when toggling the section.
    
    See Also:
      <showSection>
      
      <hideSection>
  */
  toggleSection: function(section, options, e)
  {
    // Stop any event passed in.
    if (typeof e != 'undefined') e.stop();
    
    if (typeof options == 'undefined') options = this.options;
    
    // If section is a number, this means we want to show by index.
    if (typeof section == 'number') section = this.sections[section];
    
    // If we are animating, then do not toggle another section.
    if (this._animating) return;
    
    // Hide the section if the content is visible, else, show the section.
    if (section.content.visible())
      this.hideSection(section, options);
    else
      this.showSection(section, options);     
  },
  
  /*
    Function: showSection
    
    Shows the section.
    
    Parameters:
      section - (Object) The section object to show.
      options - (Object) The options object to use when showing the section.
  */
  showSection: function(section, options)
  {
    if (typeof options == 'undefined') options = this.options;
    // If section is a number, this means we want to show by index.
    if (typeof section == 'number') section = this.sections[section];
            
    // If there can only be a single section active, then we will want to hide
    // all sections beside the passed in section.
    if (options.singleActive)
      this.sections
        .findAll(function(s) { return (s != section) })
      	.each(function(s) { this.hideSection(s, options); }.bind(this));
  
    // Set the content element to "semi-visible" so we can access style information.
    var hidden = false;
    if (!section.content.isAccessible()) 
    {
      hidden = true;
      section.content.setAccessibleStyles();
    }

    // We need to gain access to style information for this section, we will
    // need to make sure it's not contained in a non-visible element.
    // Gather all non-visible elements and set them up so we can gain style
    // information.
    var nonVisibleAncestors = section.content.ancestors().findAll(function(a) { return !a.isAccessible(); });
    
    // Change each non-visible ancestor to an accessible element.
    nonVisibleAncestors.invoke('setAccessibleStyles');
        
    // Get our current content dimensions.
    var contentDimensions = {
      width: section.content.scrollWidth,
      height: section.content.scrollHeight
    };
    
    var contentScrollHeight = contentDimensions.height;
    
    // Only figure out the maximum sections content height if this accordion is setup
    // to show one section at a time and the accordion height is specified.   
    if ((options.singleActive) && ((options.accordionHeight != 0) || ((options.accordionHeight > toggleHeight)))) 
    {
      // Gather all toggles height. This is used agains the accoridon height, if
      // specified, to figure out the height of a sections content.
      var toggleHeight = this.sections.collect(function(sec)
      {
        return sec.toggle.getHeight();
      }).inject(0, function(acc, n) { return acc + n; });
            
      contentDimensions.height = Math.abs(options.accordionHeight - toggleHeight);
    }
    
    // Return the non-visible elements back to their original style.
    nonVisibleAncestors.invoke('removeAccessibleStyles');
    
    // Hide the element if it was previously hidden.
    if (hidden) section.content.removeAccessibleStyles();
    
    // Add the active class name to the toggle element.
    section.toggle.addClassName('active');
    
    // If we are using effects, then blind the element, else, just show it.
    if (options.useEffects)
    {
      var effectOptions = {
        duration: 0.5,
        scaleContent: false, 
        scaleX: false,
        scaleFrom: 0,
        restoreAfterFinish: false
      };
      
      // Check to see if we need to set a specific height.
      if (contentDimensions.height < contentScrollHeight)
	      effectOptions.scaleMode = {originalHeight: contentDimensions.height, originalWidth: contentDimensions.width};
      
      Object.extend(effectOptions, options.effectOptions || { });

      var effectOptionsClone = Object.clone(effectOptions);
      
      effectOptions.afterFinish = function() 
      {
        if (typeof effectOptionsClone.afterFinish != 'undefined')
          effectOptionsClone.afterFinish();
        
        // If our specified height of the content is greater than or equal to
        // that of our content scroll height, then just set the height to auto
        // for the content.
        if (contentDimensions.height >= contentScrollHeight) 
          section.content.setStyle({ height: 'auto' });
        
        // Opera does not behave properly when undoClipping is called in the blind
        // down method.
        if (Prototype.Browser.Opera)
          section.content.setStyle({overflow: 'auto'});
        
        this._onShowSection(section, options);
      }.bind(this);

      this._animating = true;
      section.content.blindDown(effectOptions);
    }
    else
    {
      // Check to see if we need to set a specific height.
      if (contentDimensions.height < contentScrollHeight) 
        section.content.setStyle({ height: contentDimensions.height + 'px' });
      
      section.content.show();

      this._onShowSection(section, options);
    }
  },
  
  /*
    Function: hideSection
    
    Hides the section.
    
    Parameters:
      section - (Object) The section object to hide.
      options - (Object) The options object to use when hiding the section.
  */
  hideSection: function(section, options)
  {
    if (typeof options == 'undefined') options = this.options;
    // If section is a number, this means we want to hide by index.
    if (typeof section == 'number') section = this.sections[section];
    
    // First check to see if the content of the specified section is not visible.
    // If it's not visible, then we don't need to hide it anymore.
    if (!section.content.visible()) return;
    
    // Remove the active class name from the toggle element.
    section.toggle.removeClassName('active');
    
    // If we are using effects, then blind the element, else, just hide it.
    if (options.useEffects) 
    {
      var effectOptions = {
        duration: 0.5,
        queue: 'end'
      };
      Object.extend(effectOptions, options.effectOptions || { });
      
      if (typeof effectOptions.afterFinish == 'undefined')
        effectOptions.afterFinish = this._onHideSection.bind(this, section, options);
      else
      {
        var effectOptionsClone = Object.clone(effectOptions);
        
        effectOptions.afterFinish = function() {
          effectOptionsClone.afterFinish();
          this._onHideSection(section, options);
        }.bind(this);
      }
      this._animating = true;
      section.content.blindUp(effectOptions);
    }
    else
    { 
      section.content.hide();
      this._onHideSection(this, section, options);
    } 
  },
  
  /*
    Function: showAllSections
    
    Shows all sections.
    
    Parameters:
      options - (Object) The options object to use when showing the sections.
  */
  showAllSections: function(options)
  {
    if (typeof options == 'undefined') options = this.options;
    this.sections.each(function(s) { this.showSection(s, options); }.bind(this));    
  },

  /*
    Function: hideAllSections
    
    Hides all sections.
    
    Parameters:
      options - (Object) The options object to use when hiding the sections.
  */  
  hideAllSections: function(options)
  {
    if (typeof options == 'undefined') options = this.options;
    this.sections.each(function(s) { this.hideSection(s, options); }.bind(this));
  },
  
  _addSection: function(section)
  {
    section.toggle.observe('click', this.toggleSection.bind(this, section, undefined));
    this.sections.push(section);
    
    return section;    
  },
  
  _onShowSection: function(section, options)
  {
    if (typeof options == 'undefined') options = this.options;

    this._animating = false;
    section.active = true;
    
    // If the onShowSection event handler is available, fire it.
    if (typeof options.onShowSection != 'undefined')
      options.onShowSection(this, section);    
  },

  _onHideSection: function(section, options)
  {
    if (typeof options == 'undefined') options = this.options;
    
    this._animating = false;    
    section.active = false;
    
    // If the onHideSection event handler is available, fire it.
    if (typeof options.onHideSection != 'undefined')
      options.onHideSection(this, section);    
  }
});
