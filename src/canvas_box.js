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

function getTextNodeWidth(textNode, style) {
    var selWidth = 0;
    if (document.selection && document.selection.type == "Text") {
        var textRange = document.selection.createRange();
        selWidth = textRange.boundingWidth;
    } else if (document.createRange && window.getSelection) {
      var range = document.createRange();
      range.selectNode(textNode);
      var rectList = range.getClientRects();
      if (rectList.length > 0) {
        var rectLeft = getTextNodeOffsetLeft(textNode, style).left;
        var rectRight = 0;
        for (var i = 0; i < rectList.length; i++) {
          rectRight = Math.max(rectRight, rectList[i].right);
        }
        selWidth = rectRight - rectLeft;
      }
    }
    return selWidth;
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
          rectBottom = Math.max(rectBottom, rectList[i].bottom);
        }
        selHeight = rectBottom - rectTop;
      }
    }
    return selHeight;
}

function getTextNodeOffsetTop(textNode, style) {
    var scrollOffset = painter.style.getViewportPageOffset(document);

    var selHeight = 0;
    if (document.selection && document.selection.type == "Text") {
        var textRange = document.selection.createRange();
        selHeight = textRange.boundingHeight;
    } else if (document.createRange && window.getSelection) {
      var range = document.createRange();
      range.selectNode(textNode);
      var rectList = range.getClientRects();
      var topMod = 0;
      if (textNode.nodeType != 3 && textNode.tagName == 'INPUT') {
        topMod = style.border.top;
      }
      if (rectList.length > 0) {
        return Math.round((rectList[0].top + topMod) + scrollOffset.y);
      }
    }
    return selHeight;
}

