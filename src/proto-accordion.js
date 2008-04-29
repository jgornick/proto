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
  
  About: Optional Libraries
  Script.aculo.us Effects.js 1.8.0 <http://script.aculo.us/downloads>
*/

if (typeof Proto == 'undefined') var Proto = {};

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
  Group: Options
  
    Property: sectionIndex
    Used to specify the section to show after loaded.
    
    Property: useEffects
    Use script.aculo.us slide effects when toggling sections.  Requires script.aculo.us effects library.
    
    Property: effectOptions
    Script.aculo.us slide effect options.
    
    Property: singleActive
    Only show no more than one section at any given time.
    
    Property: onShowSection
    An event which fires after the section is showing.
    
    Property: onHideSection
    An event which fires after the section is hidden.
*/

/* 
  Group: Properties
  
    Property: sections
    An array of available accordion sections.
    
    Property: options
    The options passed in the constructor.
    
    Property: el
    The accordion element.
*/

Proto.Accordion = Class.create({
  /*
    Group: Constructor
    
    Constructor: initialize
    
    Constructor. Should not be called directly.
    
    Parameters:
      el - A string or the element that will be converted to an accordion.
      options - The options object to use when setting up the accordion.
    
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
      onShowSection: Prototype.emptyFunction,
      onHideSection: Prototype.emptyFunction
    };
    Object.extend(this.options, options || { });
    
    this.el = $(el);
    
    this.sections = $A();
    
    // Gather our toggles
    this.el.childElements().grep(new Selector('.toggle')).each(function(toggle)
    {
      this.sections.push({
        toggle: toggle,
        content: toggle.next(),
        active: false
      });
    }.bind(this));

    // Setup the sections here.  Observe the click on the toggle and hide all sections.
    this.sections.each(function(section)
    {
      section.toggle.observe('click', this.toggleSection.bind(this, section, undefined));
      this.hideSection(section, { useEffects: false }); // Hide all sections by default
    }.bind(this));
    
    // If the sectionIndex is specified, then toggle that section.
    if (this.options.sectionIndex != null) 
      this.toggleSection(this.options.sectionIndex); 
  },

  /*
    Group: Methods
  */
  
  /*
    Function: toggleSection
    
    Toggles the section.
    
    Parameters:
      section - The section object to toggle.
      options - The options object to use when toggling the section.
    
    See Also:
      <showSection>
      
      <hideSection>
  */
  toggleSection: function(section, options)
  {
    if (typeof options == 'undefined') options = this.options;
    // If section is a number, this means we want to show by index.
    if (typeof section == 'number') section = this.sections[section];
    
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
      section - The section object to show.
      options - The options object to use when showing the section.
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
    
    // Add the active class name to the toggle element.
    section.toggle.addClassName('active');
    
    // If we are using effects, then blind the element, else, just show it.
    if (options.useEffects)
    {
      var effectOptions = {
        duration: 0.5
      };
      Object.extend(effectOptions, options.effectOptions || { });

      if (typeof effectOptions.afterFinish == 'undefined')
        effectOptions.afterFinish = this._onShowSection.bind(this, section, options);
      else
      {
        var effectOptionsClone = Object.clone(effectOptions);
        
        effectOptions.afterFinish = function() {
          effectOptionsClone.afterFinish();
          this._onShowSection(section, options);
        }.bind(this);
      }
      
      section.content.blindDown(effectOptions);
    }
    else
    {
      section.content.show();
      this._onShowSection(section, options);
    }
  },
  
  _onShowSection: function(section, options)
  {
    if (typeof options == 'undefined') options = this.options;
    
    section.active = true;
    
    // If the onShowSection event handler is available, fire it.
    if (typeof options.onShowSection != 'undefined')
      options.onShowSection(this, section);    
  },
  
  /*
    Function: hideSection
    
    Hides the section.
    
    Parameters:
      section - The section object to hide.
      options - The options object to use when hiding the section.
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
      
      section.content.blindUp(effectOptions);
    }
    else
    { 
      section.content.hide();
      this._onHideSection(this, section, options);
    } 
  },

  _onHideSection: function(section, options)
  {
    if (typeof options == 'undefined') options = this.options;
    
    section.active = false;
    
    // If the onHideSection event handler is available, fire it.
    if (typeof options.onHideSection != 'undefined')
      options.onHideSection(this, section);    
  },

  /*
    Function: showAllSections
    
    Shows all sections.
    
    Parameters:
      options - The options object to use when showing the sections.
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
      options - The options object to use when hiding the sections.
  */  
  hideAllSections: function(options)
  {
    if (typeof options == 'undefined') options = this.options;
    this.sections.each(function(s) { this.hideSection(s, options); }.bind(this));
  }
});