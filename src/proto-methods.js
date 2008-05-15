/*
  Title: Proto.Methods
  
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

(function()
{
  var _ieBorderWidthKeywords = {
    thin: 2,
    medium: 4,
    thick: 6
  };
  
  function getIEPixelValue(element, value, cssProperty, pixelName)
  {
    element = $(element);
    
    // Check for a pixel value. If px is found in the value, then no need to go further.    
    if (/^\d+px?$/.test(value)) 
    {
      return parseInt(value, 10);
    } 
    else 
    {
      // Get the original style and runtime style.
      var originalStyle = element.style[cssProperty];
      var originalRuntimeStyle = element.runtimeStyle[cssProperty];
      
      element.runtimeStyle[cssProperty] = element.currentStyle[cssProperty];
      element.style[cssProperty] = value;
      
      var pixelValue = element.style[pixelName];
      
      // Restore the original styles.
      element.style[cssProperty] = originalStyle;
      element.runtimeStyle[cssProperty] = originalRuntimeStyle;
      
      return pixelValue;
    }
  }
  
  function getIECascadedStyle(element, cssProperty)
  {
    return element.currentStyle ? element.currentStyle[cssProperty] : null;
  }

  function getIEBorder(element, cssProperty)
  {
    element = $(element);
    
    if (getIECascadedStyle(element, cssProperty + 'Style') == 'none') return 0;
    
    var width = getIECascadedStyle(element, cssProperty + 'Width');
    
    // If the width returned is a word and not a value, then compare with our
    // border keywords to map a word to a pixel value.
    if (width in _ieBorderWidthKeywords)
      return _ieBorderWidthKeywords[width];
   
    return getIEPixelValue(element, width, 'left', 'pixelLeft');
  }
  
  function getIEPadding(element, cssProperty)
  {
    element = $(element);
    return getIEPixelValue(element, getIECascadedStyle(element, cssProperty), 'left', 'pixelLeft');
  }
  
  /*
    Class: Proto.ElementMethods
    
    Element helper methods.
    
    Example:
    (start code)
    Element.addMethods(Proto.ElementMethods);
    (end)
  */
  
  /*
    Group: Methods
  */
  Proto.ElementMethods = {
    /*
      Function: setTempStyles
      
      Sets some style properties temporarily.
      
      Parameters: 
        element - (String|HTMLElement) The element to set the temp styles to.
        styles - (Object) Object containing style definitions.
      
      Returns:
        (HTMLElement) element
        
      Credits:
        Andrew Dupont (http://github.com/savetheclocktower)
    */
    setTempStyles: function(element, styles) 
    {
      element = $(element);
      
      for (var property in styles)
        element['_original_' + property] = element.style[property];

      return element.setStyle(styles);
    },
    
    /*
      Function: removeTempStyles
      
      Removes any temp styles set by <Proto.ElementMethods.setTempStyles>.
      
      Parameters: 
        element - (String|HTMLElement) The element to remove the temp styles from.
      
      Returns:
        (HTMLElement) element
        
      Credits:
        Andrew Dupont (http://github.com/savetheclocktower)
    */
    removeTempStyles: function(element) 
    {
      element = $(element);
      
      var prop, styles = {};
      for (var property in element) 
      {
        if (!property.startsWith('_original_')) continue;
        prop = property.replace(/^_original_/, '');
        styles[prop] = element[property] || '';
        element[property] = undefined;
      }
      
      return element.setStyle(styles);
    },
    
    /*
      Function: setAccessibleStyles
      
      Makes the element accessible to gain style information.
      
      Parameters: 
        element - (String|HTMLElement) The element to make accessible.
      
      Returns:
        (HTMLElement) element
    */
    setAccessibleStyles: function(element)
    {
      element = $(element);
      
      return element.setTempStyles({
        visibility: 'hidden',
        position: 'absolute',
        display: 'block'
      });
    },
    
    /*
      Function: removeAccessibleStyles
      
      Removes the temporary accessible styles used in <Proto.ElementMethods.setAccessibleStyles>.
      
      Parameters: 
        element - (String|HTMLElement) The element to make accessible.
      
      Returns:
        (HTMLElement) element
    */
    removeAccessibleStyles: function(element)
    {
      element = $(element);
      
      return element.removeTempStyles();
    },
    
    /*
      Function: isAccessible
      
      Checks to see if the element is accessible to lookup style information.
      
      Parameters: 
        element - (String|HTMLElement) The element to check accessibility.
      
      Returns:
        (Boolean)
    */
    isAccessible: function(element)
    {
      element = $(element);
      
      var display = element.getStyle('display');
      
      return !(display === 'none' || display === null || element.offsetHeight == 0);
    },
    
    /*
      Function: getBorderWidth
      
      Get's the border width of the specified element.
      
      Parameters: 
        element - The element to get the border width of.
      
      Returns: 
        (Object)
        - top - The top border width.
        - left - The left border width.
        - bottom - The bottom border width.
        - right - The right border width.
        - topbottom - The sum of the top and bottom border width.
        - leftright - The sum of the left and right border width.
    */
    getBorderWidth: function(element)
    {
      element = $(element);
  
      // Show the element if it's hidden.  There is a bug with some browser where
      // it can not get computed border and padding values if it's not visible.
      var hidden = false;
  
      if (!element.isAccessible()) 
      {
        hidden = true;
        element.setAccessibleStyles();
      }
      
      if (Prototype.Browser.IE) 
      {
        var top = parseFloat(getIEBorder(element, 'borderTop'));
        var left = parseFloat(getIEBorder(element, 'borderLeft'));
        var bottom = parseFloat(getIEBorder(element, 'borderBottom'));
        var right = parseFloat(getIEBorder(element, 'borderRight'));
      }
      else 
      {
        var top = parseFloat(element.getStyle('border-top-width'));
        var left = parseFloat(element.getStyle('border-left-width'));
        var bottom = parseFloat(element.getStyle('border-bottom-width'));
        var right = parseFloat(element.getStyle('border-right-width'));
      }
      
      // Hide the element if it was previously hidden.
      if (hidden) element.removeAccessibleStyles();
      
      return {
        top: top ? top : 0,
        left: left ? left : 0,
        bottom: bottom ? bottom : 0,
        right: right ? right : 0,
        topbottom: (top + bottom) ? (top + bottom) : 0,
        leftright: (left + right) ? (left + right) : 0
      }
    },
  
    /*
      Function: getPadding
      
      Get's the padding width of the specified element.
      
      Parameters: 
        element - The element to get the padding width of.
      
      Returns: 
        (Object)
        - top - The top padding width.
        - left - The left padding width.
        - bottom - The bottom padding width.
        - right - The right padding width.
        - topbottom - The sum of the top and bottom padding width.
        - leftright - The sum of the left and right padding width.
    */
    getPadding: function(element)
    {
      element = $(element);
  
      // Show the element if it's hidden.  There is a bug with some browser where
      // it can not get computed border and padding values if it's not visible.
      var hidden = false;
  
      if (!element.isAccessible()) 
      {
        hidden = true;
        element.setAccessibleStyles();
      }
  
      if (Prototype.Browser.IE) 
      {
        var top = parseFloat(getIEPadding(element, 'paddingTop'));
        var left = parseFloat(getIEPadding(element, 'paddingLeft'));
        var bottom = parseFloat(getIEPadding(element, 'paddingBottom'));
        var right = parseFloat(getIEPadding(element, 'paddingRight'));
      }
      else 
      {
        var top = parseFloat(element.getStyle('padding-top'));
        var left = parseFloat(element.getStyle('padding-left'));
        var bottom = parseFloat(element.getStyle('padding-bottom'));
        var right = parseFloat(element.getStyle('padding-right'));
      }
  
      // Hide the element if it was previously hidden.
      if (hidden) element.removeAccessibleStyles();
      
      return {
        top: top ? top : 0,
        left: left ? left : 0,
        bottom: bottom ? bottom : 0,
        right: right ? right : 0,
        topbottom: (top + bottom) ? (top + bottom) : 0,
        leftright: (left + right) ? (left + right) : 0
      }
    },  
  
    /*
      Function: center
      
      Centers the element in it's offset parent.
      
      Parameters: 
        element - The element to center.
      
      Returns:
        element 
    */
    center: function(element)
    {
      element = $(element);
  
      var offset = parseInt((element.getOffsetParent().getWidth() - element.getWidth()) / 2);
      element.setStyle({
        marginLeft: offset + 'px'
      });
      return element;
    },
    
    /*
      Function: makeSameWidth
      
      Makes the element the same width (CSS) as the source element.
      
      Parameters: 
        element - The element to make the same width as the source element.
        sourceElement - The element to match the same width.
      
      Returns:
        element
    */
    makeSameWidth: function(element, sourceElement)
    {
      element = $(element);    
      element.setStyle({
        width: sourceElement.getStyle('width')
      });
      return element;
    },
    
    /*
      Function: makeSameHeight
      
      Makes the element the same height (CSS) as the source element.
      
      Parameters: 
        element - The element to make the same height as the source element.
        sourceElement - The element to match the same height.
      
      Returns:
        element
    */
    makeSameHeight: function(element, sourceElement)
    {
      element = $(element);    
      element.setStyle({
        height: sourceElement.getStyle('height')
      });
      return element;
    },
    
    /*
      Function: makeSameSize
      
      Makes the element the same width and height (CSS) as the source element.
      
      Parameters: 
        element - The element to make the same width and height as the source element.
        sourceElement - The element to match the same width and height.
      
      Returns:
        element
        
      See Also:
        <Proto.ElementMethods.makeSameWidth>
        
        <Proto.ElementMethods.makeSameHeight>
    */
    makeSameSize: function(element, sourceElement)
    {
      element = $(element);  
      element.makeSameWidth(sourceElement).makeSameHeight(sourceElement);
      return element;
    },
    
    /*
      Function: makeSamePosition
      
      Moves the element to the same position (CSS) as the source element.
      
      Parameters: 
        element - The element to position depending on the source element.
        sourceElement - The element to position with.
      
      Returns:
        element
    */
    makeSamePosition: function(element, sourceElement)
    {
      element = $(element);
      sourceElement = $(sourceElement);
      
      var top = sourceElement.getStyle('top');
      var left = sourceElement.getStyle('left');
      var bottom = sourceElement.getStyle('bottom');
      var right = sourceElement.getStyle('right');        
      
      element.setStyle({
        top: top ? top : sourceElement.style.top,
        left: left ? left : sourceElement.style.left,
        bottom: bottom ? bottom : sourceElement.style.bottom,
        right: right ? right : sourceElement.style.right           
      });
      return element;
    },
    
    /*
      Function: getContentDimensions
      
      Gets the content dimensions of the specified element.  The content of an 
      element is the dimensions minus the border and padding sizes.
      
      Parameters: 
        element - The element to get the content dimensions of.
      
      Returns:
        (Object)
        - width
        - height
        
      See Also:
        <Proto.ElementMethods.getBorderWidth>
        
        <Proto.ElementMethods.getPadding>
    */
    getContentDimensions: function(element)
    {
      element = $(element);
      
      var dimensions = element.getDimensions();
      var border = element.getBorderWidth();
      var padding = element.getPadding();
      
      var width = (dimensions.width - border.leftright - padding.leftright);
      var height = (dimensions.height - border.topbottom - padding.topbottom);
      
      return {
        width: width,
        height: height
      };    
    },
    
    /*
      Function: getContentOffset
      
      Gets the offset of an elements content.  The content of an element is the 
      dimensions minus the border and padding sizes.
      
      Parameters: 
        element - The element to get the content offset of.
      
      Returns:
        (Object)
        - top
        - left
        
      See Also:
        <Proto.ElementMethods.getBorderWidth>
        
        <Proto.ElementMethods.getPadding>
    */
    getContentOffset: function(element)
    {
      element = $(element);
      
      var offset = element.cumulativeOffset();
      var border = element.getBorderWidth();
      var padding = element.getPadding();
      
      var top = (offset.top + border.top + padding.top);
      var left = (offset.left + border.left + padding.left);
      
      return {
        top: top,
        left: left
      };    
    },
  
    /*
      Function: getCoords
      
      Gets the coordinates of an element.  Element must be visible (display: block)
      in order for Opera to work.
      
      Parameters: 
        element - The element to get the coordinates of.
      
      Returns:
        (Object)
        - x1 - Left
        - y1 - Top
        - x2 - Right
        - y2 - Bottom
    */
    getCoords: function(element)
    {
      element = $(element);
      
      var dimensions = element.getDimensions();
      
      var x1 = parseInt(element.getStyle('left').sub('px', ''));
      x1 = x1 ? x1 : 0;
      var y1 = parseInt(element.getStyle('top').sub('px', ''));
      y1 = y1 ? y1 : 0;
      
      var x2 = x1 + dimensions.width;
      var y2 = y1 + dimensions.height;
      
      return {
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2
      }    
    },
    
    /*
      Function: getAllDimensions
      
      Gets a combination of all element dimensions.  
      
      This includes: 
      - CSS dimensions (Element.getDimensions)
      - Cumulative offset (Element.cumulativeOffset)
      - Positioned offset (Element.positionedOffset)
      - Border width (<Proto.ElementMethods.getBorderWidth>)
      - Padding width (<Proto.ElementMethods.getPadding>)
      - Content dimensions (<Proto.ElementMethods.getContentDimensions>)
      - Content offset (<Proto.ElementMethods.getContentOffset>)
      
      If you need to get a combination of these, it is much more efficient to use 
      this method as it calculates content dimensions and offsets without making 
      more calls to get the border and padding widths.
      
      Parameters: 
        element - The element to get the dimensions of.
      
      Returns:
        (Object)
        - dimensions - Element.getDimensions
        - content - <Proto.ElementMethods.getContentDimensions>
        - offset - Element.cumulativeOffset
        - contentOffset - <Proto.ElementMethods.getContentOffset>
        - positionedOffset - Element.positionedOffset
        - border - <Proto.ElementMethods.getBorderWidth>
        - padding - <Proto.ElementMethods.getPadding>
    */
    getAllDimensions: function(element)
    {
      element = $(element);
  
      var d = element.getDimensions();
      var o = element.cumulativeOffset();
      var po = element.positionedOffset();
      var b = element.getBorderWidth();
      var p = element.getPadding();
      
      var contentDimensions = {
        width: (d.width - b.leftright - p.leftright),
        height: (d.height - b.topbottom - p.topbottom)
      };
      
      var contentOffset = {
        top: (o.top + b.top + p.top),
        left: (o.left + b.left + p.left)
      };
        
      return {
        dimensions: d,
        content: contentDimensions,
        offset: o,
        contentoffset: contentOffset,
        positionedoffset: po,
        border: b,
        padding: p
      }
    },
    
    /*
      Function: addHoverClassName
      
      Observes the mouseover, mouseout event and adds/removes specified class name.
            
      Parameters: 
        element - The element to observe the events on.
        className - The hover class name to use.
      
      Returns:
        (HTMLElement) element
        
      Credits:
        kangax (http://github.com/kangax)
    */
    addHoverClassName: function(element, className)
    {
      return $(element)
        .observe('mouseover', Element.addClassName.curry(element, className))
        .observe('mouseout', Element.removeClassName.curry(element, className));
    },
    
    /*
      Function: addMethods
      
      Adds methods to the specified element 
      
      Parameters: 
        element - (String|HTMLElement) The element to add the methods to.
        methods - (Object) The methods object
      
      Returns:
        (HTMLElement) element
        
      Credits:
        John David Dalton
    */
    addMethods: function(element, methods)
    {
      element = $(element);
      
      var method;
      
      for (var name in methods) 
      {
        method = methods[name];
        if (typeof element[name] != 'function')
  	      element[name] = method.curry(element);
      }
      
      return element; 
    },

    /*
      Function: getFontSize
      
      Gets the font size in pixels of the current element. 
      
      Parameters: 
        element - (String|HTMLElement) The element to get the font size.
      
      Returns:
        (Integer)
    */
    getFontSize: function(element)
    {
      element = $(element);
      
      // Set the element accessible if it isn't.
      var hidden = false;
      if (!element.isAccessible()) 
      {
        hidden = true;
        element.setAccessibleStyles();
      }
      
      // Gather all non accessible ancestors.
      var nonAccessibleAncestors = element.ancestors().findAll(function(a) { return !a.isAccessible(); });
      
      // Change each non-visible ancestor to an accessible element.
      nonAccessibleAncestors.invoke('setAccessibleStyles');
      
      // Get the current font size.
      var fontSize = element.getStyle('font-size');
            
      // If our font size is specified in pixels, then return.
      if (/^\d+px?$/.test(fontSize))
      {
        // Remove accessible styles from all ancestors that were not accessible.
	      nonAccessibleAncestors.invoke('removeAccessibleStyles');
        if (hidden) element.removeAccessibleStyles();
        return parseFloat(fontSize);        
      }

      // We need to insert a span with the M character in it.  The offsetHeight
      // will give us the font size as this is the definition of the CSS font-size
      // attribute.
      var span = new Element('span')
        .setStyle({
          visibility: 'hidden',
          position: 'absolute',
          lineHeight: 0,
          padding: 0,
          margin: 0,
          border: 0,
          height: '1em'
        })
        .update('M');
      
      // Insert our span as a child of the specified element.
      element.insert(span);
      
      // Get the offsetHeight which is the font size.
      fontSize = span.offsetHeight;
      
      // Remove the span from the document.
      span.remove();
      
      // Remove accessible styles from all ancestors that were not accessible.
      nonAccessibleAncestors.invoke('removeAccessibleStyles');
      if (hidden) element.removeAccessibleStyles();
      
      return parseFloat(fontSize);
    }    
  };
})();

