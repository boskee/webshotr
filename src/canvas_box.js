if (!$) {
  $ = jQuery;
}

var Color = net.brehaut.Color;

painter.Rect = function(x, y, w, h) {
  return painter.Rect.superClass_.constructor.apply(
      this, [x, y, w, h]);
};

function tempCtor() {};
tempCtor.prototype = math.Rect.prototype;
painter.Rect.superClass_ = math.Rect.prototype;
painter.Rect.prototype = new tempCtor();
painter.Rect.prototype.constructor = painter.Rect;

painter.Rect.prototype.fill = function(ctx, style) {
  ctx.save();
  ctx.fillStyle = style;
  ctx.fillRect(this.left, this.top, this.width, this.height);
  ctx.restore();
};

painter.Rect.prototype.shift = function(x, y) {
  this.left += x;
  this.top += y;
  return this;
};

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function getTextNodesIn(node, start) {
  var textNodes = [];
  var start = start || 0,
      end = start;
  if (node.nodeType == 3) {
    end += node.length;
    textNodes.push([node, start, end]);
  } else {
    var children = node.childNodes;
    for (var i = 0, len = children.length; i < len; ++i) {
      textNodes.push.apply(textNodes, getTextNodesIn(children[i]));
    }
  }
  return textNodes;
}

function setSelectionRange2(el, start, end) {
  if (document.createRange && window.getSelection) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var textNodes = getTextNodesIn(el);
    var foundStart = false;
    var charCount = 0, endCharCount;

    for (var i = 0, textNode; textNode = textNodes[i++]; ) {
      endCharCount = charCount + textNode.length;
      if (!foundStart && start >= charCount
              && (start < endCharCount ||
              (start == endCharCount && i < textNodes.length))) {
        range.setStart(textNode, start - charCount);
        foundStart = true;
      }
      if (foundStart && end <= endCharCount) {
        range.setEnd(textNode, end - charCount);
        break;
      }
      charCount = endCharCount;
    }

    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
} else if (document.selection && document.body.createTextRange) {
    var textRange = document.body.createTextRange();
    textRange.moveToElementText(el);
    textRange.collapse(true);
    textRange.moveEnd("character", end);
    textRange.moveStart("character", start);
    textRange.select();
  }
}

function setSelectionRange(el, textNode, start, end) {
  if (document.createRange && window.getSelection) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var foundStart = false;
    var charCount = 0, endCharCount;

    endCharCount = charCount + textNode.length;
    if (!foundStart && start >= charCount
      && (start < endCharCount ||
      (start == endCharCount && i < textNodes.length))) {
      range.setStart(textNode, start - charCount);
      foundStart = true;
    }
    if (foundStart && end <= endCharCount) {
      range.setEnd(textNode, end - charCount);
    }
    charCount = endCharCount;

    return range;
  } else if (document.selection && document.body.createTextRange) {
    var textRange = document.body.createTextRange();
    textRange.moveToElementText(el);
    textRange.collapse(true);
    textRange.moveEnd("character", end);
    textRange.moveStart("character", start);
    textRange.select();
  }
}

function getTextNodeHeight(textNode) {
    var selHeight = 0;
    if (document.selection && document.selection.type == "Text") {
        var textRange = document.selection.createRange();
        selHeight = textRange.boundingHeight;
    } else if (document.createRange && window.getSelection) {
      var range = document.createRange();
      range.selectNode(textNode);
      var rectList = range.getClientRects();
      if (rectList.length > 0) {
        var rectTop = rectList[0].top;
        var rectBottom = 0;
        for (var i = 0; i < rectList.length; i++) {
          rectBottom = rectList[i].bottom;
        }
        selHeight = rectBottom - rectTop;
      }
    }
    return selHeight;
}

function getTextNodeOffsetTop(textNode) {
    var scrollOffset = painter.style.getViewportPageOffset(document);

    var selHeight = 0;
    if (document.selection && document.selection.type == "Text") {
        var textRange = document.selection.createRange();
        selHeight = textRange.boundingHeight;
    } else if (document.createRange && window.getSelection) {
      var range = document.createRange();
      range.selectNode(textNode);
      var rectList = range.getClientRects();
      if (rectList.length > 0) {
        return Math.round(rectList[0].top + scrollOffset.y);
      }
    }
    return selHeight;
}

function getTextNodeOffsetLeft(textNode) {
    var scrollOffset = painter.style.getViewportPageOffset(document);

    var selHeight = 0;
    if (document.selection && document.selection.type == "Text") {
        var textRange = document.selection.createRange();
        selHeight = textRange.boundingHeight;
    } else if (document.createRange && window.getSelection) {
      var range = document.createRange();
      range.selectNode(textNode);
      var rectList = range.getClientRects();
      if (rectList.length > 0) {
        return Math.round(rectList[0].left + scrollOffset.x);
      }
    }
    return selHeight;
}


