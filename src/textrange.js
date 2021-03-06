/**
 * Create a new text selection with no properties.  Do not use this constructor:
 * use one of the painter.dom.Range.createFrom* methods instead.
 * @constructor
 * @extends {painter.dom.AbstractRange}
 */
painter.dom.TextRange = function() {
};
/*goog.inherits(painter.dom.TextRange, painter.dom.AbstractRange);*/


/**
 * Create a new range wrapper from the given browser range object.  Do not use
 * this method directly - please use painter.dom.Range.createFrom* instead.
 * @param {Range|TextRange} range The browser range object.
 * @param {boolean=} opt_isReversed Whether the focus node is before the anchor
 *     node.
 * @return {painter.dom.TextRange} A range wrapper object.
 */
painter.dom.TextRange.createFromBrowserRange = function(range, opt_isReversed) {
  return painter.dom.TextRange.createFromBrowserRangeWrapper_(
      painter.dom.browserrange.createRange(range), opt_isReversed);
};


/**
 * Create a new range wrapper from the given browser range wrapper.
 * @param {painter.dom.browserrange.AbstractRange} browserRange The browser range
 *     wrapper.
 * @param {boolean=} opt_isReversed Whether the focus node is before the anchor
 *     node.
 * @return {painter.dom.TextRange} A range wrapper object.
 * @private
 */
painter.dom.TextRange.createFromBrowserRangeWrapper_ = function(browserRange,
    opt_isReversed) {
  var range = new painter.dom.TextRange();

  // Initialize the range as a browser range wrapper type range.
  range.browserRangeWrapper_ = browserRange;
  range.isReversed_ = !!opt_isReversed;

  return range;
};


/**
 * Create a new range wrapper that selects the given node's text.  Do not use
 * this method directly - please use painter.dom.Range.createFrom* instead.
 * @param {Node} node The node to select.
 * @param {boolean=} opt_isReversed Whether the focus node is before the anchor
 *     node.
 * @return {painter.dom.TextRange} A range wrapper object.
 */
painter.dom.TextRange.createFromNodeContents = function(node, opt_isReversed) {
  return painter.dom.TextRange.createFromBrowserRangeWrapper_(
      painter.dom.browserrange.createRangeFromNodeContents(node),
      opt_isReversed);
};


/**
 * Create a new range wrapper that selects the area between the given nodes,
 * accounting for the given offsets.  Do not use this method directly - please
 * use painter.dom.Range.createFrom* instead.
 * @param {Node} anchorNode The node to start with.
 * @param {number} anchorOffset The offset within the node to start.
 * @param {Node} focusNode The node to end with.
 * @param {number} focusOffset The offset within the node to end.
 * @return {painter.dom.TextRange} A range wrapper object.
 */
painter.dom.TextRange.createFromNodes = function(anchorNode, anchorOffset,
    focusNode, focusOffset) {
  var range = new painter.dom.TextRange();
  range.isReversed_ = painter.dom.Range.isReversed(anchorNode, anchorOffset,
      focusNode, focusOffset);

  // Avoid selecting BRs directly
  if (anchorNode.tagName == 'BR') {
    var parent = anchorNode.parentNode;
    anchorOffset = goog.array.indexOf(parent.childNodes, anchorNode);
    anchorNode = parent;
  }

  if (focusNode.tagName == 'BR') {
    var parent = focusNode.parentNode;
    focusOffset = goog.array.indexOf(parent.childNodes, focusNode);
    focusNode = parent;
  }

  // Initialize the range as a W3C style range.
  if (range.isReversed_) {
    range.startNode_ = focusNode;
    range.startOffset_ = focusOffset;
    range.endNode_ = anchorNode;
    range.endOffset_ = anchorOffset;
  } else {
    range.startNode_ = anchorNode;
    range.startOffset_ = anchorOffset;
    range.endNode_ = focusNode;
    range.endOffset_ = focusOffset;
  }

  return range;
};


// Representation 1: a browser range wrapper.


/**
 * The browser specific range wrapper.  This can be null if one of the other
 * representations of the range is specified.
 * @type {painter.dom.browserrange.AbstractRange?}
 * @private
 */
painter.dom.TextRange.prototype.browserRangeWrapper_ = null;


// Representation 2: two endpoints specified as nodes + offsets


