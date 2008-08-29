/*
  Title: Proto.ProgressBar
  
  About: Author
  Joe Gornick
  
  About: Version
  0.1
  
  About: License
  This file is licensed under the MIT license.
  
  About: Required Libraries
  Prototype JavaScript Framework 1.6.0.2 <http://prototypejs.org/download>  
*/

if (typeof Proto == 'undefined') { var Proto = { } };

/*
  Class: Proto.ProgressBar
  
  Convert an element to a progress bar.
  
  Example:
  (start code)
  ...
  <div id="progress_bar"></div>
  ...
  <script type="text/javascript">
    var pb = new Proto.ProgressBar('progress_bar', {
      width: 154,
      height: 11,
      boxImage: 'custom1_box.gif',
      barImage: 'custom1_bar.gif',
      percent: 10
    });
    
    pb.setPercent(50); // Set percent to 50%
    pb.setPercent('+10'); // Set percent to 60%
    pb.setPercent('-50'); // Set percent to 10%
  </script>
  (end)
*/

/*
  Group: Options
  
    Property: boxImage
    (String) The path of the progress box image.  Defaults to: progressbar-box.png.
    
    Property: barImage
    (String) The path of the progress bar. Default to: progressbar-bar.png.
    
    Property: width
    (Integer) The width of the progress bar.  The images must match up to be the 
    same size.  Defaults to: 120.
    
    Property: height
    (Integer) The height of the progress bar.  The images must match up to be the 
    same size.  Defaults to: 10.
    
    Property: percent
    (Integer) The initial percent to set the progress bar to.  Defaults to: 0.
    
    Property: showText
    (Boolean) Determines whether to show the percentage text to the right of the 
    progress bar.  Defaults to: false.
*/

/* 
  Group: Properties
  
    Property: container
    (HTMLElement) The element to convert to a progress bar.

    Property: options
    (Object) The options passed in the constructor.
    
    Property: percent
    (Integer) The current percentage of the progress bar.
*/
Proto.ProgressBar = Class.create({
  /*
    Group: Constructor
    
    Constructor: initialize
    
    Constructor. Should not be called directly.
    
    Parameters:
      container - (String|HTMLElement) The element to convert to a progress bar
      options - (Object) Options used to setup the progress bar.
    
    Returns:
      Proto.ProgressBar
  */
  initialize: function(container, options) {
    this.options = {
      boxImage: 'progressbar-box.png',
      barImage: 'progressbar-bar.png',
      width: 120,
      height: 10,
      percent: 0,
      showText: false
    };
    Object.extend(this.options, options || {});

    this.container = $(container);
    this.percent = this.options.percent;

    this._build();
  },

  /* Group: Methods */
  
  /*
    Function: setPercent
    
    Sets the percentage of the progress bar.
    
    Parameters:
      percent - (String|Integer) The specified percentage value.  Values can be a 
      range from 0 to 100 or can specify a string like +10 to add 10 percent to the 
      current percentage.
  */
  setPercent: function(percent) {
    var initialPos = parseFloat(this.options.width * -1);
    var pxPerPercent = parseFloat(this.options.width / 100);
    
    this.newPercent = parseFloat(percent);

    if ((percent.toString().startsWith('+')) || (percent.toString().startsWith('-')))
      this.newPercent = this.percent + this.newPercent;

    if (this.newPercent < 0) this.newPercent = 0;
    if (this.newPercent > 100) this.newPercent = 100;
    
    var percentPixels = parseFloat(this.newPercent * pxPerPercent);
    var backgroundPosition = parseFloat(initialPos + percentPixels);
    
    this.progressBarImage
      .writeAttribute({
        alt: this.newPercent + '%',
        title: this.newPercent + '%'
      })
      .setStyle({
        backgroundPosition: backgroundPosition + "px 50%"
      });

    if (this.options.showText)
      this.progressBarText.update(this.newPercent + '%');
    
    this.percent = this.newPercent;
  },
  
  _build: function() {
    var initialPos = this.options.width * (-1);

    this.progressBarImage = new Element('img', { 
      id: this.container.id + '_progressbar_image', 
      src: this.options.boxImage, 
      alt: this.percent + '%',
      title: this.percent + '%' 
    })
      .setStyle({
        width: this.options.width + 'px',
        height: this.options.height + 'px',
        backgroundPosition: initialPos + 'px 50%',
        backgroundImage: 'url(' + this.options.barImage + ')',
        margin: 0,
        padding: 0
      });

    this.progressBarText = new Element('span', { id: this.id + '_progressbar_text' }).update('0%');

    // Insert the elements into the DOM
    this.container.insert(this.progressBarImage);
    if (this.options.showText) this.container.insert(this.progressBarText);

    this.setPercent(this.percent);
  }  
});