/**
 * Class for representing a box. A box is specified as a top, right, bottom,
 * and left. A box is useful for representing margins and padding.
 *
 * @param {number} top Top.
 * @param {number} right Right.
 * @param {number} bottom Bottom.
 * @param {number} left Left.
 * @constructor
 */
painter.Box = function(dimensions) {

  this.dimensions = dimensions;

  //this.type = element.tagName;
  
  this.style = {};
  
  this.parent;
  
  this.children = {};

  this.renderIndex = 0;
  
  this.renderQueue = -1;
};

painter.Box.parseStyle = function(element) {
  var style3 = painter.style.getStyleObject(element);
  if (!style3) {
    return false;
  }

  var offset = painter.style.getPageOffset(element);
  offset.x = Math.round(offset.x);
  offset.y = Math.round(offset.y);
  
  var style2 = $.extend({}, style3, {
    rect: new math.Rect(offset.x, offset.y, $(element).outerWidth(), $(element).outerHeight()),
    border: {
      top: parseInt(style3.borderTopWidth, 10),
      right: parseInt(style3.borderRightWidth, 10),
      bottom: parseInt(style3.borderBottomWidth, 10),
      left: parseInt(style3.borderLeftWidth, 10),
    },
    padding: {
      top: parseInt(style3.paddingTop, 10),
      right: parseInt(style3.paddingRight, 10),
      bottom: parseInt(style3.paddingBottom, 10),
      left: parseInt(style3.paddingLeft, 10)
    },
    borderRadius: {
      topLeft: parseInt(style3.borderTopLeftRadius, 10),
      topRight: parseInt(style3.borderTopRightRadius, 10),
      bottomLeft: parseInt(style3.borderBottomLeftRadius, 10),
      bottomRight: parseInt(style3.borderBottomRightRadius, 10)
    },
    hasBorder: false,
    hasBorderRadius: false,
    visibleBox: false,
    tagName: element.tagName,
    shadow: null,
    textAlign: style3.textAlign.replace('-webkit-auto', 'left'),
    text: [],
    textIndent: parseInt(style3.textIndent, 10)
  });
  
  if (element.tagName == 'SELECT' || element.tagName == 'OPTION') {
    //console.log(element.options);
  } else if (element.tagName == 'INPUT' && (element.type == 'text' || element.type == 'submit')) {
        var t = element.value;
        if (style3.textTransform == 'uppercase') {
          t = t.toUpperCase();
        } else if (style3.textTransform == 'lowercase') {
          t = t.toLowerCase();
        } else if (style3.textTransform == 'capitalize') {
          t = t.capitalize();
        }
        var textOffset = {
          x: 0,
          y: 0
        };
        textOffset.x = getTextNodeOffsetLeft(element) - (offset.x + style2.padding.left);
        textOffset.y = getTextNodeOffsetTop(element) - (offset.y + style2.padding.top);
        style2.text.push({
          text: t,
          offset: {
            left: textOffset.x,
            top: textOffset.y
          }
        });
    /*style2.text = element.value;
    if (style3.textTransform == 'uppercase') {
      style2.text.push(style2.text.toUpperCase());
      //console.log(style3);
    }*/
  } else {

    for (var i = 0, j = element.childNodes.length; i < j; i++) {
      if (element.childNodes[i].nodeType == 3 && !is_all_ws(element.childNodes[i])) {
        var t = data_of(element.childNodes[i]);
        if (style3.textTransform == 'uppercase') {
          t = t.toUpperCase();
        } else if (style3.textTransform == 'lowercase') {
          t = t.toLowerCase();
        } else if (style3.textTransform == 'capitalize') {
          t = t.capitalize();
        }
        var textOffset = {
          x: 0,
          y: 0
        };
        if (element.childNodes[i].previousSibling && element.childNodes[i].previousSibling.nodeName == 'BR') {
          if (t.charAt(0) == ' ') {
            t = t.substring(1, t.length);
          }
        }
        textOffset.x = getTextNodeOffsetLeft(element.childNodes[i]) - (offset.x + style2.padding.left);
        textOffset.y = getTextNodeOffsetTop(element.childNodes[i]) - (offset.y + style2.padding.top);
        style2.text.push({
          text: t,
          offset: {
            left: textOffset.x,
            top: textOffset.y
          }
        });
      }
    }
  }
  
  if (style3.boxShadow != 'none') {
    var shadow = style3.boxShadow;
    shadow = shadow.replace(/,\s+/g, ',_');
    var parts = shadow.split(' ');
    style2.shadow = {
      color: parts[0].replace(/_/g, ' '),
      x: parseFloat(parts[1], 10),
      y: parseFloat(parts[2], 10),
      blur: parseFloat(parts[3], 10)
    };
  }
  
  if (style2.tagName == 'IMG') {
    style2.src = element.src;
  }
  
  var visibleBox = painter.style.getVisibleRectForElement(element);

  if (visibleBox) {
    style2.visibleBox = math.Rect.createFromBox(visibleBox);
  }
  
  style2.backgroundColor = painter.style.normalizeColour(style2.backgroundColor);
  
  var sides = ['top', 'right', 'bottom', 'left'];
  
  for (var i = 0, j = sides.length; i < j; i++) {
    if (style2.border[sides[i]] > 0) {
      var v = 'border' + sides[i].capitalize() + 'Color';
      style2[v] = painter.style.normalizeColour(style2[v]);
      style2.hasBorder = true;
    }
  }
  
  style2.hasBorderRadius = (style2.borderRadius.topLeft > 0 || style2.borderRadius.topRight > 0 || style2.borderRadius.bottomLeft > 0 || style2.borderRadius.bottomRight > 0);
  
  style2.hasBackgroundColor = (style2.backgroundColor != 'transparent');
  
  return style2;
};

