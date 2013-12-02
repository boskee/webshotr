var userAgent = {};  
  
userAgent.ASSUME_IE = false;
userAgent.ASSUME_GECKO = false;
userAgent.ASSUME_WEBKIT = false;
userAgent.ASSUME_MOBILE_WEBKIT = false;
userAgent.ASSUME_OPERA = false;
userAgent.ASSUME_ANY_VERSION = false;
userAgent.BROWSER_KNOWN_ =
    userAgent.ASSUME_IE ||
    userAgent.ASSUME_GECKO ||
    userAgent.ASSUME_MOBILE_WEBKIT ||
    userAgent.ASSUME_WEBKIT ||
    userAgent.ASSUME_OPERA;
userAgent.getUserAgentString = function() {
  return window.navigator ? window.navigator.userAgent : null;
};
userAgent.getNavigator = function() {
  // Need a local navigator reference instead of using the global one,
  // to avoid the rare case where they reference different objects.
  // (goog.gears.FakeWorkerPool, for example).
  return window.navigator;
};  
  
userAgent.init_ = function() {
  /**
   * Whether the user agent string denotes Opera.
   * @type {boolean}
   * @private
   */
  userAgent.detectedOpera_ = false;

  /**
   * Whether the user agent string denotes Internet Explorer. This includes
   * other browsers using Trident as its rendering engine. For example AOL
   * and Netscape 8
   * @type {boolean}
   * @private
   */
  userAgent.detectedIe_ = false;

  /**
   * Whether the user agent string denotes WebKit. WebKit is the rendering
   * engine that Safari, Android and others use.
   * @type {boolean}
   * @private
   */
  userAgent.detectedWebkit_ = false;

  /**
   * Whether the user agent string denotes a mobile device.
   * @type {boolean}
   * @private
   */
  userAgent.detectedMobile_ = false;

  /**
   * Whether the user agent string denotes Gecko. Gecko is the rendering
   * engine used by Mozilla, Mozilla Firefox, Camino and many more.
   * @type {boolean}
   * @private
   */
  userAgent.detectedGecko_ = false;

  var ua;
  if (!userAgent.BROWSER_KNOWN_ &&
      (ua = userAgent.getUserAgentString())) {
    var navigator = userAgent.getNavigator();
    userAgent.detectedOpera_ = ua.indexOf('Opera') == 0;
    userAgent.detectedIe_ = !userAgent.detectedOpera_ &&
        (ua.indexOf('MSIE') != -1 ||
         ua.indexOf('Trident') != -1);
    userAgent.detectedWebkit_ = !userAgent.detectedOpera_ &&
        ua.indexOf('WebKit') != -1;
    // WebKit also gives navigator.product string equal to 'Gecko'.
    userAgent.detectedMobile_ = userAgent.detectedWebkit_ &&
        ua.indexOf('Mobile') != -1;
    userAgent.detectedGecko_ = !userAgent.detectedOpera_ &&
        !userAgent.detectedWebkit_ && !userAgent.detectedIe_ &&
        navigator.product == 'Gecko';
  }
};  

if (!userAgent.BROWSER_KNOWN_) {
  userAgent.init_();
}

userAgent.OPERA = userAgent.BROWSER_KNOWN_ ?
    userAgent.ASSUME_OPERA : userAgent.detectedOpera_;


/**
 * Whether the user agent is Internet Explorer. This includes other browsers
 * using Trident as its rendering engine. For example AOL and Netscape 8
 * @type {boolean}
 */
userAgent.IE = userAgent.BROWSER_KNOWN_ ?
    userAgent.ASSUME_IE : userAgent.detectedIe_;


/**
 * Whether the user agent is Gecko. Gecko is the rendering engine used by
 * Mozilla, Mozilla Firefox, Camino and many more.
 * @type {boolean}
 */
userAgent.GECKO = userAgent.BROWSER_KNOWN_ ?
    userAgent.ASSUME_GECKO :
    userAgent.detectedGecko_;


/**
 * Whether the user agent is WebKit. WebKit is the rendering engine that
 * Safari, Android and others use.
 * @type {boolean}
 */
userAgent.WEBKIT = userAgent.BROWSER_KNOWN_ ?
    userAgent.ASSUME_WEBKIT || userAgent.ASSUME_MOBILE_WEBKIT :
    userAgent.detectedWebkit_;


/**
 * Whether the user agent is running on a mobile device.
 * @type {boolean}
 */
userAgent.MOBILE = userAgent.ASSUME_MOBILE_WEBKIT ||
                        userAgent.detectedMobile_;


/**
 * Used while transitioning code to use WEBKIT instead.
 * @type {boolean}
 * @deprecated Use {@link userAgent.product.SAFARI} instead.
 * TODO(nicksantos): Delete this from userAgent.
 */
userAgent.SAFARI = userAgent.WEBKIT;

/**
 * @return {string} the platform (operating system) the user agent is running
 *     on. Default to empty string because navigator.platform may not be defined
 *     (on Rhino, for example).
 * @private
 */
userAgent.determinePlatform_ = function() {
  var navigator = userAgent.getNavigator();
  return navigator && navigator.platform || '';
};


/**
 * @return {string} The string that describes the version number of the user
 *     agent.
 * @private
 */
