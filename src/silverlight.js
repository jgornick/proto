if (typeof Proto == 'undefined') var Proto = {};

Proto.Silverlight = Class.create({
  initialize: function(container, options)
  {
    if (typeof Silverlight == 'undefined')
    {
      alert('Silverlight.js required!  Please add a reference to this file.');
      return;
    }
    
    var ef = Prototype.emptyFunction;
    
    this.options = {
      requiredSilverlightVersion: '1.0',
      id: 'sl_plugin_' + Math.abs(Date.UTC() + Math.random()),
      xamlUrl: null,
      width: 0,
      height: 0,
      bgColor: '#000000',
      isWindowless: false,
      onLoad: ef,
      onError: ef,
      onFullScreenChange: ef
    };
    Object.extend(this.options, options || { });
    
    this.container = $(container);
  },

  build: function(canvas)
  {
    if (typeof canvas != 'undefined') 
      this._buildInlineXaml(canvas);
    
    var source = this.options.id + '_xaml';
    
    if (this.options.xamlUrl)
      source = this.options.xamlUrl;
    else if ($(source) == null) // No xaml url, no inline xaml.
      throw 'You must specify a XAML url or XAML text to build the Silverlight object.';
    
    Silverlight.createObjectEx({
      source: '#' + source,
      parentElement: this.container,
      id: this.options.id,
      properties: {                                   
        width: this.options.width.toString(),                   
        height: this.options.height.toString(),                   
        inplaceInstallPrompt: false,     
        background: this.options.bgColor,             
        isWindowless: this.options.isWindowless.toString(),           
        framerate: '24',                 
        version: this.options.requiredSilverlightVersion              
      },
      events: {
        onError: this._onSilverlightError.bind(this),                   
        onLoad: this._onSilverlightLoad.bind(this)                     
      },
      initParams: null,                               
      context: null                                
    });

    // Add our helper functions to the newly created SL object element.
    this.sl = $SLP(this.options.id);
    
    // Now let's add the Proto.Silverlight.Methods to this instance while currying
    // the newly created Silverlight object.
    var method;
    var methods = Proto.Silverlight.Methods;
  
    for (var name in methods)
    {
      method = methods[name];
      if (typeof this[name] != 'function')
  	    this[name] = method.curry(this.sl);
    }
    
    return this;
  },
  
  _buildInlineXaml: function(value)
  {
    if (this.options.xamlUrl != null) return;
    
    if (typeof value.toXaml == 'function') 
      value = value.toXaml();

    var script = new Element('script', {id: this.options.id + '_xaml', type: 'text/xaml'}); 

    var xaml = $A();
    
    xaml.push('<?xml version="1.0"?>');
    xaml.push(value);
    script.text = xaml.join(''); 
        
    document.getElementsByTagName('head').item(0).appendChild(script);
  },
  
  _onSilverlightError: function(sender, args)
  {
    var message = $A();
    
    message.push('Silverlight Error Message');
    message.push('Name: ' + sender.name);
    message.push('File Name: ' + sender.source);
    message.push('Sender: ' + sender);
    message.push('Code: ' + args.errorCode);
    message.push('Msg:  ' + args.errorMessage);
    message.push('Type: ' + args.errorType);;

    this.options.onError(this, message.join('\n'));
  },
  
  _onSilverlightLoad: function(sender, context, source)
  {
    var content = sender.content;
    content.onFullScreenChange = this._onFullScreenChange.bind(this);
    
    this.options.onLoad(this);
  },
      
  _onFullScreenChange: function(sender, args)
  {
    this.options.onFullScreenChange(this, this.getContent().fullScreen);
  }
});


Proto.Silverlight.Methods = {
  getContent: function(element)
  {
    return element.content;
  },
  
  getSettings: function(element)
  {
    return element.settings;
  },
  
  getSetting: function(element, name)
  {
    return element.getSettings()[name];
  },
  
  setSetting: function(element, settings)
  {
    if (typeof settings == 'string') 
    {
      element.getSettings()[settings] = arguments[2];
      return element;
    }
    
    for (var setting in settings)
      element.getSettings()[setting] = settings[setting];
    
    return element;
  },
  
  getObject: function(element, name)
  {
    if (typeof name == 'object') name = name.getProperty('Name');
    return $SLO(element.getContent().findName(name));
  },
    
  toggleFullScreen: function(element)
  {
    element.getContent().fullScreen = !element.getContent().fullScreen;
    return element;
  },
  
  getActualWidth: function(element)
  {
    return element.getContent().actualWidth;
  },
  
  getActualHeight: function(element)
  {
    return element.getContent().actualHeight;
  },
  
  getActualDimensions: function(element)
  {
    return {
      width: element.getActualWidth(),
      height: element.getActualHeight()
    }
  },
  
  add: function(element, value)
  {
    if (typeof value.toXaml == 'function') value = value.toXaml();
     
    var object = element.getContent().createFromXaml(value);
    var index = element.getContent().root.children.add(object);
    
    return $SLO(element.getContent().root.children.getItem(index));
  }
};