painter.Box.prototype.setStyle = function(style) {
  this.style = style;
};

painter.Box.prototype.render = function() {
  if (!this.style) {
    if (this.parent) {
      this.parent.renderNext();
    }
    return;
  }
  var ctx = document.getElementById('thecanvas').getContext("2d");

  ctx.globalAlpha = this.style.opacity;
  if (this.style.visibility == 'visible' && this.style.display != 'none') {

    if (this.style.rect.width > 0 && this.style.rect.height > 0 && this.style.visibleBox) {
      ctx.save();
      
      if (this.style.shadow !== null) {
        ctx.shadowOffsetX = this.style.shadow.x;
        ctx.shadowOffsetY = this.style.shadow.y;
        ctx.shadowColor = this.style.shadow.color;
        ctx.shadowBlur = this.style.shadow.blur;
      }

      if (this.style.hasBorderRadius) {       
        var rectWidth = this.style.rect.width;
        var rectHeight = this.style.rect.height;
        
        var rectX = this.style.rect.left;
        var rectY = this.style.rect.top;
        ctx.beginPath();    
        
        ctx.moveTo(rectX + this.style.borderRadius.topLeft, rectY);
        ctx.lineTo(rectX + rectWidth - this.style.borderRadius.topRight, rectY);
        ctx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + this.style.borderRadius.topRight);
        ctx.lineTo(rectX + rectWidth, rectY + rectHeight - this.style.borderRadius.bottomRight);
        ctx.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - this.style.borderRadius.bottomRight, rectY + rectHeight);
        ctx.lineTo(rectX + this.style.borderRadius.bottomLeft, rectY + rectHeight);
        ctx.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - this.style.borderRadius.bottomLeft);
        ctx.lineTo(rectX, rectY + this.style.borderRadius.topLeft);
        ctx.quadraticCurveTo(rectX, rectY, rectX + this.style.borderRadius.topLeft, rectY);
        ctx.closePath();
        if (this.style.shadow != null) {
       //var d = ctx.getImageData(rectX, rectY, rectWidth, rectHeight);  
       //ctx.save();
          ctx.fillStyle = '#ff0000';  
          ctx.fill();
          //ctx.restore();
         //ctx.putImageData(d, rectX, rectY);  
        }
        // Clip to the current path
        ctx.clip();
      }

      if (this.style.hasBackgroundColor) {
        this.drawRect(this.style.rect.left, this.style.rect.top, this.style.rect.width, this.style.rect.height, this.style.backgroundColor);
      } else if (this.style.shadow) {
      var data = ctx.getImageData(this.style.rect.left, this.style.rect.top, this.style.rect.width, this.style.rect.height);
        this.drawRect(this.style.rect.left, this.style.rect.top, this.style.rect.width, this.style.rect.height, 'rgb(0, 0, 0)');
        ctx.putImageData(data, this.style.rect.left, this.style.rect.top);
        data = null;
      }
      
      ctx.restore();

      this.drawBackground();
    } else {
      this.renderQueue = -1;
      this.renderNext();
    }
  } else {
    if (this.parent) {
      this.parent.renderNext();
    }
  }
};

painter.Box.prototype.getNextRenderIndex = function() {
  var keys = Object.keys(this.children);
  for (var i=0; i<keys.length; i++) {
      var key = keys[i];
      if (this.renderIndex < key) {
        this.renderIndex = key;
        return true;
      }
  }
  return false;
}

painter.Box.prototype.renderNext = function() {
  this.renderQueue += 1;
  if (!this.children[this.renderIndex] || this.renderQueue >= this.children[this.renderIndex].length) {
    this.renderQueue = -1;
    if (this.getNextRenderIndex()) {
      this.renderNext();
    }
    else {
      if (this.parent) {
        this.parent.renderNext();
      } else {
        postRender();
      }
    }
  } else {
    this.children[this.renderIndex][this.renderQueue].render();
  }
};

