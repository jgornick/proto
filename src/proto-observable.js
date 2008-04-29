/*
  Title: Proto.Observable
  
  About: Author
  Joe Gornick
  
  About: Version
  0.2
  
  About: License
  This file is licensed under the MIT license.
  
  About: Required Libraries
  Prototype JavaScript Framework 1.6.0.2 <http://prototypejs.org/download>
*/


if (typeof Proto == 'undefined') var Proto = {};

/*
  Class: Proto.Observable
  
  A Class mix-in for observing and firing events within an instance of an object.
  
  Example:
  (start code)
  (end)
*/
Proto.Observable = {
  /*
    Group: Methods
  */

  /*
    Function: observe
    
    Start observing the specified event with the specified handler.
  */
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
    
    // Add the handler to the event
    this._observers.get(eventName).push(handler);
    
    this.__handleUnload();
    
    return this;
  },
  
  /*
    Function: stopObserving
    
    Stop observing the specified event with the optional handler.
  */
  stopObserving: function(eventName, handler)
  {
    if (typeof this._observers == 'undefined') this._observers = $H();

    if (typeof eventName == 'undefined') return this;
    if (typeof this._observers.get(eventName) == 'undefined') return this;
    
    if (typeof handler == 'undefined')
      this._observers.get(eventName).clear();
    else
      this._observers.set(eventName, this._observers.get(eventName).without(handler.toString()));
    
    return this;
  },
  
  /*
    Function: fire
    
    Fire the specified event with the optional memo object.
  */
  fire: function(eventName, memo)
  {
    if (typeof this._observers == 'undefined') this._observers = $H();
    
    if (typeof eventName == 'undefined') return this;
    if (typeof this._observers.get(eventName) == 'undefined') return this;
   
    var event;
    if (document.createEvent)
    {
      event = document.createEvent("HTMLEvents");
      event.initEvent("dataavailable", true, true);
    } 
    else 
    {
      event = document.createEventObject();
      event.eventType = "ondataavailable";
    }
    
    event.eventName = eventName;
    event.memo = memo || { };
    
    this._observers.get(eventName).each(function(handler) { handler(event); });

    return this;       
  },
  
  __handleUnload: function()
  {
    // Cleanup the observers only in IE.
    if (window.attachEvent && (typeof this.__attachedEvent == 'undefined')) 
    {
      this.__attachedEvent = true;
      window.attachEvent('onunload', this.__cleanupObservers.bind(this));
    }
  },
  
  __cleanupObservers: function() 
  {
    // Clear the handlers array from each event.
    this._observers.each(function(pair)
    {
      pair.value.clear();
      pair.value = null;
    });

    // Remove the keys from the observers hash.
    this._observers.keys().each(function(key)
    {
      this._observers.unset(key);
    }.bind(this));
    
    this._observers = null;
  }
};