/**
 * The start node of the range.  This can be null if one of the other
 * representations of the range is specified.
 * @type {Node}
 * @private
 */
painter.dom.TextRange.prototype.startNode_ = null;


/**
 * The start offset of the range.  This can be null if one of the other
 * representations of the range is specified.
 * @type {?number}
 * @private
 */
painter.dom.TextRange.prototype.startOffset_ = null;


/**
 * The end node of the range.  This can be null if one of the other
 * representations of the range is specified.
 * @type {Node}
 * @private
 */
painter.dom.TextRange.prototype.endNode_ = null;


/**
 * The end offset of the range.  This can be null if one of the other
 * representations of the range is specified.
 * @type {?number}
 * @private
 */
painter.dom.TextRange.prototype.endOffset_ = null;


/**
 * Whether the focus node is before the anchor node.
 * @type {boolean}
 * @private
 */
painter.dom.TextRange.prototype.isReversed_ = false;


// Method implementations


/**
 * @return {painter.dom.TextRange} A clone of this range.
 */
painter.dom.TextRange.prototype.clone = function() {
  var range = new painter.dom.TextRange();
  range.browserRangeWrapper_ = this.browserRangeWrapper_;
  range.startNode_ = this.startNode_;
  range.startOffset_ = this.startOffset_;
  range.endNode_ = this.endNode_;
  range.endOffset_ = this.endOffset_;
  range.isReversed_ = this.isReversed_;

  return range;
};


/** @override */
painter.dom.TextRange.prototype.getType = function() {
  return painter.dom.RangeType.TEXT;
};


/** @override */
painter.dom.TextRange.prototype.getBrowserRangeObject = function() {
  return this.getBrowserRangeWrapper_().getBrowserRange();
};


/** @override */
painter.dom.TextRange.prototype.setBrowserRangeObject = function(nativeRange) {
  // Test if it's a control range by seeing if a control range only method
  // exists.
  if (painter.dom.AbstractRange.isNativeControlRange(nativeRange)) {
    return false;
  }
  this.browserRangeWrapper_ = painter.dom.browserrange.createRange(
      nativeRange);
  this.clearCachedValues_();
  return true;
};


/**
 * Clear all cached values.
 * @private
 */
painter.dom.TextRange.prototype.clearCachedValues_ = function() {
  this.startNode_ = this.startOffset_ = this.endNode_ = this.endOffset_ = null;
};


/** @override */
painter.dom.TextRange.prototype.getTextRangeCount = function() {
  return 1;
};


/** @override */
painter.dom.TextRange.prototype.getTextRange = function(i) {
  return this;
};


/**
 * @return {painter.dom.browserrange.AbstractRange} The range wrapper object.
 * @private
 */
painter.dom.TextRange.prototype.getBrowserRangeWrapper_ = function() {
  return this.browserRangeWrapper_ ||
      (this.browserRangeWrapper_ = painter.dom.browserrange.createRangeFromNodes(
          this.getStartNode(), this.getStartOffset(),
          this.getEndNode(), this.getEndOffset()));
};


/** @override */
painter.dom.TextRange.prototype.getContainer = function() {
  return this.getBrowserRangeWrapper_().getContainer();
};


/** @override */
painter.dom.TextRange.prototype.getStartNode = function() {
  return this.startNode_ ||
      (this.startNode_ = this.getBrowserRangeWrapper_().getStartNode());
};


/** @override */
painter.dom.TextRange.prototype.getStartOffset = function() {
  return this.startOffset_ != null ? this.startOffset_ :
      (this.startOffset_ = this.getBrowserRangeWrapper_().getStartOffset());
};


/** @override */
painter.dom.TextRange.prototype.getEndNode = function() {
  return this.endNode_ ||
      (this.endNode_ = this.getBrowserRangeWrapper_().getEndNode());
};


/** @override */
painter.dom.TextRange.prototype.getEndOffset = function() {
  return this.endOffset_ != null ? this.endOffset_ :
      (this.endOffset_ = this.getBrowserRangeWrapper_().getEndOffset());
};


/**
 * Moves a TextRange to the provided nodes and offsets.
 * @param {Node} startNode The node to start with.
 * @param {number} startOffset The offset within the node to start.
 * @param {Node} endNode The node to end with.
 * @param {number} endOffset The offset within the node to end.
 * @param {boolean} isReversed Whether the range is reversed.
 */