painter.Box.prototype.cropImage = function(ctx, params) {
    var rect = params.options.rect;

    var width = rect.width;
    var height = rect.height;
    var top = rect.top;
    var left = rect.left;

    if (typeof params.options.left != "undefined")
      left = parseInt(params.options.left,10);
    if (typeof params.options.top != "undefined")
      top = parseInt(params.options.top,10);
    if (typeof params.options.height != "undefined")
      width = parseInt(params.options.width,10);
    if (typeof params.options.height != "undefined")
      height = parseInt(params.options.height,10);

    if (left < 0) left = 0;
    if (left > params.width-1) left = params.width-1;

    if (top < 0) top = 0;
    if (top > params.height-1) top = params.height-1;

    if (width < 1) width = 1;
    if (left + width > params.width)
      width = params.width - left;

    if (height < 1) height = 1;
    if (top + height > params.height)
      height = params.height - top;

    var copy = document.createElement("canvas");
    copy.width = params.width;
    copy.height = params.height;
    copy.getContext("2d").drawImage(params.canvas,0,0);

    params.canvas.width = width;
    params.canvas.height = height;
    params.canvas.getContext("2d").clearRect(0,0,width,height);

    params.canvas.getContext("2d").drawImage(copy,
      left,top,width,height,
      0,0,width,height
    );

    params.useData = false;
    return true;
};

painter.Box.prototype.drawChildren = function() {    
  if (this.style.tagName == 'IMG') {
    var that = this; 
    var rect = this.style.rect.clone();
    rect.left += this.style.border.left + this.style.padding.left;
    rect.top += this.style.border.top + this.style.padding.top;
    rect.width -= this.style.border.left + this.style.border.right + this.style.padding.left + this.style.padding.right;
    rect.height -= this.style.border.top + this.style.border.bottom + this.style.padding.top + this.style.padding.bottom;
    var img = new Image();
    img.onerror = function() {
      that.continueDrawing();
    };
    img.onload = function(){
      var ctx = document.getElementById('thecanvas').getContext("2d");
      var s = that.style;
      var x = s.rect.left + s.border.left + s.padding.left,
          y = s.rect.top + s.border.top + s.padding.top,
          w = parseInt(that.style.width) - s.border.left - s.border.right - s.padding.left - s.padding.right,
          h = parseInt(that.style.height) - s.border.top - s.border.bottom - s.padding.top - s.padding.bottom,
          vW = s.visibleBox.width == Infinity ? w : (s.visibleBox.width - s.border.left - s.border.right - s.padding.left - s.padding.right || w),
          vH = s.visibleBox.height == Infinity ? h : (s.visibleBox.height - s.border.top - s.border.bottom - s.padding.top - s.padding.bottom || h);

      var copy = document.createElement("canvas");
      document.body.appendChild(copy);
      copy.width = w;
      copy.height = h;
      copy.getContext("2d").drawImage(this, 0, 0, w, h);

      var croppedData = copy.getContext("2d").getImageData(0, 0, vW, vH);
      ctx.putImageData(croppedData, x, y);
      document.body.removeChild(copy);
      copy = null;

      //ctx.drawImage(this, 0, 0, w, h, x, y, vW, vH);
      w = vW;
      h = vH;
      if (that.style.WebkitFilter) {

        var mod = that.style.WebkitFilter.match(/grayscale\((-?\d*(\.\d+)?)\)/);

        if (mod != null) {
          // We found grayscale filter!
          var originalData = ctx.getImageData(x, y, w, h);
          var imageData = ctx.getImageData(x, y, w, h);
          var data = originalData.data;
          var data2 = imageData.data;
          var amount = parseFloat(mod[1], 10);

          for(var i = 0; i < data.length; i += 4) {
            var brightness = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
            // red
            data[i] = brightness;
            // green
            data[i + 1] = brightness;
            // blue
            data[i + 2] = brightness;
          }
          if (amount != 1) {
            var p = w*h;
            var amount2 = 1 - amount;
            var amount1 = amount;
            while (p--) {
              var pix = p*4;
              var r = (data[pix] * amount1 + data2[pix] * amount2)>>0;
              var g = (data[pix+1] * amount1 + data2[pix+1] * amount2)>>0;
              var b = (data[pix+2] * amount1 + data2[pix+2] * amount2)>>0;

              data[pix] = r;
              data[pix+1] = g;
              data[pix+2] = b;
            }
            ctx.globalAlpha = amount;
          }

          ctx.putImageData(originalData, x, y);
        }
      }
      that.continueDrawing();
    };
    img.src = this.style.src;
  } else {     
    this.continueDrawing();
  }
};

painter.Box.prototype.continueDrawing = function() {
  this.drawBorders(); 
  if (this.style.hasBorderRadius) {
    var ctx = document.getElementById('thecanvas').getContext("2d");
    ctx.restore();
  }
  if (this.style.text.length > 0) {
    this.drawText();
  }
  this.renderQueue = -1;
  this.renderNext();
};