Proto.Silverlight.Object = Class.create({
  initialize: function(object)
  {
    if (typeof Proto.Silverlight.Object.__cache == 'undefined') 
      Proto.Silverlight.Object.__cache = $A();
    
    this.object = object;
    this.xamlTag = this.object.toString();
    this.plugin = $SLP(this.object.getHost());
    
    // Add this object to the cache array.
    Proto.Silverlight.Object.__cache.push(this); 
  },
  
  add: function(value)
  {
    // Treat the value as xaml.
    var xaml = value;
    
    // If the value has a toXaml function, then treat that as the xaml to add.
    if (typeof value.toXaml == 'function')
      xaml = value.toXaml();
    
    // Create the object from xaml.
    var object = this.plugin.getContent().createFromXaml(xaml);
    
    // Add the object to this object.
    var index = this.object.children.add(object);
    
    // Return the newly created object extended with our helper functions.
    return $SLO(this.object.children.getItem(index));
  },
  
  getObject: function()
  {
    return this.object;
  },
    
  hasProperty: function(name)
  {
    try 
    {
      var value = this.object.getValue(name);

      if (typeof value != 'undefined')
        if ((value != null) && (value != '')) return true;
    }
    catch (e) {}
    
    return false;
  },

  getProperties: function()
  {
    var output = $A();
    
    for (var i = 0; i < Proto.Silverlight.Properties.length; i++)
    {
      var prop = Proto.Silverlight.Properties[i];

      if (this.hasProperty(prop))
        output.push([prop, this.getProperty(prop)]);
    }
    
    return output;
  },

  getProperty: function(name)
  {
    return this.object.getValue(name);
  },
  
  setProperty: function(properties)
  {
    if (typeof properties == 'string') 
    {
      this.object.setValue(properties, arguments[1]);
      return this;
    }
    
    for (var property in properties)
      this.object.setValue(property, properties[property]);
    
    return this;    
  },
  
  observe: function(eventName, handler)
  {
    if (typeof this._observers == 'undefined') this._observers = $H();
    
    if (typeof eventName == 'undefined') return this;
    if (typeof handler == 'undefined') return this;
    
    // Check to see if we are already observing this event
    if (typeof this._observers.get(eventName) != 'undefined') 
    {
      if (this._observers.get(eventName).include(handler.toString())) 
        return this;
    }
    else // Add the event to the observers hash
      this._observers.set(eventName, $A());
    
    var token = this.object.addEventListener(eventName, handler);

    // Add the handler to the event
    this._observers.get(eventName).push({
      token: token,
      handler: handler
    });
    
    return this;
  },
  
  stopObserving: function(eventName, handler)
  {
    if (typeof this._observers == 'undefined') this._observers = $H();

    if (typeof eventName == 'undefined') return this;
    if (typeof this._observers.get(eventName) == 'undefined') return this;
    
    // Remove the event listeners on all handlers for the event name.
    if (typeof handler == 'undefined') 
    {
      this._observers.get(eventName).each(function(o)
      {
        this.object.removeEventListener(eventName, o.token);
      }.bind(this));
    }
    else // Remove only the handlers that match to the specified handler.
    {
      var handlers = this._observers.get(eventName).findAll(function(o)
      {
        return (o.handler.toString() == handler.toString());
      });
      
      handlers.each(function(o)
      {
        this.object.removeEventListener(eventName, o.token);
      }.bind(this));
    }
    
    return this;
  },

  getWidth: function()
  {
    return this.getProperty('Width');
  },
  
  getHeight: function()
  {
    return this.getProperty('Height');
  },
  
  getDimensions: function()
  {
    return {
      width: this.getWidth(),
      height: this.getHeight()
    }
  },

  setDimensions: function(w, h)
  {
    this.setProperty({
      Width: w,
      Height: h
    });

    return this;    
  },
  
  moveTo: function(x, y)
  {
    this.setProperty({
      'Canvas.Left': x,
      'Canvas.Top': y
    });
    
    return this;
  },
  
  stretchFullScreen: function()
  {
    var actualWidth = this.plugin.getContent().actualWidth;
    var actualHeight = this.plugin.getContent().actualHeight;
    
    this.setDimensions( actualWidth, actualHeight);
    this.moveTo(0, 0);
  },
  
  hide: function()
  {
    this.setProperty({
      Visibility: 'Collapsed'
    });
    
    return this;
  },
  
  show: function()
  {
    this.setProperty({
      Visibility: 'Visible'
    });

    return this;
  }
});



