var scriptPath = function () {
    var scripts = document.getElementsByTagName('SCRIPT');
    var path = '';
    if(scripts && scripts.length>0) {
        for(var i in scripts) {
            if(scripts[i].src && scripts[i].src.match(/toolbar\.js$/)) {
                path = scripts[i].src.replace(/(.*)toolbar\.js$/, '$1');
            }
        }
    }
    return path;
};

var toolbarScriptPath = './';

function writeToolbarScript(name) {
  var tb = document.createElement('script');
  tb.type = 'text/javascript';
  tb.async = false;
  tb.src = toolbarScriptPath + 'src/' + name;
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(tb, s);
}

var renderedSize = {width: 0, height: 0};
	
function data_of( txt )
{
  var data = txt.data;
  // Use ECMA-262 Edition 3 String and RegExp features
  data = data.replace(/[\t\n\r ]+/g, " ");
  /*if (data.charAt(0) == " ")
    data = data.substring(1, data.length);
  if (data.charAt(data.length - 1) == " ")
    data = data.substring(0, data.length - 1);
  */
  return data;
}
  
	function postRender() {
		var previewImg = Canvas2Image.saveAsPNG(document.getElementById('thecanvas'), true);
		document.body.appendChild(previewImg);
		//document.getElementById('thecanvas').remove();
	}

var underline = function(ctx, x, y, width, thickness) {
  ctx.lineWidth = thickness;
  ctx.beginPath();
  ctx.moveTo(x,y - 1.5);
  ctx.lineTo(x+width,y - 1.5);
  ctx.stroke();
}

var overline = function(ctx, x, y, width, thickness) {
  ctx.lineWidth = thickness;
  ctx.beginPath();
  ctx.moveTo(x,y + .5);
  ctx.lineTo(x+width,y + .5);
  ctx.stroke();
}

var line_through = function(ctx, x, y, width, thickness) {
  ctx.lineWidth = thickness;
  ctx.beginPath();
  ctx.moveTo(x,y + .5);
  ctx.lineTo(x+width,y + .5);
  ctx.stroke();
}

function wrapText(context, text, x, y, maxWidth, lineHeight, textIndent, textOffset, textSize, decorations){
  var words = text.split(" ");
  var line = "";
  var actualWidth = 0;

  textOffset = textOffset || {left: 0, top: 0};

  textIndent += textOffset.left;

  y += textOffset.top;
  //y += (lineHeight / 2);

  for (var n = 0; n < words.length; n++) {
      var testLine = line + words[n];
      var metrics = context.measureText(testLine);
      var testWidth = metrics.width + textIndent;
      if (testWidth > maxWidth) {
          metrics = context.measureText(line);
          testWidth = metrics.width;
          context.fillText(data_of({data:line}), x + textIndent, y);
          y += lineHeight;
  		  if (decorations.length > 0) {
		  var metrics2 = context.measureText((line.charAt(line.length - 1) == " ") ? line.substring(0, line.length - 1) : line);
		  var testWidth2 = metrics2.width;
	          for (var i = 0; i < decorations.length; i++) {
	          	  var decoration = decorations[i];
		          if (decoration == 'underline') {
		          	underline(context, x + textIndent, y, testWidth2, 1);
		          } else if (decoration == 'overline') {
		          	overline(context, x + textIndent, y - lineHeight, testWidth2, 1);
		          } else if (decoration == 'line-through') {
		          	line_through(context, x + textIndent, y - (lineHeight / 2), testWidth2, 1);
		          }
		      }
		  }
          line = words[n] + " ";
          textIndent = 0;
      }
      else {
          line = testLine + " ";
      }
      actualWidth = Math.max(actualWidth, testWidth);
  }
  context.fillText(data_of({data:line}), x + textIndent, y);
  y += lineHeight;
  if (decorations.length > 0) {
	  var metrics = context.measureText(data_of({data:line}));
	  var testWidth = metrics.width;
          for (var i = 0; i < decorations.length; i++) {
          	  var decoration = decorations[i];
	          if (decoration == 'underline') {
	          	underline(context, x + textIndent, y, testWidth, 1);
	          } else if (decoration == 'overline') {
	          	overline(context, x + textIndent, y - lineHeight, testWidth, 1);
	          } else if (decoration == 'line-through') {
	          	line_through(context, x + textIndent, y - (lineHeight / 2), testWidth, 1);
	          }
	      }
	}
  return actualWidth;
}

    // font-defined metrics
    function getFontMetrics(metrics) {
      var s = "font.onload() called - loaded font information:<br>{<br>&nbsp;&nbsp;";
      var information = [];
      for(attr in metrics) { information.push(attr + " : " + metrics[attr]); }
      s += information.join(",<br>&nbsp;&nbsp;") + "<br>}<br>";
      return s;
    }
    
    // specific metrics
    function getTextMetrics(fontSize, metrics) {
      information = [];
      for(attr in metrics) {
        if(attr!='bounds') { information.push(attr + " : " + metrics[attr]); }
        else {
          var s = attr + " : {";
          var bds = [];
          for(m in metrics[attr]) { bds.push(m+":"+metrics[attr][m]); }
          s += bds.join(", ") + "}";
          information.push(s);
        }
      }
      var s = "metrics for string \"<span style='color: #669; font-size:"+fontSize+"px;'>"+textString+"</span>\""+
           "(at "+fontSize+"px):<br>{<br>&nbsp;&nbsp;";
      s += information.join(",<br>&nbsp;&nbsp;") + "<br>}";
      return s;
    }