painter.Box.prototype.drawText = function() {
  if (this.style.visibility != 'visible' || this.style.display == 'none') {
    return false;
  }
  var ctx = document.getElementById('thecanvas').getContext("2d");  
  var rect = this.style.rect.clone();
  rect.left += this.style.border.left + this.style.padding.left;
  rect.top += this.style.border.top + this.style.padding.top;
  rect.width -= this.style.border.left + this.style.border.right + this.style.padding.left + this.style.padding.right;
  rect.height -= this.style.border.top + this.style.border.bottom + this.style.padding.top + this.style.padding.bottom;
  if (this.style.visibleBox) {
    if (!rect.intersection(this.style.visibleBox)) {
      return false;
    }
  } else {
    return false;
  }
  
  if (rect.width <= 0 || rect.height <= 0) {
    return false;
  }
  
  ctx.save();
  
  ctx.fillStyle = this.style.color;
  ctx.font = this.style.fontWeight + " " + this.style.fontSize + "/" + this.style.lineHeight + " " + this.style.fontFamily;
  //ctx.textAlign = this.style.textAlign;
  ctx.textBaseline = 'top';
  
  /*if (ctx.textAlign == 'center') {
    rect.left += rect.width / 2;
  } else if (ctx.textAlign == 'right') {
    rect.left += rect.width;
  }*/

  if (this.style.textShadow != 'none') {
    /*console.log(this.style.rect);
    console.log(rect);
    console.log('----');*/
    var shadow = this.style.textShadow;
    shadow = shadow.replace(/,\s+/g, ',_');
    var parts = shadow.split(' ');
    ctx.shadowOffsetX = parseFloat(parts[1], 10);
    ctx.shadowOffsetY = parseFloat(parts[2], 10);
    ctx.shadowColor = parts[0].replace(/_/g, ' ');
    ctx.shadowBlur = parseFloat(parts[3], 10);
  }
  
  var lh = parseFloat(this.style.lineHeight, 10);
  //rect.top += Math.floor(lh  / 2);
  
//console.log(this.style.text);

  for (var i = 0, j = this.style.text.length; i < j; i++) {
    //console.log(this.style.text[i].offset);
    var rct = rect.clone();
    rct.width = parseInt(this.style.width, 10);

    if (rct.width > rect.width) {
      console.log(rect.width);
      var widthDiff = rct.width - rect.width;
      console.log(widthDiff);
      var textHeight = wrappedTextHeight(ctx, this.style.text[i].text, rct.left, rct.top, rct.width, lh, this.style.textIndent, this.style.text[i].offset);
      console.log(textHeight);
      var slice = ctx.getImageData(rct.left + widthDiff, rct.top, widthDiff, textHeight);
      wrapText(ctx, this.style.text[i].text, rct.left, rct.top, rct.width, lh, this.style.textIndent, this.style.text[i].offset);
      ctx.putImageData(slice, rct.left + widthDiff, rct.top);
    } else {
      wrapText(ctx, this.style.text[i].text, rct.left, rct.top, rct.width, lh, this.style.textIndent, this.style.text[i].offset);
    }

    //wrapText(ctx, this.style.text[i].text, rct.left, rct.top, rct.width, parseFloat(this.style.lineHeight, 10), this.style.textIndent);
  }
    
  ctx.restore();
};

painter.Box.prototype.setParent = function(parent) {    
  if (!(parent instanceof painter.Box)) {
    return false;
  }
  this.parent = parent;
};

painter.Box.prototype.drawRect = function(x, y, width, height, color, shiftX, shiftY) {  
  var ctx = document.getElementById('thecanvas').getContext("2d");
  shiftX = shiftX || 0;
  shiftY = shiftY || 0;
    
  var rect = new painter.Rect(shiftX+x, shiftY + y, width, height);
  var old = rect.clone();
  if (this.style.visibleBox) {
    if (!rect.intersection(this.style.visibleBox)) {
      return false;
    }
  }
  
  if (rect.width <= 0 || rect.height <= 0) {
    return false;
  }
  
  var slices = [], diffs = [];  
  if (ctx.shadowBlur > 0) {
    diffs = old.difference(rect);
    if (diffs.length > 0) {
      for (var i = 0, j = diffs.length; i < j; i++) {
        slices.push(ctx.getImageData(diffs[i].left, diffs[i].top, diffs[i].width, diffs[i].height));
      }
    }
  }
  
  ctx.translate(shiftX, shiftY);
  rect.shift(shiftX*-1, shiftY*-1).fill(ctx, color);
  ctx.translate(shiftX*-1, shiftY*-1);
  
  if (slices.length > 0) {
    for (var i = 0, j = slices.length; i < j; i++) {
      ctx.putImageData(slices[i], diffs[i].left, diffs[i].top);
    }
    slices = diffs = null;
  }
};