painter.dom.TextRange.prototype.moveToNodes = function(startNode, startOffset,
                                                    endNode, endOffset,
                                                    isReversed) {
  this.startNode_ = startNode;
  this.startOffset_ = startOffset;
  this.endNode_ = endNode;
  this.endOffset_ = endOffset;
  this.isReversed_ = isReversed;
  this.browserRangeWrapper_ = null;
};


/** @override */
painter.dom.TextRange.prototype.isReversed = function() {
  return this.isReversed_;
};


/** @override */
painter.dom.TextRange.prototype.containsRange = function(otherRange,
                                                      opt_allowPartial) {
  var otherRangeType = otherRange.getType();
  if (otherRangeType == painter.dom.RangeType.TEXT) {
    return this.getBrowserRangeWrapper_().containsRange(
        otherRange.getBrowserRangeWrapper_(), opt_allowPartial);
  } else if (otherRangeType == painter.dom.RangeType.CONTROL) {
    var elements = otherRange.getElements();
    var fn = opt_allowPartial ? goog.array.some : goog.array.every;
    return fn(elements, function(el) {
      return this.containsNode(el, opt_allowPartial);
    }, this);
  }
  return false;
};


/**
 * Tests if the given node is in a document.
 * @param {Node} node The node to check.
 * @return {boolean} Whether the given node is in the given document.
 */
painter.dom.TextRange.isAttachedNode = function(node) {
  if (goog.userAgent.IE && !goog.userAgent.isDocumentMode(9)) {
    var returnValue = false;
    /** @preserveTry */
    try {
      returnValue = node.parentNode;
    } catch (e) {
      // IE sometimes throws Invalid Argument errors when a node is detached.
      // Note: trying to return a value from the above try block can cause IE
      // to crash.  It is necessary to use the local returnValue
    }
    return !!returnValue;
  } else {
    return painter.dom.contains(node.ownerDocument.body, node);
  }
};


/** @override */
painter.dom.TextRange.prototype.isRangeInDocument = function() {
  // Ensure any cached nodes are in the document.  IE also allows ranges to
  // become detached, so we check if the range is still in the document as
  // well for IE.
  return (!this.startNode_ ||
          painter.dom.TextRange.isAttachedNode(this.startNode_)) &&
         (!this.endNode_ ||
          painter.dom.TextRange.isAttachedNode(this.endNode_)) &&
         (!(goog.userAgent.IE && !goog.userAgent.isDocumentMode(9)) ||
          this.getBrowserRangeWrapper_().isRangeInDocument());
};


/** @override */
painter.dom.TextRange.prototype.isCollapsed = function() {
  return this.getBrowserRangeWrapper_().isCollapsed();
};


/** @override */
painter.dom.TextRange.prototype.getText = function() {
  return this.getBrowserRangeWrapper_().getText();
};


/** @override */
painter.dom.TextRange.prototype.getHtmlFragment = function() {
  // TODO(robbyw): Generalize the code in browserrange so it is static and
  // just takes an iterator.  This would mean we don't always have to create a
  // browser range.
  return this.getBrowserRangeWrapper_().getHtmlFragment();
};


/** @override */
painter.dom.TextRange.prototype.getValidHtml = function() {
  return this.getBrowserRangeWrapper_().getValidHtml();
};


/** @override */
painter.dom.TextRange.prototype.getPastableHtml = function() {
  // TODO(robbyw): Get any attributes the table or tr has.

  var html = this.getValidHtml();

  if (html.match(/^\s*<td\b/i)) {
    // Match html starting with a TD.
    html = '<table><tbody><tr>' + html + '</tr></tbody></table>';
  } else if (html.match(/^\s*<tr\b/i)) {
    // Match html starting with a TR.
    html = '<table><tbody>' + html + '</tbody></table>';
  } else if (html.match(/^\s*<tbody\b/i)) {
    // Match html starting with a TBODY.
    html = '<table>' + html + '</table>';
  } else if (html.match(/^\s*<li\b/i)) {
    // Match html starting with an LI.
    var container = this.getContainer();
    var tagType = painter.dom.TagName.UL;
    while (container) {
      if (container.tagName == painter.dom.TagName.OL) {
        tagType = painter.dom.TagName.OL;
        break;
      } else if (container.tagName == painter.dom.TagName.UL) {
        break;
      }
      container = container.parentNode;
    }
    html = goog.string.buildString('<', tagType, '>', html, '</', tagType, '>');
  }

  return html;
};