/*function load_sys(textString, fontFamily, fontSize) {
  // let's load a font!
  var font = new Font();

  fontSize = parseInt(fontSize, 10);

  // set up the onload handler
  font.onload = function() {
    // create a paragraph of text, styled with this font, showing all metrics
    var p = document.createElement("P");
    document.body.appendChild(p);
    //var p = document.getElementById("fontinfo_sys");
    p.style.fontFamily = "'" + font.fontFamily + "'";
    p.style.fontSize = fontSize;
    
    return font.measureText(textString, fontSize);

    // get font-specific as well as text-specific metrics for this font
    p.innerHTML = "Because we do not have access to the system font file, font-declared metrics are not available.<br>" + 
                  getTextMetrics(fontSize, font.measureText(textString, fontSize));
  }

  // error handler
  font.onerror = function(err) { alert(err); }

  // then kick off font loading by assigning the "src" property
  font.fontFamily = fontFamily;
  font.src = font.fontFamily;
}*/

function wrappedTextHeight(context, text, x, y, maxWidth, lineHeight, textIndent, textOffset){
  var words = text.split(" ");
  var line = "";
  var actualHeight = lineHeight / 2;

  textOffset = textOffset || {left: 0, top: 0};

  textIndent += textOffset.left;

  y += textOffset.top;
  //y += (lineHeight / 2);

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

(function($) {
  toolbarScriptPath = scriptPath();
  writeToolbarScript('Font.js');
  writeToolbarScript('color.js');
  writeToolbarScript('canvas2image.js');
  writeToolbarScript('math.js');
  writeToolbarScript('useragent.js');
  writeToolbarScript('dom.js');
  writeToolbarScript('style.js');
  writeToolbarScript('canvas_box.js');
	// Parse and load a sample document
	$(window).load(function() {
		renderedSize.width = $(document).outerWidth();
		renderedSize.height = $(document).outerHeight();
	  var canvasObj = document.createElement("canvas");
	  canvasObj.width = renderedSize.width;
	  canvasObj.height = renderedSize.height;
	  canvasObj.style.display = 'none';
	  canvasObj.id = 'thecanvas';
	  document.body.appendChild(canvasObj);
    	painter.Box.fromDom(document.body).render(postRender);
		document.getElementById('thecanvas').style.display = 'block';
	});
}(jQuery));