userAgent.determineVersion_ = function() {
  // All browsers have different ways to detect the version and they all have
  // different naming schemes.

  // version is a string rather than a number because it may contain 'b', 'a',
  // and so on.
  var version = '', re;

  if (userAgent.OPERA && window.opera) {
    var operaVersion = window.opera.version;
    version = typeof operaVersion == 'function' ? operaVersion() : operaVersion;
  } else {
    if (userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/;
    } else if (userAgent.IE) {
      re = /\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/;
    } else if (userAgent.WEBKIT) {
      // WebKit/125.4
      re = /WebKit\/(\S+)/;
    }
    if (re) {
      var arr = re.exec(userAgent.getUserAgentString());
      version = arr ? arr[1] : '';
    }
  }
  if (userAgent.IE) {
    // IE9 can be in document mode 9 but be reporting an inconsistent user agent
    // version.  If it is identifying as a version lower than 9 we take the
    // documentMode as the version instead.  IE8 has similar behavior.
    // It is recommended to set the X-UA-Compatible header to ensure that IE9
    // uses documentMode 9.
    var docMode = userAgent.getDocumentMode_();
    if (docMode > parseFloat(version)) {
      return String(docMode);
    }
  }
  return version;
};

userAgent.trim = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
};


/**
 * Compares elements of a version number.
 *
 * @param {string|number|boolean} left An element from a version number.
 * @param {string|number|boolean} right An element from a version number.
 *
 * @return {number}  1 if {@code left} is higher.
 *                   0 if arguments are equal.
 *                  -1 if {@code right} is higher.
 * @private
 */
userAgent.compareElements_ = function(left, right) {
  if (left < right) {
    return -1;
  } else if (left > right) {
    return 1;
  }
  return 0;
};

/**
 * Compares two version numbers.
 *
 * @param {string|number} version1 Version of first item.
 * @param {string|number} version2 Version of second item.
 *
 * @return {number}  1 if {@code version1} is higher.
 *                   0 if arguments are equal.
 *                  -1 if {@code version2} is higher.
 */
userAgent.compareVersions = function(version1, version2) {
  var order = 0;
  // Trim leading and trailing whitespace and split the versions into
  // subversions.
  var v1Subs = userAgent.trim(String(version1)).split('.');
  var v2Subs = userAgent.trim(String(version2)).split('.');
  var subCount = Math.max(v1Subs.length, v2Subs.length);

  // Iterate over the subversions, as long as they appear to be equivalent.
  for (var subIdx = 0; order == 0 && subIdx < subCount; subIdx++) {
    var v1Sub = v1Subs[subIdx] || '';
    var v2Sub = v2Subs[subIdx] || '';

    // Split the subversions into pairs of numbers and qualifiers (like 'b').
    // Two different RegExp objects are needed because they are both using
    // the 'g' flag.
    var v1CompParser = new RegExp('(\\d*)(\\D*)', 'g');
    var v2CompParser = new RegExp('(\\d*)(\\D*)', 'g');
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ['', '', ''];
      var v2Comp = v2CompParser.exec(v2Sub) || ['', '', ''];
      // Break if there are no more matches.
      if (v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break;
      }

      // Parse the numeric part of the subversion. A missing number is
      // equivalent to 0.
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);

      // Compare the subversion components. The number has the highest
      // precedence. Next, if the numbers are equal, a subversion without any
      // qualifier is always higher than a subversion with any qualifier. Next,
      // the qualifiers are compared as strings.
      order = userAgent.compareElements_(v1CompNum, v2CompNum) ||
          userAgent.compareElements_(v1Comp[2].length == 0,
              v2Comp[2].length == 0) ||
          userAgent.compareElements_(v1Comp[2], v2Comp[2]);
      // Stop as soon as an inequality is discovered.
    } while (order == 0);
  }

  return order;
};

/**
 * The version of the user agent. This is a string because it might contain
 * 'b' (as in beta) as well as multiple dots.
 * @type {string}
 */
userAgent.VERSION = userAgent.determineVersion_();


/**
 * Compares two version numbers.
 *
 * @param {string} v1 Version of first item.
 * @param {string} v2 Version of second item.
 *
 * @return {number}  1 if first argument is higher
 *                   0 if arguments are equal
 *                  -1 if second argument is higher.
 * @deprecated Use goog.string.compareVersions.
 */
userAgent.compare = function(v1, v2) {
  return userAgent.compareVersions(v1, v2);
};


/**
 * Cache for {@link goog.userAgent.isVersionOrHigher}.
 * Calls to compareVersions are surprisingly expensive and, as a browser's
 * version number is unlikely to change during a session, we cache the results.
 * @const
 * @private
 */
userAgent.isVersionOrHigherCache_ = {};


/**
 * Whether the user agent version is higher or the same as the given version.
 * NOTE: When checking the version numbers for Firefox and Safari, be sure to
 * use the engine's version, not the browser's version number.  For example,
 * Firefox 3.0 corresponds to Gecko 1.9 and Safari 3.0 to Webkit 522.11.
 * Opera and Internet Explorer versions match the product release number.<br>
 * @see <a href="http://en.wikipedia.org/wiki/Safari_version_history">
 *     Webkit</a>
 * @see <a href="http://en.wikipedia.org/wiki/Gecko_engine">Gecko</a>
 *
 * @param {string|number} version The version to check.
 * @return {boolean} Whether the user agent version is higher or the same as
 *     the given version.
 */
userAgent.isVersionOrHigher = function(version) {
  return userAgent.ASSUME_ANY_VERSION ||
      userAgent.isVersionOrHigherCache_[version] ||
      (userAgent.isVersionOrHigherCache_[version] =
          userAgent.compareVersions(userAgent.VERSION, version) >= 0);
};

userAgent.isDocumentModeCache_ = {};

userAgent.isDocumentMode = function(documentMode) {
  return userAgent.isDocumentModeCache_[documentMode] ||
      (userAgent.isDocumentModeCache_[documentMode] = userAgent.IE &&
      !!document.documentMode && document.documentMode >= documentMode);
};
