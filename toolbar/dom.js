var painter = {};

painter.container;

painter.dom = {};

painter.dom.ASSUME_QUIRKS_MODE = false;

painter.dom.ASSUME_STANDARDS_MODE = false;

painter.dom.COMPAT_MODE_KNOWN_ =
    painter.dom.ASSUME_QUIRKS_MODE || painter.dom.ASSUME_STANDARDS_MODE;

painter.dom.NodeType = {
  ELEMENT: 1,
  ATTRIBUTE: 2,
  TEXT: 3,
  CDATA_SECTION: 4,
  ENTITY_REFERENCE: 5,
  ENTITY: 6,
  PROCESSING_INSTRUCTION: 7,
  COMMENT: 8,
  DOCUMENT: 9,
  DOCUMENT_TYPE: 10,
  DOCUMENT_FRAGMENT: 11,
  NOTATION: 12
};

painter.dom.defaultDomHelper_;

painter.dom.DomHelper = function(opt_document) {
  /**
   * Reference to the document object to use
   * @type {!Document}
   * @private
   */
  this.document_ = opt_document || document;
};

painter.dom.DomHelper.prototype.getDomHelper = painter.dom.getDomHelper;

painter.dom.DomHelper.prototype.getDocument = function() {
  return this.document_;
};

painter.dom.DomHelper.prototype.getDocumentScroll = function() {
  return painter.dom.getDocumentScroll_(this.document_);
};

painter.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return painter.dom.getDocumentScrollElement_(this.document_);
};

painter.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  // TODO(arv): This should not take an argument. That breaks the rule of a
  // a DomHelper representing a single frame/window/document.
  return painter.dom.getViewportSize(opt_window || this.getWindow());
};

painter.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return painter.dom.isCss1CompatMode_(this.document_);
};

painter.dom.DomHelper.prototype.getWindow = function() {
  return painter.dom.getWindow_(this.document_);
};

painter.dom.isCss1CompatMode_ = function(doc) {
  if (painter.dom.COMPAT_MODE_KNOWN_) {
    return painter.dom.ASSUME_STANDARDS_MODE;
  }

  return doc.compatMode == 'CSS1Compat';
};

painter.dom.getViewportSize = function(opt_window) {
  // TODO(arv): This should not take an argument
  return painter.dom.getViewportSize_(opt_window || window);
};

/**
 * Helper for {@code getViewportSize}.
 * @param {Window} win The window to get the view port size for.
 * @return {!goog.math.Size} Object with values 'width' and 'height'.
 * @private
 */
painter.dom.getViewportSize_ = function(win) {
  var doc = win.document;

  /*
  if (userAgent.WEBKIT && $.browser.version.slice(0,3) != '500' &&
      !userAgent.MOBILE) {
    // TODO(doughtie): Sometimes we get something that isn't a valid window
    // object. In this case we just revert to the current window. We need to
    // figure out when this happens and find a real fix for it.
    // See the comments on goog.dom.getWindow.
    if (typeof win.innerHeight == 'undefined') {
      win = window;
    }
    var innerHeight = win.innerHeight;
    var scrollHeight = win.document.documentElement.scrollHeight;

    if (win == win.top) {
      if (scrollHeight < innerHeight) {
        innerHeight -= 15; // Scrollbars are 15px wide on Mac
      }
    }
    return new math.Size(win.innerWidth, innerHeight);
  }
  */

  var el = painter.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;

  return new math.Size(el.clientWidth, el.clientHeight);
};

painter.dom.getClientViewportElement = function(opt_node) {
  var doc;
  if (opt_node) {
    if (opt_node.nodeType == painter.dom.NodeType.DOCUMENT) {
      doc = opt_node;
    } else {
      doc = painter.dom.getOwnerDocument(opt_node);
    }
  } else {
    doc = document;
  }

  // In old IE versions the document.body represented the viewport
  if (userAgent.IE && !userAgent.isDocumentMode(9) &&
      !painter.dom.getDomHelper(doc).isCss1CompatMode()) {
    return doc.body;
  }
  return doc.documentElement;
};

painter.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView;
};

painter.dom.getBoundingClientRect_ = function(el) {
  var rect;
  try {
    rect = el.getBoundingClientRect();
  } catch (e) {
    // In IE < 9, calling getBoundingClientRect on an orphan element raises an
    // "Unspecified Error". All other browsers return zeros.
    return {'left': 0, 'top': 0, 'right': 0, 'bottom': 0};
  }
  // Patch the result in IE only, so that this function can be inlined if
  // compiled for non-IE.
  if (userAgent.IE) {
    // In IE, most of the time, 2 extra pixels are added to the top and left
    // due to the implicit 2-pixel inset border.  In IE6/7 quirks mode and
    // IE6 standards mode, this border can be overridden by setting the
    // document element's border to zero -- thus, we cannot rely on the
    // offset always being 2 pixels.

    // In quirks mode, the offset can be determined by querying the body's
    // clientLeft/clientTop, but in standards mode, it is found by querying
    // the document element's clientLeft/clientTop.  Since we already called
    // getClientBoundingRect we have already forced a reflow, so it is not
    // too expensive just to query them all.

    // See: http://msdn.microsoft.com/en-us/library/ms536433(VS.85).aspx
    var doc = el.ownerDocument;
    rect.left -= doc.documentElement.clientLeft + doc.body.clientLeft;
    rect.top -= doc.documentElement.clientTop + doc.body.clientTop;
  }
  return /** @type {Object} */ (rect);
};

painter.dom.getOwnerDocument = function(node) {
  // TODO(user): Remove IE5 code.
  // IE5 uses document instead of ownerDocument
  return /** @type {!Document} */ (
      node.nodeType == painter.dom.NodeType.DOCUMENT ? node :
      node.ownerDocument || node.document);
};

painter.dom.getDomHelper = function(opt_element) {
  return opt_element ?
      new painter.dom.DomHelper(painter.dom.getOwnerDocument(opt_element)) :
      (painter.dom.defaultDomHelper_ ||
          (painter.dom.defaultDomHelper_ = new painter.dom.DomHelper()));
};

painter.dom.getDocumentScrollElement = function() {
  return painter.dom.getDocumentScrollElement_(document);
};

painter.dom.getDocumentScroll_ = function(doc) {
  var el = painter.dom.getDocumentScrollElement_(doc);
  var win = painter.dom.getWindow_(doc);
  return new math.Coordinate(win.pageXOffset || el.scrollLeft,
      win.pageYOffset || el.scrollTop);
};

painter.dom.getDocumentScrollElement_ = function(doc) {
  // Safari (2 and 3) needs body.scrollLeft in both quirks mode and strict mode.
  return !userAgent.WEBKIT && painter.dom.isCss1CompatMode_(doc) ?
      doc.documentElement : doc.body;
};
