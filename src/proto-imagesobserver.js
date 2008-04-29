/*
  Title: Proto.ImagesObserver
  
  About: Author
  Joe Gornick
  
  About: Version
  0.1
  
  About: License
  This file is licensed under the MIT license.
  
  About: Required Libraries
  Prototype JavaScript Framework 1.6.0.2 <http://prototypejs.org/download>
*/

if (typeof Proto == 'undefined') var Proto = {};

/*
  Class: Proto.ImagesObserver
  
  Allows one to observe an elements images loaded state.
  
  Example:
  (start code)
  ...  
  (end)
*/

/*
  Group: Options
  
    Property: onImagesLoaded
    An event fired when all the images in the specified element are loaded.  If 
    this isn't specified, then we will fire the 'images:loaded' event on the document.
*/
Proto.ImagesObserver = Class.create({
  /*
    Group: Constructor
    
    Constructor: initialize
    
    Constructor. Should not be called directly.
    
    Parameters:
      el - Optional - (String|HTMLElement) Element to observe the images loaded state.
      If el isn't specified, then default to document.body.
      options - Optional - (Object) Options used to setup the Proto.ImagesObserver.
    
    Returns:
      Proto.ImagesObserver
  */
  initialize: function(el, options)
  {
    this.options = {
      onImagesLoaded: Prototype.emptyFunction
    };
    Object.extend(this.options, options || { });
    
    this.el = $(document.body);
    if (typeof el != 'undefined') this.el = $(el);
      
    this.pe = new PeriodicalExecuter(this._checkImagesState.bind(this), (1/10));
  },
  
  _checkImagesState: function()
  {
    if (this._areImagesLoaded(this.el))
    {
      this.pe.stop();
      
      if (this.options.onImagesLoaded != Prototype.emptyFunction)
        this.options.onImagesLoaded(this.el);
      else
        document.fire('images:loaded', { el: this.el });
    }    
  },
  
  /**
   * _areImagesLoaded()
   *
   * Checks wether all the images in the document have loaded.
   * 
   * Please note that the naturalWidth property will return before the complete
   * property is set to true.  So, the image will not be completely downloaded,
   * but will be the correct dimensions in the document.
   *
   * @author John-David Dalton <john.david.dalton[at]gmail[dot]com>
   * @author Joe Gornick <joe[at]joegornick[dot]com>
   * @return boolean
   * @link http://www.bigbold.com/snippets/posts/show/89
   * @link http://talideon.com/weblog/2005/02/detecting-broken-images-js.cfm
   */  
  _areImagesLoaded: function(el)
  {
    return el.select('img').all(function(img)
    {
      return (img.readyState == 'complete' || img.complete || 
        !(typeof img.naturalWidth != 'undefined' && img.naturalWidth == 0));
    });
  }  
});