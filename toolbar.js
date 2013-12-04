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
  */
  if (data.charAt(data.length - 1) == " ")
    data = data.substring(0, data.length - 1);
  return data;
}
  
	function postRender() {
		var previewImg = Canvas2Image.saveAsPNG(document.getElementById('thecanvas'), true);
		document.body.appendChild(previewImg);
		//document.getElementById('thecanvas').remove();
	}

function wrapText(context, text, x, y, maxWidth, lineHeight, textIndent, textOffset){
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

(function() {
  toolbarScriptPath = scriptPath();
  writeToolbarScript('color.js');
  writeToolbarScript('canvas2image.js');
  writeToolbarScript('math.js');
  writeToolbarScript('useragent.js');
  writeToolbarScript('dom.js');
  writeToolbarScript('style.js');
  writeToolbarScript('canvas_box.js');
})();

(function($){
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