function getTextNodeOffsetLeft(textNode, style) {
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
        var rectLeft = rectList[0].left - scrollOffset.x;
        var leftMod = 0;
        if (textNode.nodeType != 3 && textNode.tagName == 'INPUT') {
          leftMod = style.border.left;
        }
        rectLeft += leftMod;
        var finalRectLeft = rectLeft;
        for (var i = 0; i < rectList.length; i++) {
          finalRectLeft = Math.min(finalRectLeft, rectList[i].left - scrollOffset.x);
          finalRectLeft += leftMod;
        }
        return {
          left: finalRectLeft,
          indent: rectLeft - finalRectLeft
        };
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

  this.actualTextDecorations = [];
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
    var offsetLeft = getTextNodeOffsetLeft(element, style2);
    textOffset.x = offsetLeft.left - (offset.x + style2.padding.left);
    textOffset.y = getTextNodeOffsetTop(element, style2) - (offset.y + style2.padding.top);
    style2.text.push({
      text: t,
      offset: {
        left: textOffset.x,
        top: textOffset.y
      },
      indent: offsetLeft.indent,
      left: offsetLeft.left,
      top: getTextNodeOffsetTop(element, style2),
      width: getTextNodeWidth(element, style2),
      height: getTextNodeHeight(element)
    });
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
        var offsetLeft = getTextNodeOffsetLeft(element.childNodes[i], style2);
        textOffset.x = offsetLeft.left - (offset.x + style2.padding.left);
        textOffset.y = getTextNodeOffsetTop(element.childNodes[i]) - (offset.y + style2.padding.top);
        style2.text.push({
          text: t,
          offset: {
            left: textOffset.x,
            top: textOffset.y
          },
          indent: offsetLeft.indent,
          left: offsetLeft.left,
          top: getTextNodeOffsetTop(element.childNodes[i]),
          width: getTextNodeWidth(element.childNodes[i], style2),
          height: getTextNodeHeight(element.childNodes[i])
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
      /* This is neccessary for (semi)transparent images to be drawn on correct background */
      var imageRectBg = ctx.getImageData(x, y, w, h);
      copy.getContext("2d").putImageData(imageRectBg, 0, 0);

      copy.getContext("2d").drawImage(this, 0, 0, this.naturalWidth, this.naturalHeight, 0, 0, w, h);

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
  ctx.strokeStyle = this.style.color;
  ctx.font = this.style.fontWeight + " " + this.style.fontSize + "/" + this.style.lineHeight + " " + this.style.fontFamily;
  //ctx.textAlign = this.style.textAlign;
  ctx.textBaseline = 'top';
  
  /*if (ctx.textAlign == 'center') {
    rect.left += rect.width / 2;
  } else if (ctx.textAlign == 'right') {
    rect.left += rect.width;
  }*/

  if (this.style.textShadow != 'none') {
    var shadow = this.style.textShadow;
    shadow = shadow.replace(/,\s+/g, ',_');
    var parts = shadow.split(' ');
    ctx.shadowOffsetX = parseFloat(parts[1], 10);
    ctx.shadowOffsetY = parseFloat(parts[2], 10);
    ctx.shadowColor = parts[0].replace(/_/g, ' ');
    ctx.shadowBlur = parseFloat(parts[3], 10);
  }
  
  var lh = parseFloat(this.style.lineHeight, 10);
  
  //var fontArr = this.style.fontFamily.split(',');

  //load_sys(fontArr[0], this.style.fontSize);

  for (var i = 0, j = this.style.text.length; i < j; i++) {
    var rct = rect.clone();
    rct.width = this.style.text[i].width;
    rct.height = this.style.text[i].height;
    rct.left = this.style.text[i].left;
    rct.top = this.style.text[i].top;

    var differences = [];
    var slices = [];
    if (this.style.visibleBox) {
      differences = math.Rect.difference(rct, rect);
      for (var k = 0; k < differences.length; k++) {
        slices.push(ctx.getImageData(differences[k].left, differences[k].top, differences[k].width, differences[k].height));
      }
    }
    wrapText(ctx, this.style.text[i].text, rct.left, rct.top, rct.width, lh, this.style.text[i].indent, { left: 0, top: 0}, parseInt(this.style.fontSize, 10), this.actualTextDecorations);
    if (slices.length > 0) {
      for (var l = 0; l < differences.length; l++) {
        ctx.putImageData(slices[l], differences[l].left, differences[l].top);
      }
    }
  }
    
  ctx.restore();
};

painter.Box.prototype.setParent = function(parent) {    
  if (!(parent instanceof painter.Box)) {
    return false;
  }
  this.parent = parent;
};

painter.Box.prototype.drawRect = function(x, y, width, height, color, shiftX, shiftY, ctx) {  
  var ctx = ctx || document.getElementById('thecanvas').getContext("2d");
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

painter.Box.prototype.getBorderRect = function(borderSide) {
  var isHorizontal = (borderSide == 'left' || borderSide == 'right');
  var oppositeSide = isHorizontal ? (borderSide == 'left' ? 'right' : 'left') : (borderSide == 'top' ? 'bottom' : 'top');

  var borderRect = new math.Rect(
    this.style.rect.left + (oppositeSide == 'left' ? this.style.rect.width - this.style.border[borderSide] : 0),
    this.style.rect.top + (oppositeSide == 'top' ? this.style.rect.height - this.style.border[borderSide] : 0),
    isHorizontal ? this.style.border[borderSide] : this.style.rect.width,
    isHorizontal ? this.style.rect.height : this.style.border[borderSide]
  );

  return borderRect;
}

painter.Box.prototype.doDrawBorder = function(ctx, borderRect, borderSide, borderColor, isSecondary, compositeOperation) {
  var isHorizontal = (borderSide == 'left' || borderSide == 'right');
  var horizontalSides = ['left', 'right'];
  var verticalSides = ['top', 'bottom'];

  var sides = isHorizontal ? verticalSides : horizontalSides;

  this.drawRect(borderRect.left, borderRect.top, borderRect.width, borderRect.height, borderColor.toCSS(), 0, 0, ctx);

  for (var i = 0; i < sides.length; i++) {
    var side = sides[i];
    var otherBorder = this.getBorderRect(side);
    if (otherBorder.width > 0 && otherBorder.height > 0) {
      ctx.save();

      ctx.fillStyle = borderColor.toCSS();
      ctx.lineWidth = 0;

      var pathScale = 10;
      
      ctx.beginPath();

      var triHeight = isHorizontal ? otherBorder.height : otherBorder.width;
      var pathWidth = isHorizontal ? borderRect.width : borderRect.height; //this.style.border[borderSide];


      var translateX = isHorizontal ? (borderRect.width / 2) : (otherBorder.width / 2);
      var translateY = isHorizontal ? (otherBorder.height / 2) : (borderRect.height / 2);
      var rotation = 0;
      var initX = borderRect.left;
      var initY = borderRect.top;

      if (isHorizontal) {
          if (side == 'top') {
            initY -= otherBorder.height;
          } else if (side == 'bottom') {
            initY += borderRect.height;
          }
      } else {
          if (side == 'left') {
            initX -= otherBorder.width;
          } else if (side == 'right') {
            initX += borderRect.width;
          }
      }

      if (isHorizontal) {
        if (side == 'top') {
          rotation = 180;
        }
      } else {
        if (borderSide == 'bottom') {
          if (side == 'left') {
            rotation = 180;
          } else if (side == 'right') {
            rotation = 180;
          }
        }
      }
      translateX += initX;
      translateY += initY;
      ctx.translate(translateX, translateY); // now the position (0,0) is found at (250,50)
      ctx.rotate(((rotation) % 360) * Math.PI / 180); // rotate around the start point of your line
      ctx.translate(-translateX, -translateY);
      if (borderSide == 'left' && side == 'top') {
        ctx.translate(translateX, 0);
        ctx.scale(-1, 1);
        ctx.translate(-translateX, 0);
      } else if (borderSide == 'right' && side == 'bottom') {
        ctx.translate(translateX, 0);
        ctx.scale(-1, 1);
        ctx.translate(-translateX, 0);
      } else if (borderSide == 'top' && side == 'left') {
        ctx.translate(translateX, 0);
        ctx.scale(-1, 1);
        ctx.translate(-translateX, 0);
      } else if (borderSide == 'bottom' && side == 'right') {
        ctx.translate(translateX, 0);
        ctx.scale(-1, 1);
        ctx.translate(-translateX, 0);
      }

      if (isSecondary) {
          ctx.globalCompositeOperation = compositeOperation || 'source-atop';
      }

      ctx.moveTo(initX, initY);
      if (isHorizontal) {
        ctx.lineTo(initX, initY + triHeight);
        ctx.lineTo(initX + pathWidth, initY);
      } else {
        ctx.lineTo(initX + triHeight, initY);
        ctx.lineTo(initX, initY + pathWidth);
      }
      ctx.lineTo(initX, initY);
      ctx.fill();
      ctx.closePath();

      ctx.restore();
    }
  }
}

painter.Box.prototype.drawBorder = function(borderSide) {  
  var borderColor = this.style["border" + borderSide.capitalize() + "Color"];
  if (this.style.border[borderSide] > 0 && borderColor != 'transparent') {
    var ctx = document.getElementById('thecanvas').getContext("2d");

    var isHorizontal = (borderSide == 'left' || borderSide == 'right');
    var horizontalSides = ['left', 'right'];
    var verticalSides = ['top', 'bottom'];

    var sides = isHorizontal ? verticalSides : horizontalSides;

    var borderStyle = this.style["border" + borderSide.capitalize() + "Style"];

    var blackColour = Color("#000000");
    borderColor = Color(borderColor);
    
    var borderRect = this.getBorderRect(borderSide);
    var innerRect;
    var innerBorderColour;

    for (var i = 0; i < sides.length; i++) {
      borderRect = math.Rect.difference(borderRect, this.getBorderRect(sides[i]))[0];
    }

    if (borderStyle == 'inset') {
      if (borderSide == 'left' || borderSide == 'top') {
        borderColor = borderColor.blend(blackColour, 0.33);
      }
        this.doDrawBorder(ctx, borderRect, borderSide, borderColor);
    }
    else if (borderStyle == 'outset') {
      if (borderSide == 'right' || borderSide == 'bottom') {
        borderColor = borderColor.blend(blackColour, 0.33);
      }
      this.doDrawBorder(ctx, borderRect, borderSide, borderColor);
    }
    else if (borderStyle == 'double') {
      var middleBit = Math.ceil((isHorizontal ? borderRect.width : borderRect.height) / 3);
      var borderWidth = (isHorizontal ? borderRect.width : borderRect.height) - middleBit;
      if (!isEven(borderWidth)) {
        borderWidth += 1;
        middleBit -= 1;
      }
      var lineWidth = borderWidth / 2;
      if (lineWidth >= 1) {
        innerRect = borderRect.clone();
        if (isHorizontal) {
          var topBorder = this.getBorderRect('top');
          if (topBorder.height > 0) {
            innerRect.top = topBorder.top;
            innerRect.height += topBorder.height;
          }
          var bottomBorder = this.getBorderRect('bottom');
          if (bottomBorder.height > 0) {
            innerRect.height += bottomBorder.height;
          }
          innerRect.left += (borderWidth / 2);
          innerRect.width = middleBit;
        } else {
          var leftBorder = this.getBorderRect('left');
          if (leftBorder.width > 0) {
            innerRect.left = leftBorder.left;
            innerRect.width += leftBorder.width;
          }
          var rightBorder = this.getBorderRect('right');
          if (rightBorder.width > 0) {
            innerRect.width += rightBorder.width;
          }
          innerRect.top += (borderWidth / 2);
          innerRect.height = middleBit;
        }

        var tmpCanvas = document.createElement("canvas");
        tmpCanvas.width = 5000;
        tmpCanvas.height = 5000;
        var tmpCtx = tmpCanvas.getContext("2d");

        this.doDrawBorder(tmpCtx, borderRect, borderSide, borderColor);
        tmpCtx.globalCompositeOperation = 'destination-out';
        this.doDrawBorder(tmpCtx, innerRect, borderSide, Color('#FF00FF'), true, 'destination-out');

        ctx.drawImage(tmpCanvas, 0, 0);
        tmpCanvas = null;
      }
    }
    else if (borderStyle == 'ridge' || borderStyle == 'groove') {
      var innerBorderSize = Math.floor((isHorizontal ? borderRect.width : borderRect.height) / 2);
      var outerBorderWidth = (isHorizontal ? borderRect.width : borderRect.height) - innerBorderSize;
      if (innerBorderSize >= 1) {
        innerRect = borderRect.clone();
        if (isHorizontal) {
          if (borderSide == 'left') {
            innerRect.left += innerBorderSize;
          }
          innerRect.width = innerBorderSize;
        } else {
          if (borderSide == 'top') {
            innerRect.top += innerBorderSize;
          }
          innerRect.height = innerBorderSize;
        }
        if (borderSide == 'right' || borderSide == 'bottom') {
          if (borderStyle == 'ridge') {
            innerBorderColour = borderColor;
            borderColor = borderColor.blend(blackColour, 0.66);
          } else {
            innerBorderColour = borderColor.blend(blackColour, 0.66);
          }
        } else {
          if (borderStyle == 'groove') {
            innerBorderColour = borderColor;
            borderColor = borderColor.blend(blackColour, 0.66);
          } else {
            innerBorderColour = borderColor.blend(blackColour, 0.66);
          }
        }

        var tmpCanvas = document.createElement("canvas");
        tmpCanvas.width = 5000;
        tmpCanvas.height = 5000;
        var tmpCtx = tmpCanvas.getContext("2d");

        this.doDrawBorder(tmpCtx, borderRect, borderSide, borderColor);
        this.doDrawBorder(tmpCtx, innerRect, borderSide, innerBorderColour, true);

        ctx.drawImage(tmpCanvas, 0, 0);
        tmpCanvas = null;
      }
    }
    else
    {
        this.doDrawBorder(ctx, borderRect, borderSide, borderColor);
    }
  }
}

painter.Box.prototype.drawBorders = function() {
  if (!this.style.hasBorder) {
    return false;
  }

  // blending values taken from http://stackoverflow.com/questions/4147940/how-do-browsers-determine-which-exact-colors-to-use-for-border-inset-or-outset
  this.drawBorder('left');
  this.drawBorder('top');
  this.drawBorder('right');
  this.drawBorder('bottom');
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
      var crop = false;

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
        crop = true;
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
        crop = true;
      }

      patternWidth = Math.floor(patternWidth);
      patternHeight = Math.floor(patternHeight);

      var tmpCanvas = document.createElement("canvas");
      tmpCanvas.width = this.naturalWidth < patternWidth ? this.naturalWidth : patternWidth;
      tmpCanvas.height = this.naturalHeight < patternHeight ? this.naturalHeight : patternHeight;
      var patternCtx = tmpCanvas.getContext('2d');
      if (crop) {
        patternCtx.drawImage(this, 0, 0, patternWidth, patternHeight);
      } else {
        patternCtx.drawImage(this, 0, 0, patternWidth, patternHeight, 0, 0, patternWidth, patternHeight);
      }

      var pattern = ctx.createPattern(tmpCanvas, 'repeat');

      that.drawRect(Math.floor(patternX), Math.floor(patternY), patternWidth, patternHeight, pattern, Math.ceil(imgOffset.left), Math.ceil(imgOffset.top));
      
      that.drawChildren();
    };
    img.src = imgSrc;
  }
};

