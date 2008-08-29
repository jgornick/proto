/*
  Title: Proto.MaskedInput
  
  About: Author
  Joe Gornick
  
  About: Version
  0.1
  
  About: License
  This file is licensed under the MIT license.
  
  About: Required Libraries
  Prototype JavaScript Framework 1.6.0.2 <http://prototypejs.org/download>
  
  Proto.SelectionMethods <Proto.SelectionMethods>  
*/

if (typeof Proto == 'undefined') { var Proto = {} };


Element.addMethods(['INPUT', 'TEXTAREA'], {
  mask: function(element, mask, options)
  {
    element = $(element);
        
    return new Proto.MaskedInput(element, mask, options);
  },
  getMaskValue: function(element)
  {
    if (typeof Proto._masks == 'undefined') return;
    
    element = $(element);
    
    for (var i = 0; i < Proto._masks.length; i++)
      if (Proto._masks[i].element == element) 
        return Proto._masks[i].getValue();
  }
});

Proto.MaskedInput = Class.create({
  initialize: function(element, mask, options)
  {
    this.options = {
      placeholder: '_',
      charMap: {},
      onValidating: Prototype.emptyFunction,
      onValidated: Prototype.emptyFunction
    };
    Object.extend(this.options, options || { });
    
    this.charMap = {
      '9': '[0-9]?',
      '0': '[0-9]',
  		'L': '^[A-Za-z]$',
      '?': '^[A-Za-z]?$',
  		'a': '^[A-Za-z0-9]$'
    };
    Object.extend(this.charMap, this.options.charMap || { });

    // AlphaNum Keys Include:
    // 0-9 (48-57), A-Z (Lower/Upper - 65-90), 0-9 (Numpad - 96-105)
    this._alphaNumKeys = $R(48, 57).toArray().concat($R(65, 90).toArray()).concat($R(96, 105).toArray());    
    
    // Special Keys include:
    // Backspace (8), Escape (27), End/Home (35/36),  Left/Up/Right/Down (37/38/39/40), Delete (46)
    this._specialKeys =  $A([8, 27, 46]).concat($R(35, 40).toArray());
    
    this.element = $(element);
    
    this._setupEvents();
    
    this.mask = $A(mask.split(''));
    this._buildMask();

    this._buffer = $A();
    this._buildBuffer();
    
    this._writeBuffer();
    
    if (typeof Proto._masks == 'undefined')
      Proto._masks = $A();
    
    Proto._masks.push(this);
  },
  
  _buildMask: function()
  {
    this.mask.each(function(c, index)
    {
      this.mask[index] = {
        index: index,
        character: c,
        regExp: this.charMap[c] || ((/[A-Za-z0-9]/.test(c) ? '' : '\\') + c),
        literal: (this.charMap[c] == null)
      }
    }.bind(this));
    
    this._buildMaskRegExp();
  },
  
  _buildMaskRegExp: function()
  {
    var regExp = this.mask.map(function(c)
    {
      return c.regExp;
    }).join('');
    
    this.regExpString = regExp;
    this.regExp = new RegExp(regExp);
  },
    
  _buildBuffer: function()
  {
    this.mask.each(function(c)
    {
      this._buffer.push(c.literal ? c.character : this.options.placeholder) 
    }.bind(this));
  },
  
  _setupEvents: function()
  {
    // Attach a text:pasted event to each input and textarea
    $$('input[type=text], textarea').each(function(el)
    {
    	if (Prototype.Browser.IE) 
    		el.onpaste = function() { el.fire('text:pasted') };                     
    	else
    		el.observe('keypress', function(e) 
        {
          var k = e.charCode || e.keyCode || e.which;

          // Capture Ctrl+V and Ctrl+v and Shift+Insert
          if ((e.ctrlKey && (k == 86 || k == 118))
          || (e.shiftKey && k == 45))
            this.fire('text:pasted');
        });
    });

    this.element.observe('focus', this._onFocus.bindAsEventListener(this));
    this.element.observe('blur', this._onBlur.bindAsEventListener(this));
    this.element.observe('keydown', this._onKeyDown.bindAsEventListener(this));
    this.element.observe('keypress', this._onKeyPress.bindAsEventListener(this));
    this.element.observe('text:pasted', this._onPaste.bindAsEventListener(this));
  },
  
  _onFocus: function(e)
  {
    this._validate();
    
    this.element.setSelection(this._seekFirst());
  },
  
  _onBlur: function(e)
  {
    this._validate();
  },
  
  _handleBackspaceKey: function(e, p)
  {
    // Now we will write the buffer and set the caret in the right position "after" the delete has finished.
    this._shiftBufferLeft(p.start);
    this._writeBuffer(); 
    this.element.setSelection(Math.max(this._seekFirst(), p.start));
    
	  this._validate();
  },
  
  _handleDeleteKey: function(e, p)
  {
    this._shiftBufferLeft(p.start);
    this._writeBuffer();
    this.element.setSelection(Math.max(this._seekFirst(), p.start));
    
    this._validate();
  },
  
  _handleEscapeKey: function(e, p)
  {
    this._clearBuffer(0, this.mask.length);
    this._writeBuffer();
    this.element.setSelection(this._seekFirst());
    
    this._validate();
  },
  
  _handleHomeKey: function(e, p)
  {
    this._writeBuffer();
    
    if (e.shiftKey)
      this.element.setSelection(this._seekFirst(), p.start);
    else
     this.element.setSelection(this._seekFirst());
  },
  
  _handleLiteralKey: function(e, p, k)
  {
    this.element.setSelection(this._seekNextLiteral(p.start - 1, k) + 1);
    
    this._validate();    
  },
  
  _handlePlaceholderKey: function(e, p, k)
  {
    this._shiftBufferRight(p, k);
  	this._writeBuffer();
    this.element.setSelection(p + 1);
    
    this._validate();
  },
  
  _handleSpecialKeys: function(e, p, k)
  {
    // Catch for Opera
    if (p.start > this.mask.length) 
    {
      e.stop();
      return false;
    }

    if (k == 8) // Backspace
    {      
      // Make sure we don't delete too much.  This while loop allows us to skip literals.
      while (p.start-- >= 0)
      { 
        if (p.start < 0) 
        {
      		if (Prototype.Browser.Opera) 
          {
            //Opera won't let you cancel the backspace, so we'll let it backspace over a dummy character.								
            var s = this._writeBuffer();
            this.element.value = s.substring(0, 0) + this.options.placeholder + s.substring(0);

            this._handleBackspaceKey.bind(this).defer(e, p);    
          }
          else
            this._handleBackspaceKey(e, p); 
          
          e.stop();
          return false;
        }
        
        if (!this.mask[p.start].literal)
        {
      		this._buffer[p.start] = this.options.placeholder;
          
      		if (Prototype.Browser.Opera) 
          {
            // Opera won't let you cancel the backspace, so we'll let it backspace over a dummy character.
            // The placeholder in this instance is the dummy character to delete over.								
            var s = this._writeBuffer();
            this.element.value = s.substring(0, p.start) + this.options.placeholder + s.substring(p.start);
            
            this._handleBackspaceKey.bind(this).defer(e, p);    
          }
          else
            this._handleBackspaceKey(e, p); 

          e.stop();
          return false;
      	}
      }
    }
    else if (k == 46) // Delete
    {
      if (Prototype.Browser.Opera)
        this._handleDeleteKey.bind(this).defer(e, p);
      else
        this._handleDeleteKey(e, p);
      
      e.stop();
      return false;
    }
    else if (k == 27) // Escape
    {
      this._handleEscapeKey.bind(this).defer(e, p);

      e.stop();      
      return false;
    }
    else if (k == 36) // Home
    {
      if (Prototype.Browser.Opera)
        this._handleHomeKey.bind(this).defer(e, p);
      else
        this._handleHomeKey(e, p);

      e.stop();
      return false;
    }
  },
  
  _onKeyDown: function(e)
  {
    var p = this.element.getSelection();
    var k = e.charCode || e.keyCode || e.which;
    
    if((p.start - p.end) != 0 && (k == 8 || k == 46))
      this._clearBuffer(p.start, p.end);

    // Let's see if it's a literal go move the caret to that position + 1
    if (this._seekNextLiteral(p.start - 1, k) >= 0)
    {
      if (Prototype.Browser.Opera)
        this._handleLiteralKey.bind(this).defer(e, p, k);
      else
        this._handleLiteralKey(e, p, k);
        
      e.stop();
      return false;
    }
    
    if (Prototype.Browser.IE)
      return this._handleSpecialKeys(e, p, k);
  },
  
  _onKeyPress: function(e)
  {
    var p = this.element.getSelection();
    var k = e.charCode || e.keyCode || e.which;

    this._handleSpecialKeys(e, p, k);

    if(e.ctrlKey || e.altKey)
    	return true;
    else if ((k >= 41 && k <= 122) || k == 32 || k > 186)
    {
      // If we can not type anymore because the buffer does not have anymore placeholders
      // then we need to stop typing.
      if (this._isBufferFull())
      {
        e.stop();
        return false;
      }

    	var nextChar = this._seekNext(p.start - 1);					

      if (nextChar < this.mask.length)
      {
        if(new RegExp('^' + this.mask[nextChar].regExp + '$').test(String.fromCharCode(k)))
        {
          this._handlePlaceholderKey(e, nextChar, k);
          
          e.stop();
    		}
        else // Invalid key pressed, stop event.
          e.stop();
    	}
      else // Make sure we don't allow the user to type in more than the mask.
        e.stop();
    }
    return false;	
  },

  _onPaste: function(e) 
  { 
    // TODO: Will need to figure out how to get the pasted value.
    // For now, take the pasted value and clear our the input.
    if (Prototype.Browser.Opera)
    {
      (function()
      {
        this._clearBuffer(0, this.mask.length);
        this._writeBuffer();
        this.element.setSelection(this._seekFirst());      
      }.bind(this)).defer();      
    }
    else
    {
      this._clearBuffer(0, this.mask.length);
      this._writeBuffer();
      this.element.setSelection(this._seekFirst());
    }
    
    e.stop();
    return false;
  },
      
  _clearBuffer: function(start, end)
  {
    for (var i = start; i < end; i++)
    	if (!this.mask[i].literal)
    		this._buffer[i] = this.options.placeholder;
  },
  
  _shiftBufferLeft: function(pos)
  {
    if ((pos < 0) || (pos >= this.mask.length)) return;
    
    for (var i = pos; i < this.mask.length; i++)
      if (!this.mask[i].literal)
        this._buffer[i] = this._buffer[this._seekNext(i)];

    this._buffer[this.mask.length - 1] = (this.mask.last().literal) ? this.mask.last().character : this.options.placeholder;
  },

  _shiftBufferRight: function(pos, k)
  {
    if ((pos < 0) || (pos >= this.mask.length)) return;
    
    var i = this.mask.length;
    
    while (--i > pos)
      if (!this.mask[i].literal)
        this._buffer[i] = this._buffer[this._seekPrevious(i)];      
    
    this._buffer[pos] = String.fromCharCode(k);
  },

  _isBufferFull: function()
  {
    for (var i = 0; i < this.mask.length; i++)
      if (!this.mask[i].literal)
        if (this._buffer[i] == this.options.placeholder)
          return false;
    
    return true;
  },
  
  _writeBuffer: function()
  {
    this.element.value = this._buffer.join('');
    return this._buffer.join(''); 
  },
  
  _validate: function()
  {
    if (this.regExp.test(this.getValue())) 
    {
      this.options.onValidating(true, this.getValue(), this);
      this.options.onValidated(this.getValue());
    }
    else
      this.options.onValidating(false, this.getValue(), this);
  },
  
  getValue: function()
  {
    // TODO: Specify literals parameter to return the value with or without literals.
    var value = this._buffer.collect(function(c) { return (c != this.options.placeholder) ? c : ''; }.bind(this));
    return value.join('');
  },

  _seekNextLiteral: function(pos, k)
  {
    // Ignore the delete key and convert the period (190)/decimal (110) key to 
    // 46 which charCodeAt(i) will give 46 for a period or decimal.
    if (k == 46) k = -1;
    else if (k == 110 || k == 190) k = 46;
    
    while (++pos < this.mask.length) 
      if ((this.mask[pos].literal) && (this.mask[pos].character.charCodeAt(0) == k)) 
        return pos;

    return -1;
  },

  /**
   * Seek first non-literal position
   */
  _seekFirst: function()
  {
    return this.mask.find(function(c)
    {
      return (!c.literal);
    }).index;
  },
  
  /**
   * Seek next non-literal position
   * @param {Object} pos
   */  
  _seekNext: function(pos)
  {
    while (++pos < this.mask.length)
    	if (!this.mask[pos].literal)
    		return pos;

    return this.mask.length - 1;
  },
  
  /**
   * Seek previous non-literal position
   * @param {Object} pos
   */
  _seekPrevious: function(pos)
  {
    while (--pos < this.mask.length)
    	if (!this.mask[pos].literal)
    		return pos;

    return this._seekFirst();
  }
});