/*
  Class: Proto.TableMethods
  
  Table helper methods.
  
  Example:
  (start code)
  Element.addMethods(Proto.TableMethods.elements, Proto.TableMethods.methods);
  (end)
*/

/*
  Group: Methods
*/
Proto.TableMethods = {
  elements: ['TABLE', 'THEAD', 'TBODY', 'TFOOT'],
  methods: {
    /*
      Function: addRow
      
      Adds a row to any table element (TABLE, THEAD, TBODY, TFOOT).
      
      Parameters: 
        element - The element to add the row to.
        options - An object that contains index and cell(s) information.
        
      Options:
        index - Insert a row at a specified index.  Defaults to -1, which appends 
        to the table
        cells - Array of cells to add to the row.  Each cell contains an object/hash 
        and can contain element attributes for that cell.  Some attributes include,
        innerHTML, className and many others.
      
      Example:
      (start code)
        $('table').down('tbody').addRow({
          cells: [
            { innerHTML: 'Cell 1 Content', className: 'cell1Class' },
            { innerHTML: 'Cell 2 Content' },
            { innerHTML: 'Cell 3 Content' }
          ]
        });
      (end)
      
      Returns: 
        (HTMLElement) row
    */
    addRow: function(element, options)
    {
      this.options = {
        index: -1, // Append
        cells: $A()
      };
      Object.extend(this.options, options || { });
      
      element = $(element);
  
      // First, add the row to the table.
      var row = $(element.insertRow(this.options.index));
      
      this.options.cells.each(function(cell, index)
      {
        var rowCell = $(row.insertCell(index));
  
        $H(cell).each(function(attribute) 
        {
          switch (attribute[0])
          {
            case 'innerHTML':
  	          rowCell.update(attribute[1]);
              break;
            case 'className':
  	          rowCell.addClassName(attribute[1]);
              break;
            default:
              rowCell.writeAttribute(attribute[0], attribute[1]);          
          }
        });
      });  
      return row;
    }    
  }
};

