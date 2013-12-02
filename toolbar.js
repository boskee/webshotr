function writeToolbarScript(name) {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = false;
  ga.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'spwo.alpha/html5/toolbar/' + name;
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(ga, s);

}

var renderedSize = {width: 0, height: 0};
	
function data_of( txt )
{
  var data = txt.data;
  // Use ECMA-262 Edition 3 String and RegExp features
  data = data.replace(/[\t\n\r ]+/g, " ");
  /*if (data.charAt(0) == " ")
    data = data.substring(1, data.length);
  */
  if (data.charAt(data.length - 1) == " ")
    data = data.substring(0, data.length - 1);
  return data;
}
  
	function postRender() {
		var previewImg = Canvas2Image.saveAsPNG(document.getElementById('thecanvas'), true);
		document.body.appendChild(previewImg);
		document.getElementById('thecanvas').remove();
	}

function wrapText(context, text, x, y, maxWidth, lineHeight, textIndent, textOffset){
  var words = text.split(" ");
  var line = "";
  var actualWidth = 0;

  textOffset = textOffset || {left: 0, top: 0};

  textIndent += textOffset.left;

  y += textOffset.top + (lineHeight / 2);

  for (var n = 0; n < words.length; n++) {
      var testLine = line + words[n];
      var metrics = context.measureText(testLine);
      var testWidth = metrics.width + textIndent;
      if (testWidth > maxWidth) {
          metrics = context.measureText(line);
          testWidth = metrics.width + textIndent;
          context.fillText(data_of({data:line}), x + textIndent, y);
          line = words[n] + " ";
          y += lineHeight;
          textIndent = 0;
      }
      else {
          line = testLine + " ";
      }
      actualWidth = Math.max(actualWidth, testWidth);
  }
  context.fillText(data_of({data:line}), x + textIndent, y);
  return actualWidth;
}	

function wrappedTextHeight(context, text, x, y, maxWidth, lineHeight, textIndent, textOffset){
  var words = text.split(" ");
  var line = "";
  var actualHeight = lineHeight / 2;

  textOffset = textOffset || {left: 0, top: 0};

  textIndent += textOffset.left;

  y += textOffset.top + (lineHeight / 2);

  for (var n = 0; n < words.length; n++) {
      var testLine = line + words[n];
      var metrics = context.measureText(testLine);
      var testWidth = metrics.width + textIndent;
      if (testWidth > maxWidth) {
          metrics = context.measureText(line);
          testWidth = metrics.width + textIndent;
          line = words[n] + " ";
          y += lineHeight;
          actualHeight += lineHeight;
          textIndent = 0;
      }
      else {
          line = testLine + " ";
      }
  }
  actualHeight += lineHeight;
  return Math.ceil(actualHeight);
}	

(function() {
  //document.body.style.marginBottom = '28px';
  writeToolbarScript('canvas2image.js');
  writeToolbarScript('canvaslayers.js');
  writeToolbarScript('math.js');
  writeToolbarScript('useragent.js');
  writeToolbarScript('dom.js');
  writeToolbarScript('style.js');
  writeToolbarScript('canvas_box.js');
  document.body.innerHTML += '<canvas width="1800" height="2200" style="display: none;" id="thecanvas"></canvas>';
})();