Proto.Silverlight.Object.Builder = Class.create({
  initialize: function(xamlTag)
  {
    this.xamlTag = xamlTag;
    
    this.namespaces = $H();
    this.properties = $H();
    this.children = $A();

    this.setProperty({
      Name: 'object_' + Math.abs(Date.UTC() + Math.random())
    });    
  },

  getProperty: function(name)
  {
    return this.properties.get(name);
  },
  
  setProperty: function(properties)
  {
    $H(properties).each(function(property)
    {
      // Check to see if the property name already exists.
      var propertyName = this.properties.keys().grep(new RegExp(property.key, 'i'));    
      if (propertyName.length > 0) property.key = propertyName[0];
              
      this.properties.set(property.key, property.value);
    }.bind(this));
    
    return this;
  },

  getNamespace: function(name)
  {
    return this.namespaces.get(name);
  },
  
  setNamespace: function(namespaces)
  {
    $H(namespaces).each(function(namespace)
    {
      // Check to see if the property name already exists.
      var namespaceName = this.namespaces.keys().grep(new RegExp(namespace.key, 'i'));    
      if (namespaceName.length > 0) namespace.key = namespaceName[0];
              
      this.namespaces.set(namespace.key, namespace.value);
    }.bind(this));
    
    return this;
  },
  
  toXaml: function()
  {
    var xaml = $A();
    
    xaml.push('<' + this.xamlTag);
    
    // Add our namespaces
    this.namespaces.each(function(ns)
    {
      var xmlns = 'xmlns';
      xmlns += (ns.key!= '') ? ':' + ns.key : ''
      xmlns += '="' + ns.value + '"';
      
      xaml.push(xmlns);
    });
    
    // Add our properties
    this.properties.each(function(prop) 
    {
      xaml.push(prop.key + '="' + prop.value + '"');
    });
    
    // Add our children
    if (this.children.length > 0)
    {
      xaml.push('>');
      
      xaml = xaml.concat(this.children.invoke('toXaml'));
      
      xaml.push('</' + this.xamlTag + '>');
    }
    else
      xaml.push('/>');

    return xaml.join(' ');        
  }
});



Proto.Silverlight.MediaElement = Class.create(Proto.Silverlight.Object, {
  initialize: function($super, object)
  {
    $super(object);
  },
  
  setSource: function(url, autoplay)
  {
    this.stop();
    
    // Set the source
    this.object.source = url;
    this.object.autoPlay = autoplay;
    
    return this;
  },

  play: function()
  {
    this.object.play();
    
    return this;
  },

  stop: function()
  {
    this.object.stop();
    
    return this;
  },
  
  getVolume: function()
  {
    return parseFloat(this.object.volume);
  },
  
  setVolume: function(volume)
  {
    newVolume = (parseFloat(volume) / 100);

    if ((volume.toString().startsWith('+')) || (volume.toString().startsWith('-'))) 
      newVolume = this.getVolume() + newVolume;
    
    this.object.volume = newVolume;
    
    return this;
  },
  
  mute: function(mute)
  {
    if (typeof mute == 'undefined')
      mute = !this.object.isMuted;
      
    this.object.isMuted = mute;
    
    return this;
  }
});


// Helper functions
function $SLP(element)
{
  element = $(element);

  if (element._extendedBySL) return element;
  
  var method;
  var methods = Proto.Silverlight.Methods;

  for (var name in methods)
  {
    method = methods[name];
    if (typeof element[name] != 'function')
	    element[name] = method.curry(element);
  }
  
  element._extendedBySL = true;
  
  return element; 
}


function $SLO(object)
{
  if (typeof Proto.Silverlight.Object.__cache == 'undefined') 
    Proto.Silverlight.Object.__cache = $A();
  
  // Check to see if this object already has been wrapped with our object class.
  var objects = Proto.Silverlight.Object.__cache.pluck('object');

  // Let's try to find the object in the cache
  var existing_object = Proto.Silverlight.Object.__cache.find(function(o) { return o.object.equals(object);  });

  // Return the cached object if it's been already created.
  if (typeof existing_object != 'undefined') return existing_object;
  
  switch (object.toString())
  {
    case 'MediaElement':
      return new Proto.Silverlight.MediaElement(object);
      break;
    default:
      return new Proto.Silverlight.Object(object);
  } 
}