/*
  Class: Proto.SelectionMethods
  
  Input selection helper methods.
  
  Example:
  (start code)
  Element.addMethods(Proto.SelectionMethods.elements, Proto.SelectionMethods.methods);
  (end)
*/

/*
  Group: Methods
*/
Proto.SelectionMethods = {
  elements: ['INPUT', 'TEXTAREA'],
  methods: {
    /*
      Function: getSelection
      
      Gets the current selection of the element.
      
      Parameters: 
        element - The element to get the selection of

      Returns: 
        (Object)
        - start - Selection start index
        - end - Selection end index
        - length - Length of selection
        - text - Selected text
    */
    getSelection: function(element)
    {
      element = $(element);
          
      /* Mozilla/DOM 3.0 */
      if ('selectionStart' in element) 
      {
        var length = element.selectionEnd - element.selectionStart;
        
        return { 
          start: element.selectionStart, 
          end: element.selectionEnd, 
          length: length, 
          text: element.value.substr(element.selectionStart, length) 
        };
      }
  
      /* IE */
      if (document.selection) 
      {
        element.focus();
  
        var r = document.selection.createRange();
  
        if (r == null)
          return { start: 0, end: element.value.length, length: 0 };
  
        var re = element.createTextRange();
        var rc = re.duplicate();
        re.moveToBookmark(r.getBookmark());
        rc.setEndPoint('EndToStart', re);
  
        return { 
          start: rc.text.length, 
          end: rc.text.length + r.text.length, 
          length: r.text.length, 
          text: r.text 
        };
      }
  
      return { start: 0, end: e.value.length, length: 0 };
    },
    
    /*
      Function: setSelection
      
      Sets the selection of an element.
      
      Parameters: 
        element - The element to set the selection
        start - Selection start index
        end - Selection end index

      Returns: 
        (Object)
        - start - Selection start index
        - end - Selection end index
        - length - Length of selection
        - text - Selected text
      
      See Also:
        <Proto.SelectionMethods.getSelection>
    */
    setSelection: function(element, start, end)
    {
      element = $(element);
      
      if (typeof end == 'undefined') end = start;
  
      /* Mozilla/DOM 3.0 */
      if ('selectionStart' in element) 
      {
        element.focus();
        element.setSelectionRange(start, end);
      }
  
      /* IE */
      if (document.selection) 
      {
        element.focus();
  
        var r = document.selection.createRange();
        if (r == null)
          return { start: 0, end: element.value.length, length: 0 };
  
        var tr = element.createTextRange();
  			tr.collapse(true);
  			tr.moveEnd('character', end);
  			tr.moveStart('character', start);
  			tr.select();
      }
      
      return element.getSelection();
    },
  
    /*
      Function: replaceSelection
      
      Replaces the current selection with the specified text.
      
      Parameters: 
        element - The element to replace the selection
        text - The text to replace with

      Returns: 
        element
    */
    replaceSelection: function(element, text) 
    {
      element = $(element);
      
      if (typeof text == 'undefined') text = '';
  
      /* Mozilla/DOM 3.0 */
      if ('selectionStart' in element) 
      {
        element.value = element.value.substr(0, element.selectionStart) + text + element.value.substr(element.selectionEnd, element.value.length);
        return element;
      }
  
      /* IE */
      if (document.selection) 
      {
        element.focus();
        document.selection.createRange().text = text;
        return element;
      }
  
      element.value += text;
      return element;
    }
  }
};