function isEven(n) 
{
   return isNumber(n) && (n % 2 == 0);
}

function isNumber(n)
{
   return n == parseFloat(n);
}

painter.Box.prototype.drawBorders = function() {
  if (!this.style.hasBorder) {
    return false;
  }

  var borderColour;
  var blackColour = Color("#000000");

  // blending values taken from http://stackoverflow.com/questions/4147940/how-do-browsers-determine-which-exact-colors-to-use-for-border-inset-or-outset
  
  if (this.style.border.left > 0 && this.style.borderLeftColor != 'transparent') {
    borderColour = Color(this.style.borderLeftColor);
    
    var borderRect;
    var rectWidth = this.style.border.left;

    if (this.style.borderLeftStyle == 'inset') {
      borderColour = borderColour.blend(blackColour, 0.33);
    }
    else if (this.style.borderLeftStyle == 'double') {
      var middleBit = Math.ceil(this.style.border.left / 3);
      var borderWidth = this.style.border.left - middleBit;
      if (!isEven(borderWidth)) {
        borderWidth += 1;
        middleBit -= 1;
      }
      var lineWidth = borderWidth / 2;
      if (lineWidth >= 1) {
        rectWidth -= (lineWidth + middleBit);
        var rectHeight = this.style.rect.height - ((lineWidth + middleBit) * 2);
        this.drawRect(this.style.rect.left + lineWidth + middleBit, this.style.rect.top + lineWidth + middleBit, rectWidth, rectHeight, borderColour.toCSS());
      }
      console.log("DOUBLE: " + borderWidth);
      //borderRect = new painter.Rect(this.style.rect.left, this.style.rect.top, rectWidth, this.style.rect.height);
    }
    if (!borderRect) {
      borderRect = new painter.Rect(this.style.rect.left, this.style.rect.top, rectWidth, this.style.rect.height);
    }
    this.drawRect(borderRect.left, borderRect.top, borderRect.width, borderRect.height, borderColour.toCSS());
  }

  if (this.style.border.right > 0 && this.style.borderRightColor != 'transparent') {
    borderColour = Color(this.style.borderRightColor);
    
    var borderRect;
    var rectWidth = this.style.border.right;

    if (this.style.borderRightStyle == 'outset') {
      borderColour = borderColour.blend(blackColour, 0.33);
    }
    else if (this.style.borderRightStyle == 'double') {
      var middleBit = Math.ceil(rectWidth / 3);
      var borderWidth = rectWidth - middleBit;
      if (!isEven(borderWidth)) {
        borderWidth += 1;
        middleBit -= 1;
      }
      var lineWidth = borderWidth / 2;
      if (lineWidth >= 1) {
        rectWidth -= (lineWidth + middleBit);
        var rectHeight = this.style.rect.height - ((lineWidth + middleBit) * 2);
        this.drawRect((this.style.rect.left + this.style.rect.width) - this.style.border.right, this.style.rect.top + lineWidth + middleBit, rectWidth, rectHeight, borderColour.toCSS());
      }
      borderRect = new painter.Rect((this.style.rect.left + this.style.rect.width) - (this.style.border.right - (lineWidth + middleBit)), this.style.rect.top, rectWidth, this.style.rect.height);
    }
    if (!borderRect) {
      borderRect = new painter.Rect((this.style.rect.left + this.style.rect.width) - this.style.border.right, this.style.rect.top, rectWidth, this.style.rect.height);
    }
    this.drawRect(borderRect.left, borderRect.top, borderRect.width, borderRect.height, borderColour.toCSS());
  }

  if (this.style.border.top > 0 && this.style.borderTopColor != 'transparent') {
    borderColour = Color(this.style.borderTopColor);
    
    var borderRect = null;
    var rectHeight = this.style.border.top;

    if (this.style.borderTopStyle == 'inset') {
      borderColour = borderColour.blend(blackColour, 0.33);
    }
    else if (this.style.borderTopStyle == 'double') {
      var middleBit = Math.ceil(this.style.border.top / 3);
      var borderWidth = this.style.border.top - middleBit;
      if (!isEven(borderWidth)) {
        borderWidth += 1;
        middleBit -= 1;
      }
      var lineWidth = borderWidth / 2;
      if (lineWidth >= 1) {
        rectHeight -= (lineWidth + middleBit);
        var rectWidth = this.style.rect.width - ((lineWidth + middleBit) * 2);
        this.drawRect(this.style.rect.left + lineWidth + middleBit, this.style.rect.top + lineWidth + middleBit, rectWidth, rectHeight, borderColour.toCSS());
      }
      //borderRect = new painter.Rect(this.style.rect.left, this.style.rect.top, rectWidth, this.style.rect.height);
    }
    if (!borderRect) {
      borderRect = new painter.Rect(this.style.rect.left, this.style.rect.top, this.style.rect.width, rectHeight);
    }
    this.drawRect(borderRect.left, borderRect.top, borderRect.width, borderRect.height, borderColour.toCSS());
  }

  if (this.style.border.bottom > 0 && this.style.borderBottomColor != 'transparent') {
    borderColour = Color(this.style.borderBottomColor);
    
    var borderRect = null;
    var rectHeight = this.style.border.bottom;

    if (this.style.borderBottomStyle == 'outset') {
      borderColour = borderColour.blend(blackColour, 0.33);
    }
    else if (this.style.borderBottomStyle == 'double') {
      var middleBit = Math.ceil(this.style.border.bottom / 3);
      var borderWidth = this.style.border.bottom - middleBit;
      if (!isEven(borderWidth)) {
        borderWidth += 1;
        middleBit -= 1;
      }
      var lineWidth = borderWidth / 2;
      if (lineWidth >= 1) {
        rectHeight -= (lineWidth + middleBit);
        var rectWidth = this.style.rect.width - ((lineWidth + middleBit) * 2);
        this.drawRect(this.style.rect.left + lineWidth + middleBit, (this.style.rect.top + this.style.rect.height) - this.style.border.bottom, rectWidth, rectHeight, borderColour.toCSS());
      }
      borderRect = new painter.Rect(this.style.rect.left, (this.style.rect.top + this.style.rect.height) - (this.style.border.bottom - (lineWidth + middleBit)), this.style.rect.width, rectHeight);
    }
    if (!borderRect) {
      borderRect = new painter.Rect(this.style.rect.left, (this.style.rect.top + this.style.rect.height) - this.style.border.bottom, this.style.rect.width, this.style.border.bottom);
    }
    this.drawRect(borderRect.left, borderRect.top, borderRect.width, borderRect.height, borderColour.toCSS());
  }
};

