painter.style = {};

painter.style.styleCache = {};
painter.style.UUID = 0;

painter.style.getStyleObject = function(dom) {
  var style;
  var returns = {};
  
  if (dom.styleUUID && painter.style.styleCache[dom.styleUUID]) {
    return painter.style.styleCache[dom.styleUUID];
  }
    
  if(window.getComputedStyle) {
    var camelize = function(a,b){
        return b.toUpperCase();
    };
    if (style = window.getComputedStyle(dom, null)) {
      for(var i = 0, l = style.length; i < l; i++){
          var prop = style[i];
          var camel = prop.replace(/\-([a-z])/g, camelize);
          var val = style.getPropertyValue(prop);
          returns[camel] = val;
      };
    }
  } else if(style = dom.currentStyle) {
    for(var prop in style){
        returns[prop] = style[prop];
    }
  } else if(style = dom.style) {
    for(var prop in style){
      if(typeof style[prop] != 'function'){
        returns[prop] = style[prop];
      };
    };
  };
  dom.styleUUID = '_sp' + (painter.style.UUID++);
  painter.style.styleCache[dom.styleUUID] = returns;
  return returns;
};

painter.style.getPageOffset = function(el) {
  var box, doc = painter.dom.getOwnerDocument(el);
  var style = painter.style.getStyleObject(el);
  var positionStyle = style.position;
  
  // NOTE(user): Gecko pre 1.9 normally use getBoxObjectFor to calculate the
  // position. When invoked for an element with position absolute and a negative
  // position though it can be off by one. Therefor the recursive implementation
  // is used in those (relatively rare) cases.
  var BUGGY_GECKO_BOX_OBJECT = userAgent.GECKO && doc.getBoxObjectFor &&
      !el.getBoundingClientRect && positionStyle == 'absolute' &&
      (box = doc.getBoxObjectFor(el)) && (box.screenX < 0 || box.screenY < 0);

  // NOTE(user): If element is hidden (display none or disconnected or any the
  // ancestors are hidden) we get (0,0) by default but we still do the
  // accumulation of scroll position.

  // TODO(user): Should we check if the node is disconnected and in that case
  //            return (0,0)?

  var pos = new math.Coordinate(0, 0);
  var viewportElement = painter.dom.getClientViewportElement(doc);
  if (el == viewportElement) {
    // viewport is always at 0,0 as that defined the coordinate system for this
    // function - this avoids special case checks in the code below
    return pos;
  }

  // IE and Gecko 1.9+.
  if (el.getBoundingClientRect) {
    box = painter.dom.getBoundingClientRect_(el);
    // Must add the scroll coordinates in to get the absolute page offset
    // of element since getBoundingClientRect returns relative coordinates to
    // the viewport.
    var scrollCoord = painter.dom.getDomHelper(doc).getDocumentScroll();
    pos.x = box.left + scrollCoord.x;
    pos.y = box.top + scrollCoord.y;
  // Gecko prior to 1.9.
  } else if (doc.getBoxObjectFor && !BUGGY_GECKO_BOX_OBJECT) {
    // Gecko ignores the scroll values for ancestors, up to 1.9.  See:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=328881 and
    // https://bugzilla.mozilla.org/show_bug.cgi?id=330619

    box = doc.getBoxObjectFor(el);
    // TODO(user): Fix the off-by-one error when window is scrolled down
    // or right more than 1 pixel. The viewport offset does not move in lock
    // step with the window scroll; it moves in increments of 2px and at
    // somewhat random intervals.
    var vpBox = doc.getBoxObjectFor(viewportElement);
    pos.x = box.screenX - vpBox.screenX;
    pos.y = box.screenY - vpBox.screenY;

  // Safari, Opera and Camino up to 1.0.4.
  } else {
    var parent = el;
    do {
      pos.x += parent.offsetLeft;
      pos.y += parent.offsetTop;
      // For safari/chrome, we need to add parent's clientLeft/Top as well.
      if (parent != el) {
        pos.x += parent.clientLeft || 0;
        pos.y += parent.clientTop || 0;
      }
  var styleTmp = painter.style.getStyleObject(parent);
      // In Safari when hit a position fixed element the rest of the offsets
      // are not correct.
      if (userAgent.WEBKIT &&
          styleTmp.position == 'fixed') {
        pos.x += doc.body.scrollLeft;
        pos.y += doc.body.scrollTop;
        break;
      }
      parent = parent.offsetParent;
    } while (parent && parent != el);

    // Opera & (safari absolute) incorrectly account for body offsetTop.
    if (userAgent.OPERA || (userAgent.WEBKIT &&
        positionStyle == 'absolute')) {
      pos.y -= doc.body.offsetTop;
    }

    for (parent = el; (parent = painter.style.getOffsetParent(parent)) &&
        parent != doc.body && parent != viewportElement; ) {
      pos.x -= parent.scrollLeft;
      // Workaround for a bug in Opera 9.2 (and earlier) where table rows may
      // report an invalid scroll top value. The bug was fixed in Opera 9.5
      // however as that version supports getBoundingClientRect it won't
      // trigger this code path. https://bugs.opera.com/show_bug.cgi?id=249965
      if (!userAgent.OPERA || parent.tagName != 'TR') {
        pos.y -= parent.scrollTop;
      }
    }
  }

  return pos;
};