(function($){

function isObject(val) {
  var type = typeof val;
  return type == 'object' && val != null || type == 'function';
  // return Object(val) === val also works, but is slower, especially if val is
  // not an object.
};


function getSize(element) {
  var style2 = painter.style.getStyleObject(element);
  if (style2.display != 'none') {
    return getSizeWithDisplay_(element);
  }

  var style = element.style;
  var originalDisplay = style.display;
  var originalVisibility = style.visibility;
  var originalPosition = style.position;

  style.visibility = 'hidden';
  style.position = 'absolute';
  style.display = 'inline';

  var size = getSizeWithDisplay_(element);

  style.display = originalDisplay;
  style.position = originalPosition;
  style.visibility = originalVisibility;

  return size;
};


/**
 * Gets the height and with of an element when the display is not none.
 * @param {Element} element Element to get size of.
 * @return {!goog.math.Size} Object with width/height properties.
 * @private
 */
function getSizeWithDisplay_(element) {
  var offsetWidth = element.offsetWidth;
  var offsetHeight = element.offsetHeight;
  var webkitOffsetsZero =
      userAgent.WEBKIT && !offsetWidth && !offsetHeight;
  if ((!(offsetWidth !== undefined) || webkitOffsetsZero) &&
      element.getBoundingClientRect) {
    // Fall back to calling getBoundingClientRect when offsetWidth or
    // offsetHeight are not defined, or when they are zero in WebKit browsers.
    // This makes sure that we return for the correct size for SVG elements, but
    // will still return 0 on Webkit prior to 534.8, see
    // http://trac.webkit.org/changeset/67252.
    var clientRect = painter.dom.getBoundingClientRect_(element);
    return new math.Size(clientRect.right - clientRect.left,
        clientRect.bottom - clientRect.top);
  }
  return new math.Size(offsetWidth, offsetHeight);
};

function getBounds(element) {
  var o = painter.style.getPageOffset(element);
  var s = getSize(element);
  return new math.Rect(o.x, o.y, s.width, s.height);
};

	// Renders parsed document
	function render() {
    	painter.Box.fromDom(document.body).render(postRender);
		document.getElementById('thecanvas').style.display = 'block';
	}

	function drawDOMElement(domElement, parentWidth, parentHeight) {
    if (!domElement.tagName || domElement.tagName == 'SCRIPT' || domElement.tagName == 'STYLE' || domElement.tagName == 'LINK' || is_all_ws(domElement) || domElement.nodeType == 3) {
      return false;
    }
		var ctx = document.getElementById('thecanvas').getContext("2d");
	  var nodeStyle = painter.Box.parseStyle(domElement);
	  if (!nodeStyle.visibility) { 
	    return;
	  }
	  if (nodeStyle.display != 'none') {
	      var offset = $(domElement).offset();
	      offset.top += borderTopWidth;
	      offset.left += borderLeftWidth;
	    if ($(domElement).outerWidth() > 0 && $(domElement).outerHeight() > 0) {
	      var borderLeftWidth = parseInt(nodeStyle.borderLeftWidth, 10);
	      var borderTopWidth = parseInt(nodeStyle.borderTopWidth, 10);
	      
	      var elemWidth = $(domElement).innerWidth();
	      var elemHeight = $(domElement).innerHeight();

        if (parentWidth && parentWidth < elemWidth) {
          elemWidth = parentWidth;
        }
        parentWidth = elemWidth;
        
        if (parentHeight && parentHeight < elemHeight)
        {
          elemHeight = parentHeight;
        }
        parentHeight = elemHeight;
	      
	      ctx.globalAlpha = nodeStyle.opacity;
	      
	      if (domElement.id == 'formcontainer') {
	        console.log(nodeStyle);
          ctx.lineJoin = "round";
          ctx.lineWidth = 8;
          ctx.strokeRect(offset.left+(8/2), offset.top+(8/2), elemWidth-8, elemHeight-8);
          ctx.fillRect(offset.left+(8/2), offset.top+(8/2), elemWidth-8, elemHeight-8);
	      } else {	      
	        if (nodeStyle.hasBackgroundColor && nodeStyle.visibility == 'visible' && nodeStyle.display != 'none') {
	          ctx.fillStyle = nodeStyle.backgroundColor;
	          ctx.fillRect(nodeStyle.rect.left, nodeStyle.rect.top, nodeStyle.rect.width, nodeStyle.rect.height);
	        }
	      }
	      
	      if (domElement.tagName == 'IMG') {
          var imgOffset = offset;
          var img = new Image();
          img.onload = function(){
            imgWidth = this.width;
            imgHeight = this.height;
            ctx.drawImage(this, imgOffset.left, imgOffset.top, imgWidth, imgHeight);        
          };
          img.src = domElement.src;
        }

        drawBorders(nodeStyle, offset, elemWidth, elemHeight);

        if (nodeStyle.backgroundImage && nodeStyle.backgroundImage != 'none') {
          drawBackground(nodeStyle, offset, elemWidth, elemHeight);
        }
      }

      if (nodeStyle.visibility == 'visible' && nodeStyle.display != 'none') {
	    var leftOffset = offset.left + parseInt(nodeStyle.paddingLeft, 10);
	    var topOffset = offset.top + parseInt(nodeStyle.paddingTop, 10);
	    ctx.textAlign = nodeStyle.textAlign.replace('-webkit-auto', 'left');
	    if (ctx.textAlign == 'right') {
		    for (var i = domElement.childNodes.length-1; i > 0; i--) {		  
	        ctx.fillStyle = nodeStyle.color;
	        ctx.font = nodeStyle.fontSize + " " + nodeStyle.fontFamily;
		      ctx.textAlign = nodeStyle.textAlign.replace('-webkit-auto', 'left');
		      ctx.textBaseline = 'top';
	        ctx.globalAlpha = nodeStyle.opacity;
	        if (domElement.childNodes[i].nodeType == 3 && offset && !is_all_ws(domElement.childNodes[i])) {
		        if (domElement.childNodes[i].prevSibling) {
		          leftOffset -= $(domElement.childNodes[i].prevSibling).outerWidth();
		          console.log(leftOffset);
		        }
		        leftOffset = drawText(ctx, nodeStyle, domElement.childNodes[i], leftOffset, topOffset, domElement);
	        } else {
		        drawDOMElement(domElement.childNodes[i], parentWidth, parentHeight);		
		      }
		    }
	    } else {
		    for (var i = 0; i < domElement.childNodes.length; i++) {		  
	        ctx.fillStyle = nodeStyle.color;
	        ctx.font = nodeStyle.fontSize + " " + nodeStyle.fontFamily;
		      ctx.textAlign = nodeStyle.textAlign.replace('-webkit-auto', 'left');
		      ctx.textBaseline = 'top';
	        ctx.globalAlpha = nodeStyle.opacity;
	        if (domElement.childNodes[i].nodeType == 3 && offset && !is_all_ws(domElement.childNodes[i])) {
		        if (domElement.childNodes[i].nextSibling) {
		          leftOffset -= $(domElement.childNodes[i].nextSibling).outerWidth();
		        }
		        leftOffset = drawText(ctx, nodeStyle, domElement.childNodes[i], leftOffset, topOffset, domElement);
	        } else {
		        drawDOMElement(domElement.childNodes[i], parentWidth, parentHeight);		
		      }
		    }
		  }
		  }
	  }
	  
	}
	
	function drawText(ctx, nodeStyle, elem, leftOffset, topOffset, domElement) {
    if (ctx.textAlign == 'center') {
      leftOffset += $(domElement).width()/2;
    } else if (ctx.textAlign == 'right') {
      leftOffset += $(domElement).width();
    }
    var actualWidth = wrapText(ctx, data_of(elem), leftOffset, topOffset, $(domElement).width(), parseInt(nodeStyle.lineHeight, 10));
    
    return leftOffset + actualWidth;
	}

	// Populates DOM attributes
	/*
	parentNode
	The parent of this node.
	childNodes
	A NodeList that contains all children of this node.
	firstChild
	The first child of this node.
	lastChild
	The last child of this node.
	previousSibling
	The node immediately preceding this node.
	nextSibling
	The node immediately following this node.
	attributes
	A NamedNodeMap containing the attributes of this node (if it is an Element) or null otherwise.
	ownerDocument
	*/
	function populateDOM(root)
	{
		var nodeStack = [];
		var curNode = root;
		var lastNode = null;

		/*
		BODY[ch=[P,P], fc=P, lc=P]
		  P [pn=BODY, cn=P, ln=P, ch=[B,TX,B], fc=B, lc=B, ns=P]
		    B [pn=P, cn=B, ns=TX]
		    TX [cn=TX, ps=B, pn=P, ns=B]
		    B [cn=B, ps=TX, pn=P]
		  P [cn=P, ps=P, pn=BODY]
		*/
		root.iterateNodes(function(node){

			// Reset children
			node.childNodes = null;
			node.firstChild = null;
			node.lastChild = null;
			node.previousSibling = null;
			node.nextSibling = null;

			if (node.parentIndex < curNode.index) {
				// Closed nodes
				nodeStack = popToNodeStack(nodeStack, node.parentIndex);
				curNode = nodeStack[nodeStack.length-1];
			}

			// Set children of parents
			if (curNode.childNodes == null) {
				curNode.childNodes = [node];
				curNode.firstChild = node;
			} else {
				curNode.childNodes.push(node);
			}

			// Set siblings
			if (curNode.lastChild) {
				curNode.lastChild.nextSibling = node;
				node.previousSibling = curNode.lastChild;
			}
			curNode.lastChild = node;
			node.parentNode = curNode;

			// Update stack
			if (node.parentIndex >= curNode.index) {
				// Open nodes
				nodeStack.push(node);
				curNode = node;
			}

			lastNode = node;
			return true;
		});
	}

	// Functions to make basic content nodes

	function addContentNode(document, content, parent)
	{
		var anon = new docNode(3, document);
		if (parent.tagName == 'SPAN')
			anon.nodeValue = content;
		else
			anon.nodeValue = content;

		anon.index = document.nodes.length;
		anon.parentIndex = parent.index;
		document.nodes.push(anon);
		return anon;
	}


	function addRootNode(document, content, parent)
	{
		var anon = new docNode(1, document);
		anon.nodeValue = content;
		anon.index = document.nodes.length;
		anon.parentIndex = -1;
		document.nodes.push(anon);
		return anon;
	}

	function addDocAttrNode(document, content, parent)
	{
		var anon = new docNode(2, document);
		anon.nodeValue = content;
		anon.index = document.nodes.length;
		anon.parentIndex = parent.index;
		document.nodes.push(anon);
		return anon;
	}

	function addBodyNode(document, content, parent)
	{
		var anon = new docNode(9, document);
		anon.nodeValue = content;
		anon.index = document.nodes.length;
		anon.parentIndex = parent.index;
		document.nodes.push(anon);
		return anon;
	}

	function addDummyNode(document, content, parent)
	{
		var anon = new docNode(1, document);
		anon.nodeType = 0;
		anon.nodeValue = content;
		anon.index = document.nodes.length;
		anon.parentIndex = parent.index;
		document.nodes.push(anon);
		return anon;
	}

	var makeTagFuncs = {
		'HTML': addRootNode,
		'TITLE': addDocAttrNode,
		'BODY': addBodyNode,
		'P': addDummyNode,
		'B': addDummyNode,
		'SPAN': addDummyNode,
	};

	var HTMLCommentStrip = new RegExp("<![^>]*>"); // a bit simple, but works for now

	// Parses document
	//
	// e.g. "<html><head><title></title></head><body><p class="top">FOO <b>woo</b></p><p>Foo 2</p></body></html>"
	//
	// [["html", "", 0, -1], 
	//  ["head", "", 1, 0], 
	//  ["title", "", 2, 1],
	//  ["body", "", 3, 0],
	//  ["p", "FOO ", 4, 3],
	//  ["b", "woo", 5, 4],
	//  ["p", "Foo 2", 6, 3],
	// ]
	//
	function parse(doc) {
		var tagParse = new RegExp("</?([A-Za-z]*)( ([a-zA-Z0-9_-]*=(\".*\")|('.*') ?)*)?>", "");

		var rawDoc = doc.replace(HTMLCommentStrip, "");
		var startIDX = 0;
		var curStr = doc;
		var nodeStack = [];
		var genDoc = new docHTML();
		var len = rawDoc.length;
		var topNode = null;

		// Search for tags...
		while (startIDX != -1 && startIDX < len) {
			var searchStr = rawDoc.substr(startIDX);
			var nextTag = searchStr.search(tagParse);

			//debugLog("SS:" + searchStr);

			if (nextTag != -1) {
				// Found tag, start wih content + name
				var content = searchStr.substr(0, nextTag); // existing node content
				searchStr = searchStr.substr(nextTag);
				var tagName = searchStr.match("</?([A-Za-z]*)")[1].toUpperCase();
				var isClosing = searchStr.indexOf('/') == 1;

				//debugLog("Found tag " + tagName);
				//debugLog("CONTENT:" + content);
				//debugLog("CLOSING:" + isClosing);

				// Advance next search pos
				startIDX += nextTag + searchStr.indexOf('>') + 1;

				// Insert content node
				if (topNode != 0 && content.length > 0) {
					addContentNode(genDoc, content, topNode);
				}

				// Open or close nodes
				if (!isClosing) {
					// Add node
					var tagFunc = makeTagFuncs[tagName];
					if (tagFunc)
						topNode = tagFunc(genDoc, tagName, topNode);
					else
						topNode = addDummyNode(genDoc, tagName, topNode)
					topNode.tagName = tagName;

					// Parse attributes
					var rg = new RegExp("([A-Za-z0-9_-]*)=((?:\"[^\"]*)|(?:'[^']*))", "g");
					var scans = searchStr.substr(1, searchStr.indexOf('>')-1);
					var attrs = null;

					while ((attrs = rg.exec(scans)) != null) {
						topNode.attributes[attrs[1]] = attrs[2].substr(1);
					}

					nodeStack.push(topNode);
				} else {
					// Close matching node
					var closedNodeIDX = findOpenNode(nodeStack, tagName);
					//debugLog("CLOSED IDX==" + closedNodeIDX);
					//debugLog(nodeStack);
					if (closedNodeIDX >= 0) {
						nodeStack = nodeStack.slice(0, closedNodeIDX);
					}

					if (nodeStack.length > 0)
						topNode = nodeStack[nodeStack.length-1];
					else
						topNode = null;

					continue;
				}
			} else // no more tags
				break;
		}

		debugLog("Generated Doc:");
		debugLog(genDoc);

		// Find useful data
		genDoc.body = findBody(genDoc.nodes);
		genDoc.head = genDoc.nodes[0].getFirstElementByTagName('HEAD');
		if (genDoc.head) {
			var title = genDoc.nodes[0].getFirstElementByTagName('TITLE');
			if (title) {
				title = title.getFirstElementByTagName('*');
				if (title)
					genDoc.title = title.nodeValue;
			}
		}

		return genDoc;
	}

	// CSS Parser
	var CSSCommentStrip = new RegExp("/\\*[^\\*]*\\*/");
	function stripCSSComments(str) {
		return str.replace(CSSCommentStrip, "");
	}

	function parseCSSSelectors(doc) {
		// chunker taken from sizzle, (C) Copyright 2009, The Dojo Foundation
		var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^[\]]*\]|['"][^'"]*['"]|[^[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?/g;
		var selectorList = [];
		var elements = [];
		var nextElement;

		var lastElement = null;
		var matchParent = false;
		var matchSibling = false;

		while ((nextElement = chunker.exec(doc)) != null) {
			// TODO: hook into an existing CSS selector lib

			var rule = nextElement[1];
			elements.push(rule);

			if (nextElement[2] && nextElement[2].substr(0,1) == ',') {
				// Selector ended
				selectorList.push(elements);
				elements = [];
			}
		}

		// Final element?
		if (elements.length != 0)
			selectorList.push(elements);

		return selectorList;
	}

	function parseCSSProperties(doc) {
		var nameParse = new RegExp("([A-Za-z0-9\-_]+):", "g");
		var propParse = /((?:'[^']*')|(?:"[^"]*")|[^;}])*/;
		var propertyList = {};
		var nextName;

		while ((nextName = nameParse.exec(doc)) != null) {
			var name = nextName[1];
			var foundProp = propParse.exec(doc.substr(nameParse.lastIndex));

			propertyList[name] = foundProp[0]; // TODO: parse value -> values
			nextName.lastIndex = foundProp.index + foundProp[0].length + 1;
		}

		return propertyList;
	}

	function parseCSS(doc) {
		var rawDoc = stripCSSComments(doc);
		var blockParse = /(?:(@[a-zA-z]+)\s((?:[A-Za-z]+)|(?:'[^']*')|(?:"[^"]*")|(?:(?:[A-Za-z]*)\([^\)]*\)));)|({[^{]*})/g;

		var startIDX = 0;
		var len = rawDoc.length;

		// TODO: handle blocks better
		while (startIDX != -1 && startIDX < len) {
			var nextBlock = blockParse.exec(rawDoc);

			if (nextBlock != null) {
				if (nextBlock[1]) {
					// key [1]
					// value [2]
					// TODO
					console.log("RULE: " + nextBlock[1] + ',' + nextBlock[2]);
				} else if (nextBlock[3]) {
					// Normal selector block
					var selectors = parseCSSSelectors(rawDoc.substr(startIDX, nextBlock.index-startIDX));
					var blockStr = rawDoc.substr(nextBlock.index+1, blockParse.lastIndex-nextBlock.index-1);
					debugLog("BLOCK:"+blockStr);

					var properties = parseCSSProperties(blockStr);
					debugLog('++');
					debugLog(selectors);
					debugLog("--");
					debugLog(properties);
					debugLog('++');
				}

				startIDX = blockParse.lastIndex;
			} else
				break;
		}
	}

	// Parse and load a sample document
	$(window).load(function() {
		renderedSize.width = $(document).outerWidth();
		renderedSize.height = $(document).outerHeight();
	document.getElementById('thecanvas').height = renderedSize.height;
	document.getElementById('thecanvas').width = renderedSize.width;
  render();
		/*var ctx = document.getElementById('thecanvas').getContext("2d");    
    var img = new Image();
    img.onload = function(){
      var patternWidth = 100;
      var patternHeight = 100;
      var pattern = ctx.createPattern(this, 'repeat');   
      ctx.fillStyle = pattern;
      ctx.translate(100, 100);
      ctx.fillRect(0, 0, patternWidth, patternHeight);
      ctx.translate(-100, -100);
    };
    img.src = 'http://image.providesupport.com/image/ecomovers/offline-1783088642.gif'; // http://eco-dev.alpha/images/backgrounds/sunken_tl.gif*/
	});
}(jQuery));