painter.Box.prototype.drawBackground = function() {
  if (!this.style.backgroundImage || this.style.backgroundImage == 'none') {
    this.drawChildren();
    return false;
  }

  var ctx = document.getElementById('thecanvas').getContext("2d");
  
  var imgSrc = this.style.backgroundImage.replace(/url\("?([^\^")]+)"?\)/, '$1'); 
  var imgOffset = { left: this.style.rect.left, top: this.style.rect.top };
  
  var bgPos = this.style.backgroundPosition.split(' ');
  
  var bgRepeat = false;
  var bgSize = this.style.backgroundSize;
  
  if (this.style.backgroundRepeat != 'no-repeat') {
    bgRepeat = {
      x: (this.style.backgroundRepeat == 'repeat' || this.style.backgroundRepeat == 'repeat-x'),
      y: (this.style.backgroundRepeat == 'repeat' || this.style.backgroundRepeat == 'repeat-y')
    };
  }
  
  if (this.style.backgroundImage.indexOf('-webkit-gradient') != -1) {
    var lingrad = ctx.createLinearGradient(0, 0, 0, this.style.rect.height);
    var from = this.style.backgroundImage.replace(/(.*)from\(([^\)]+)\)(.*)/, '$2');
    if (from.indexOf('(') != -1) {
      from += ')';
    }
    var to = this.style.backgroundImage.replace(/(.*)to\(([^\)]+)\)(.*)/, '$2');
    if (to.indexOf('(') != -1) {
      to += ')';
    }
    lingrad.addColorStop(0, to);
    lingrad.addColorStop(1, from);
    this.drawRect(0, 0, this.style.rect.width, this.style.rect.height, lingrad, this.style.rect.left, this.style.rect.top);
    
    this.drawChildren();
  } else { 
    var elemWidth = this.style.rect.width;
    var elemHeight = this.style.rect.height;   
    var that = this; 
    var img = new Image();
    img.onerror = function() {
      that.drawChildren();
    };
    img.onload = function(){
      var imgWidth = this.width;
      var imgHeight = this.height;
      var patternX = 0;
      var patternY = 0;
      var patternWidth = elemWidth;
      var patternHeight = elemHeight;
      
      var shiftX = that.style.border.left,
          shiftY = that.style.border.top;
      
      if (bgPos[0].indexOf('%') != -1) {
        var mod = parseFloat(bgPos[0], 10)/100;
        shiftX += ((elemWidth - imgWidth) * mod) - ((that.style.border.left + that.style.border.right)*mod);
      } else {
        shiftX += parseInt(bgPos[0], 10);
      }
      
      if (bgPos[1].indexOf('%') != -1) {
        var mod = parseFloat(bgPos[1], 10)/100;
        shiftY += ((elemHeight - imgHeight) * mod) - ((that.style.border.bottom + that.style.border.top)*mod);
      } else {
        shiftY += parseInt(bgPos[1], 10);
      }
      
      imgOffset.left += shiftX;
      imgOffset.top += shiftY;
      patternX = shiftX * -1;
      patternY = shiftY * -1;
      
      if (!bgRepeat.x) {
        if (shiftX >= 0) {
          patternX = 0;
          patternWidth -= Math.abs(shiftX);
          if (imgWidth < (elemWidth - shiftX)) {
            patternWidth = imgWidth;
          }
        } else {
          patternWidth = imgWidth + shiftX;
        }
      }
      
      if (!bgRepeat.y) {
        if (shiftY >= 0) {
          patternY = 0;
          patternHeight -= Math.abs(shiftY);
          if (imgHeight < (elemHeight - shiftY)) {
            patternHeight = imgHeight;
          }
        } else {
          patternHeight = imgHeight + shiftY;
        }
      }

      patternWidth = Math.min(elemWidth, patternWidth);
      patternHeight = Math.min(elemHeight, patternHeight);

      /* Formulas taken from http://blog.vjeux.com/2013/image/css-container-and-cover.html */
      if (bgSize == 'cover') {
        var imgRatio = imgWidth / imgHeight;
        var elemRatio = elemWidth / elemHeight;
        if (imgRatio < elemRatio) {
          patternWidth = elemWidth;
          patternHeight = elemWidth / imgRatio; 
        } else {
          patternWidth = elemHeight * imgRatio;
          patternHeight = elemHeight;          
        }
      } else if (bgSize == 'contain') {
        var imgRatio = imgWidth / imgHeight;
        var elemRatio = elemWidth / elemHeight;
        if (imgRatio < elemRatio) {
          patternWidth = elemHeight * imgRatio;
          patternHeight = elemHeight; 
        } else {    
          patternWidth = elemWidth;
          patternHeight = elemWidth / imgRatio;      
        }
      }

      patternWidth = Math.floor(patternWidth);
      patternHeight = Math.floor(patternHeight);

      var tmpCanvas = document.createElement("canvas");
      tmpCanvas.width = patternWidth;
      tmpCanvas.height = patternHeight;
      var patternCtx = tmpCanvas.getContext('2d');
      patternCtx.drawImage(this, 0, 0, patternWidth, patternHeight);

      var pattern = ctx.createPattern(tmpCanvas, 'repeat');

      that.drawRect(Math.floor(patternX), Math.floor(patternY), patternWidth, patternHeight, pattern, Math.ceil(imgOffset.left), Math.ceil(imgOffset.top));
      
      that.drawChildren();
    };
    img.src = imgSrc;
  }
};