painter.style.getOffsetParent = function(element) {
  // element.offsetParent does the right thing in IE, in other browser it
  // only includes elements with position absolute, relative or fixed, not
  // elements with overflow set to auto or scroll.
  if (userAgent.IE && !userAgent.isDocumentMode(8)) {
    return element.offsetParent;
  }

  var style = $.extend({}, painter.style.getStyleObject(element));
  
  var doc = painter.dom.getOwnerDocument(element);
  var positionStyle = style.position;
  var skipStatic = positionStyle == 'fixed' || positionStyle == 'absolute';
  for (var parent = element.parentNode; parent && parent != doc;
       parent = parent.parentNode) {
       var style2 = $.extend({}, painter.style.getStyleObject(parent));
    positionStyle = style2.position;
    skipStatic = skipStatic && positionStyle == 'static' &&
                 parent != doc.documentElement && parent != doc.body;
    if (!skipStatic && (parent.scrollWidth > parent.clientWidth ||
                        parent.scrollHeight > parent.clientHeight ||
                        positionStyle == 'fixed' ||
                        positionStyle == 'absolute' ||
                        positionStyle == 'relative')) {
      return /** @type {!Element} */ (parent);
    }
  }
  return null;
};

painter.style.getVisibleRectForElement = function(element) {
  var visibleRect = new math.Box(0, Infinity, Infinity, 0);

  var dom = painter.dom.getDomHelper(element);
  var body = dom.getDocument().body;
  var documentElement = dom.getDocument().documentElement;
  var scrollEl = dom.getDocumentScrollElement();
  
  // Determine the size of the visible rect by climbing the dom accounting for
  // all scrollable containers.
  for (var el = element; el = painter.style.getOffsetParent(el); ) {
    // clientWidth is zero for inline block elements in IE.
    // on WEBKIT, body element can have clientHeight = 0 and scrollHeight > 0
    var style = $.extend({}, painter.style.getStyleObject(el));
    if ((!userAgent.IE || el.clientWidth != 0) &&
        (!userAgent.WEBKIT || el.clientHeight != 0 || el != body) &&
        // body may have overflow set on it, yet we still get the entire
        // viewport. In some browsers, el.offsetParent may be
        // document.documentElement, so check for that too.
        (el != body && el != documentElement &&
//            (style.overflowX != 'visible' || style.overflowY != 'visible'))) {
            (painter.style.getStyle_(el, 'overflow') != 'visible'))) {
      var pos = painter.style.getPageOffset(el);

      var client = painter.style.getClientLeftTop(el);
      pos.x += client.x;
      pos.y += client.y;

      visibleRect.top = Math.max(visibleRect.top, pos.y);
      visibleRect.right = Math.min(visibleRect.right,
                                   pos.x + el.clientWidth);
      visibleRect.bottom = Math.min(visibleRect.bottom,
                                    pos.y + el.clientHeight);
      visibleRect.left = Math.max(visibleRect.left, pos.x);
    }
  }

  // FIXME - we need to bring back clipping functionality, but it must be optional
  if (false) {
    var scrollX = scrollEl.scrollLeft, scrollY = scrollEl.scrollTop;
    visibleRect.left = Math.max(visibleRect.left, scrollX);
    visibleRect.top = Math.max(visibleRect.top, scrollY);
    var winSize = dom.getViewportSize();
    visibleRect.right = Math.min(visibleRect.right, scrollX + winSize.width);
    visibleRect.bottom = Math.min(visibleRect.bottom, scrollY + winSize.height);
  }

  return visibleRect.top >= 0 && visibleRect.left >= 0 &&
         visibleRect.bottom > visibleRect.top &&
         visibleRect.right > visibleRect.left ?
         visibleRect : null;
};