/**
 * Returns a TextRangeIterator over the contents of the range.  Regardless of
 * the direction of the range, the iterator will move in document order.
 * @param {boolean=} opt_keys Unused for this iterator.
 * @return {painter.dom.TextRangeIterator} An iterator over tags in the range.
 */
painter.dom.TextRange.prototype.__iterator__ = function(opt_keys) {
  return new painter.dom.TextRangeIterator(this.getStartNode(),
      this.getStartOffset(), this.getEndNode(), this.getEndOffset());
};


// RANGE ACTIONS


/** @override */
painter.dom.TextRange.prototype.select = function() {
  this.getBrowserRangeWrapper_().select(this.isReversed_);
};


/** @override */
painter.dom.TextRange.prototype.removeContents = function() {
  this.getBrowserRangeWrapper_().removeContents();
  this.clearCachedValues_();
};


/**
 * Surrounds the text range with the specified element (on Mozilla) or with a
 * clone of the specified element (on IE).  Returns a reference to the
 * surrounding element if the operation was successful; returns null if the
 * operation failed.
 * @param {Element} element The element with which the selection is to be
 *    surrounded.
 * @return {Element} The surrounding element (same as the argument on Mozilla,
 *    but not on IE), or null if unsuccessful.
 */
painter.dom.TextRange.prototype.surroundContents = function(element) {
  var output = this.getBrowserRangeWrapper_().surroundContents(element);
  this.clearCachedValues_();
  return output;
};


/** @override */
painter.dom.TextRange.prototype.insertNode = function(node, before) {
  var output = this.getBrowserRangeWrapper_().insertNode(node, before);
  this.clearCachedValues_();
  return output;
};


/** @override */
painter.dom.TextRange.prototype.surroundWithNodes = function(startNode, endNode) {
  this.getBrowserRangeWrapper_().surroundWithNodes(startNode, endNode);
  this.clearCachedValues_();
};


// SAVE/RESTORE


/** @override */
painter.dom.TextRange.prototype.saveUsingDom = function() {
  return new painter.dom.DomSavedTextRange_(this);
};


// RANGE MODIFICATION


/** @override */
painter.dom.TextRange.prototype.collapse = function(toAnchor) {
  var toStart = this.isReversed() ? !toAnchor : toAnchor;

  if (this.browserRangeWrapper_) {
    this.browserRangeWrapper_.collapse(toStart);
  }

  if (toStart) {
    this.endNode_ = this.startNode_;
    this.endOffset_ = this.startOffset_;
  } else {
    this.startNode_ = this.endNode_;
    this.startOffset_ = this.endOffset_;
  }

  // Collapsed ranges can't be reversed
  this.isReversed_ = false;
};


// SAVED RANGE OBJECTS



/**
 * A SavedRange implementation using DOM endpoints.
 * @param {painter.dom.AbstractRange} range The range to save.
 * @constructor
 * @extends {painter.dom.SavedRange}
 * @private
 */
painter.dom.DomSavedTextRange_ = function(range) {
  /**
   * The anchor node.
   * @type {Node}
   * @private
   */
  this.anchorNode_ = range.getAnchorNode();

  /**
   * The anchor node offset.
   * @type {number}
   * @private
   */
  this.anchorOffset_ = range.getAnchorOffset();

  /**
   * The focus node.
   * @type {Node}
   * @private
   */
  this.focusNode_ = range.getFocusNode();

  /**
   * The focus node offset.
   * @type {number}
   * @private
   */
  this.focusOffset_ = range.getFocusOffset();
};
goog.inherits(painter.dom.DomSavedTextRange_, painter.dom.SavedRange);


/**
 * @return {painter.dom.AbstractRange} The restored range.
 */
painter.dom.DomSavedTextRange_.prototype.restoreInternal = function() {
  return painter.dom.Range.createFromNodes(this.anchorNode_, this.anchorOffset_,
      this.focusNode_, this.focusOffset_);
};


/** @override */
painter.dom.DomSavedTextRange_.prototype.disposeInternal = function() {
  painter.dom.DomSavedTextRange_.superClass_.disposeInternal.call(this);

  this.anchorNode_ = null;
  this.focusNode_ = null;
};