painter.Box.prototype.addChild = function(child) {
  if (!child || !(child instanceof painter.Box)) {
    return;
  }
  
  child.setParent(this);
  
  var zIndex = child.style.zIndex;
  zIndex = zIndex.replace('auto', child.style.position == 'absolute' ? 1 : 0);

  if (!this.children[zIndex]) {
    this.children[zIndex] = [];
  }

  this.children[zIndex].push(child);
};

function uniqueid(){
    // always start with a letter (for DOM friendlyness)
    var idstr=String.fromCharCode(Math.floor((Math.random()*25)+65));
    do {                
        // between numbers and characters (48 is 0 and 90 is Z (42-48 = 90)
        var ascicode=Math.floor((Math.random()*42)+48);
        if (ascicode<58 || ascicode>64){
            // exclude all chars between : (58) and @ (64)
            idstr+=String.fromCharCode(ascicode);    
        }                
    } while (idstr.length<32);

    return (idstr);
}

var boxRefs = {

};

painter.Box.fromDom = function(element) {
  if (!element.tagName || element.tagName == 'SCRIPT' || element.tagName == 'STYLE' || element.tagName == 'LINK' || element.tagName == 'CANVAS' || is_all_ws(element) || element.nodeType == 3) {
    return null;
  }

  var box_ = new painter.Box({});
  box_.setStyle(painter.Box.parseStyle(element));
  var veryUniqueId = uniqueid();
  element.setAttribute('veryUniqueId', veryUniqueId);
  boxRefs[veryUniqueId] = box_;
  var offsetParent = painter.style.getOffsetParent(element);
  if (offsetParent && offsetParent.nodeName != 'HTML') {
    boxRefs[offsetParent.getAttribute('veryUniqueId')].addChild(box_);
  }

  /*if (element.className == 'social') {
    console.log(painter.style.getOffsetParent(element));
    console.log(painter.style.getOffsetParent(painter.style.getOffsetParent(element)));
    console.log(element);
  }*/

  for (var i = 0, l = element.childNodes.length; i < l; i++) {
    //box_.addChild(painter.Box.fromDom(element.childNodes[i]));
    painter.Box.fromDom(element.childNodes[i]);
  }
  
  return box_;
};
  
function is_all_ws( nod )
{
  // Use ECMA-262 Edition 3 String and RegExp features
  return !(/[^\t\n\r ]/.test(nod.data));
}