/**
 * Retrieves a computed style value of a node. It returns empty string if the
 * value cannot be computed (which will be the case in Internet Explorer) or
 * "none" if the property requested is an SVG one and it has not been
 * explicitly set (firefox and webkit).
 *
 * @param {Element} element Element to get style of.
 * @param {string} property Property to get (camel-case).
 * @return {string} Style value.
 */
painter.style.getComputedStyle = function(element, property) {
  var doc = painter.dom.getOwnerDocument(element);
  if (doc.defaultView && doc.defaultView.getComputedStyle) {
    var styles = doc.defaultView.getComputedStyle(element, null);
    if (styles) {
      // element.style[..] is undefined for browser specific styles
      // as 'filter'.
      return styles[property] || styles.getPropertyValue(property) || '';
    }
  }

  return '';
};


/**
 * Gets the cascaded style value of a node, or null if the value cannot be
 * computed (only Internet Explorer can do this).
 *
 * @param {Element} element Element to get style of.
 * @param {string} style Property to get (camel-case).
 * @return {string} Style value.
 */
painter.style.getCascadedStyle = function(element, style) {
  // TODO(nicksantos): This should be documented to return null. #fixTypes
  return element.currentStyle ? element.currentStyle[style] : null;
};

painter.style.getStyle_ = function(element, style) {
  return painter.style.getComputedStyle(element, style) ||
         painter.style.getCascadedStyle(element, style) ||
         (element.style && element.style[style]);
};

painter.style.normalizeColour = function(colour) {
  var normalized = colour;
  if (colour.indexOf('rgba') != -1) {
    var opacity = parseFloat(colour.replace(/rgba\(([0-9\.]+), ([0-9\.]+), ([0-9\.]+), ([0-9\.]+)\)/, '$4'));
    if (opacity == 0) {
      normalized = 'transparent';
    }
  }
  return normalized;
};

painter.style.getClientLeftTop = function(el) {
  // NOTE(eae): Gecko prior to 1.9 doesn't support clientTop/Left, see
  // https://bugzilla.mozilla.org/show_bug.cgi?id=111207
  if (userAgent.GECKO && !userAgent.isVersionOrHigher('1.9')) {
    var style = painter.style.getStyleObject(el);
    var left = parseFloat(style.borderLeftWidth);
    if (painter.style.isRightToLeft(el)) {
      var scrollbarWidth = el.offsetWidth - el.clientWidth - left -
          parseFloat(style.borderRightWidth);
      left += scrollbarWidth;
    }
    return new math.Coordinate(left,
        parseFloat(style.borderTopWidth));
  }

  return new math.Coordinate(el.clientLeft, el.clientTop);
};

/**
 * Calculates the viewport coordinates relative to the page/document
 * containing the node. The viewport may be the browser viewport for
 * non-iframe document, or the iframe container for iframe'd document.
 * @param {!Document} doc The document to use as the reference point.
 * @return {!goog.math.Coordinate} The page offset of the viewport.
 */
painter.style.getViewportPageOffset = function(doc) {
  var body = doc.body;
  var documentElement = doc.documentElement;
  var scrollLeft = body.scrollLeft || documentElement.scrollLeft;
  var scrollTop = body.scrollTop || documentElement.scrollTop;
  return new math.Coordinate(scrollLeft, scrollTop);
};

painter.style.isRightToLeft = function(el) {
  var style = painter.style.getStyleObject(el);
  return 'rtl' == style.direction;
};