function inArray(needle, haystack) {
    var length = haystack.length;
    for(var i = 0; i < length; i++) {
        if(haystack[i] == needle) return true;
    }
    return false;
}

Array.prototype.clone = function() {
var copy = []
for (var j = 0; j < this.length; j++) {
  copy.push(this[j]);
}
return copy;
};

painter.Box.prototype.determineTextDecorations = function(parent) {
  var actualTextDecorations = [];
  var ignoredDisplays = ['table', 'inline-block', 'inline-table'];
  if (parent && parent.nodeName != 'HTML') {
    if (this.style.position != 'absolute' && this.style.position != 'fixed' && !inArray(this.style.display, ignoredDisplays)) {
      actualTextDecorations = boxRefs[parent.getAttribute('veryUniqueId')].actualTextDecorations.clone() || [];
    }
  }
  if (this.style.textDecoration != 'none') {
    if (!inArray(this.style.textDecoration, actualTextDecorations)) {
      actualTextDecorations.push(this.style.textDecoration);
    }
  }
  this.actualTextDecorations = actualTextDecorations;
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
  box_.determineTextDecorations(element.parentNode);

  for (var i = 0, l = element.childNodes.length; i < l; i++) {
    painter.Box.fromDom(element.childNodes[i]);
  }
  
  return box_;
};
  
function is_all_ws(nod)
{
  // Use ECMA-262 Edition 3 String and RegExp features
  return !(/[^\t\n\r ]/.test(nod.data));
}