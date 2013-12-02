var math = {};

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
math.Box = function(top, right, bottom, left) {
  /**
   * Top
   * @type {number}
   */
  this.top = top;

  /**
   * Right
   * @type {number}
   */
  this.right = right;

  /**
   * Bottom
   * @type {number}
   */
  this.bottom = bottom;

  /**
   * Left
   * @type {number}
   */
  this.left = left;
};


/**
 * Creates a Box by bounding a collection of math.Coordinate objects
 * @param {...math.Coordinate} var_args Coordinates to be included inside
 *     the box.
 * @return {!math.Box} A Box containing all the specified Coordinates.
 */
math.Box.boundingBox = function(var_args) {
  var box = new math.Box(arguments[0].y, arguments[0].x,
                              arguments[0].y, arguments[0].x);
  for (var i = 1; i < arguments.length; i++) {
    var coord = arguments[i];
    box.top = Math.min(box.top, coord.y);
    box.right = Math.max(box.right, coord.x);
    box.bottom = Math.max(box.bottom, coord.y);
    box.left = Math.min(box.left, coord.x);
  }
  return box;
};


/**
 * Creates a copy of the box with the same dimensions.
 * @return {!math.Box} A clone of this Box.
 */
math.Box.prototype.clone = function() {
  return new math.Box(this.top, this.right, this.bottom, this.left);
};


/**
 * Returns whether the box contains a coordinate or another box.
 *
 * @param {math.Coordinate|math.Box} other A Coordinate or a Box.
 * @return {boolean} Whether the box contains the coordinate or other box.
 */
math.Box.prototype.contains = function(other) {
  return math.Box.contains(this, other);
};


/**
 * Expands box with the given margins.
 *
 * @param {number|math.Box} top Top margin or box with all margins.
 * @param {number=} opt_right Right margin.
 * @param {number=} opt_bottom Bottom margin.
 * @param {number=} opt_left Left margin.
 * @return {!math.Box} A reference to this Box.
 */
math.Box.prototype.expand = function(top, opt_right, opt_bottom,
    opt_left) {
  if (isObject(top)) {
    this.top -= top.top;
    this.right += top.right;
    this.bottom += top.bottom;
    this.left -= top.left;
  } else {
    this.top -= top;
    this.right += opt_right;
    this.bottom += opt_bottom;
    this.left -= opt_left;
  }

  return this;
};


/**
 * Expand this box to include another box.
 * NOTE(user): This is used in code that needs to be very fast, please don't
 * add functionality to this function at the expense of speed (variable
 * arguments, accepting multiple argument types, etc).
 * @param {math.Box} box The box to include in this one.
 */
math.Box.prototype.expandToInclude = function(box) {
  this.left = Math.min(this.left, box.left);
  this.top = Math.min(this.top, box.top);
  this.right = Math.max(this.right, box.right);
  this.bottom = Math.max(this.bottom, box.bottom);
};


/**
 * Compares boxes for equality.
 * @param {math.Box} a A Box.
 * @param {math.Box} b A Box.
 * @return {boolean} True iff the boxes are equal, or if both are null.
 */
math.Box.equals = function(a, b) {
  if (a == b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.top == b.top && a.right == b.right &&
         a.bottom == b.bottom && a.left == b.left;
};


/**
 * Returns whether a box contains a coordinate or another box.
 *
 * @param {math.Box} box A Box.
 * @param {math.Coordinate|math.Box} other A Coordinate or a Box.
 * @return {boolean} Whether the box contains the coordinate or other box.
 */
math.Box.contains = function(box, other) {
  if (!box || !other) {
    return false;
  }

  if (other instanceof math.Box) {
    return other.left >= box.left && other.right <= box.right &&
        other.top >= box.top && other.bottom <= box.bottom;
  }

  // other is a Coordinate.
  return other.x >= box.left && other.x <= box.right &&
         other.y >= box.top && other.y <= box.bottom;
};


/**
 * Returns the distance between a coordinate and the nearest corner/side of a
 * box. Returns zero if the coordinate is inside the box.
 *
 * @param {math.Box} box A Box.
 * @param {math.Coordinate} coord A Coordinate.
 * @return {number} The distance between {@code coord} and the nearest
 *     corner/side of {@code box}, or zero if {@code coord} is inside
 *     {@code box}.
 */
math.Box.distance = function(box, coord) {
  if (coord.x >= box.left && coord.x <= box.right) {
    if (coord.y >= box.top && coord.y <= box.bottom) {
      return 0;
    }
    return coord.y < box.top ? box.top - coord.y : coord.y - box.bottom;
  }

  if (coord.y >= box.top && coord.y <= box.bottom) {
    return coord.x < box.left ? box.left - coord.x : coord.x - box.right;
  }

  return math.Coordinate.distance(coord,
      new math.Coordinate(coord.x < box.left ? box.left : box.right,
                               coord.y < box.top ? box.top : box.bottom));
};


/**
 * Returns whether two boxes intersect.
 *
 * @param {math.Box} a A Box.
 * @param {math.Box} b A second Box.
 * @return {boolean} Whether the boxes intersect.
 */
math.Box.intersects = function(a, b) {
  return (a.left <= b.right && b.left <= a.right &&
          a.top <= b.bottom && b.top <= a.bottom);
};


/**
 * Returns whether two boxes would intersect with additional padding.
 *
 * @param {math.Box} a A Box.
 * @param {math.Box} b A second Box.
 * @param {number} padding The additional padding.
 * @return {boolean} Whether the boxes intersect.
 */
math.Box.intersectsWithPadding = function(a, b, padding) {
  return (a.left <= b.right + padding && b.left <= a.right + padding &&
          a.top <= b.bottom + padding && b.top <= a.bottom + padding);
};  
  
/**
 * Class for representing coordinates and positions.
 * @param {number=} opt_x Left, defaults to 0.
 * @param {number=} opt_y Top, defaults to 0.
 * @constructor
 */
math.Coordinate = function(opt_x, opt_y) {
  /**
   * X-value
   * @type {number}
   */
  this.x = opt_x !== undefined ? opt_x : 0;

  /**
   * Y-value
   * @type {number}
   */
  this.y = opt_y !== undefined ? opt_y : 0;
};


/**
 * Returns a new copy of the coordinate.
 * @return {!math.Coordinate} A clone of this coordinate.
 */
math.Coordinate.prototype.clone = function() {
  return new math.Coordinate(this.x, this.y);
};

/**
 * Compares coordinates for equality.
 * @param {math.Coordinate} a A Coordinate.
 * @param {math.Coordinate} b A Coordinate.
 * @return {boolean} True iff the coordinates are equal, or if both are null.
 */
math.Coordinate.equals = function(a, b) {
  if (a == b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.x == b.x && a.y == b.y;
};


/**
 * Returns the distance between two coordinates.
 * @param {!math.Coordinate} a A Coordinate.
 * @param {!math.Coordinate} b A Coordinate.
 * @return {number} The distance between {@code a} and {@code b}.
 */
math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};


/**
 * Returns the squared distance between two coordinates. Squared distances can
 * be used for comparisons when the actual value is not required.
 *
 * Performance note: eliminating the square root is an optimization often used
 * in lower-level languages, but the speed difference is not nearly as
 * pronounced in JavaScript (only a few percent.)
 *
 * @param {!math.Coordinate} a A Coordinate.
 * @param {!math.Coordinate} b A Coordinate.
 * @return {number} The squared distance between {@code a} and {@code b}.
 */
math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy;
};


/**
 * Returns the difference between two coordinates as a new
 * math.Coordinate.
 * @param {!math.Coordinate} a A Coordinate.
 * @param {!math.Coordinate} b A Coordinate.
 * @return {!math.Coordinate} A Coordinate representing the difference
 *     between {@code a} and {@code b}.
 */
math.Coordinate.difference = function(a, b) {
  return new math.Coordinate(a.x - b.x, a.y - b.y);
};


/**
 * Returns the sum of two coordinates as a new math.Coordinate.
 * @param {!math.Coordinate} a A Coordinate.
 * @param {!math.Coordinate} b A Coordinate.
 * @return {!math.Coordinate} A Coordinate representing the sum of the two
 *     coordinates.
 */
math.Coordinate.sum = function(a, b) {
  return new math.Coordinate(a.x + b.x, a.y + b.y);
};




















/**
 * Class for representing sizes consisting of a width and height. Undefined
 * width and height support is deprecated and results in compiler warning.
 * @param {number} width Width.
 * @param {number} height Height.
 * @constructor
 */
math.Size = function(width, height) {
  /**
   * Width
   * @type {number}
   */
  this.width = width;

  /**
   * Height
   * @type {number}
   */
  this.height = height;
};


/**
 * Compares sizes for equality.
 * @param {math.Size} a A Size.
 * @param {math.Size} b A Size.
 * @return {boolean} True iff the sizes have equal widths and equal
 *     heights, or if both are null.
 */
math.Size.equals = function(a, b) {
  if (a == b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.width == b.width && a.height == b.height;
};


/**
 * @return {!math.Size} A new copy of the Size.
 */
math.Size.prototype.clone = function() {
  return new math.Size(this.width, this.height);
};


/**
 * @return {number} The longer of the two dimensions in the size.
 */
math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height);
};


/**
 * @return {number} The shorter of the two dimensions in the size.
 */
math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height);
};


/**
 * @return {number} The area of the size (width * height).
 */
math.Size.prototype.area = function() {
  return this.width * this.height;
};


/**
 * @return {number} The perimeter of the size (width + height) * 2.
 */
math.Size.prototype.perimeter = function() {
  return (this.width + this.height) * 2;
};


/**
 * @return {number} The ratio of the size's width to its height.
 */
math.Size.prototype.aspectRatio = function() {
  return this.width / this.height;
};


/**
 * @return {boolean} True if the size has zero area, false if both dimensions
 *     are non-zero numbers.
 */
math.Size.prototype.isEmpty = function() {
  return !this.area();
};


/**
 * Clamps the width and height parameters upward to integer values.
 * @return {!math.Size} This size with ceil'd components.
 */
math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this;
};


/**
 * @param {!math.Size} target The target size.
 * @return {boolean} True if this Size is the same size or smaller than the
 *     target size in both dimensions.
 */
math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height;
};


/**
 * Clamps the width and height parameters downward to integer values.
 * @return {!math.Size} This size with floored components.
 */
math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this;
};


/**
 * Rounds the width and height parameters to integer values.
 * @return {!math.Size} This size with rounded components.
 */
math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this;
};


/**
 * Scales the size uniformly by a factor.
 * @param {number} s The scale factor.
 * @return {!math.Size} This Size object after scaling.
 */
math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this;
};


/**
 * Uniformly scales the size to fit inside the dimensions of a given size. The
 * original aspect ratio will be preserved.
 *
 * This function assumes that both Sizes contain strictly positive dimensions.
 * @param {!math.Size} target The target size.
 * @return {!math.Size} This Size object, after optional scaling.
 */
math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ?
      target.width / this.width :
      target.height / this.height;

  return this.scale(s);
};











/**
 * Class for representing rectangular regions.
 * @param {number} x Left.
 * @param {number} y Top.
 * @param {number} w Width.
 * @param {number} h Height.
 * @constructor
 */
math.Rect = function(x, y, w, h) {
  /**
   * Left
   * @type {number}
   */
  this.left = x;

  /**
   * Top
   * @type {number}
   */
  this.top = y;

  /**
   * Width
   * @type {number}
   */
  this.width = w;

  /**
   * Height
   * @type {number}
   */
  this.height = h;
};


/**
 * Returns a new copy of the rectangle.
 * @return {!math.Rect} A clone of this Rectangle.
 */
math.Rect.prototype.clone = function() {
  return new math.Rect(this.left, this.top, this.width, this.height);
};


/**
 * Returns a new Box object with the same position and dimensions as this
 * rectangle.
 * @return {!math.Box} A new Box representation of this Rectangle.
 */
math.Rect.prototype.toBox = function() {
  var right = this.left + this.width;
  var bottom = this.top + this.height;
  return new math.Box(this.top,
                           right,
                           bottom,
                           this.left);
};


/**
 * Creates a new Rect object with the same position and dimensions as a given
 * Box.  Note that this is only the inverse of toBox if left/top are defined.
 * @param {math.Box} box A box.
 * @return {!math.Rect} A new Rect initialized with the box's position
 *     and size.
 */
math.Rect.createFromBox = function(box) {
  return new math.Rect(box.left, box.top,
      box.right - box.left, box.bottom - box.top);
};


/**
 * Compares rectangles for equality.
 * @param {math.Rect} a A Rectangle.
 * @param {math.Rect} b A Rectangle.
 * @return {boolean} True iff the rectangles have the same left, top, width,
 *     and height, or if both are null.
 */
math.Rect.equals = function(a, b) {
  if (a == b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.left == b.left && a.width == b.width &&
         a.top == b.top && a.height == b.height;
};


/**
 * Computes the intersection of this rectangle and the rectangle parameter.  If
 * there is no intersection, returns false and leaves this rectangle as is.
 * @param {math.Rect} rect A Rectangle.
 * @return {boolean} True iff this rectangle intersects with the parameter.
 */
math.Rect.prototype.intersection = function(rect) {
  var x0 = Math.max(this.left, rect.left);
  var x1 = Math.min(this.left + this.width, rect.left + rect.width);

  if (x0 <= x1) {
    var y0 = Math.max(this.top, rect.top);
    var y1 = Math.min(this.top + this.height, rect.top + rect.height);

    if (y0 <= y1) {
      this.left = x0;
      this.top = y0;
      this.width = x1 - x0;
      this.height = y1 - y0;

      return true;
    }
  }
  return false;
};


/**
 * Returns the intersection of two rectangles. Two rectangles intersect if they
 * touch at all, for example, two zero width and height rectangles would
 * intersect if they had the same top and left.
 * @param {math.Rect} a A Rectangle.
 * @param {math.Rect} b A Rectangle.
 * @return {math.Rect} A new intersection rect (even if width and height
 *     are 0), or null if there is no intersection.
 */
math.Rect.intersection = function(a, b) {
  // There is no nice way to do intersection via a clone, because any such
  // clone might be unnecessary if this function returns null.  So, we duplicate
  // code from above.

  var x0 = Math.max(a.left, b.left);
  var x1 = Math.min(a.left + a.width, b.left + b.width);

  if (x0 <= x1) {
    var y0 = Math.max(a.top, b.top);
    var y1 = Math.min(a.top + a.height, b.top + b.height);

    if (y0 <= y1) {
      return new math.Rect(x0, y0, x1 - x0, y1 - y0);
    }
  }
  return null;
};


/**
 * Returns whether two rectangles intersect. Two rectangles intersect if they
 * touch at all, for example, two zero width and height rectangles would
 * intersect if they had the same top and left.
 * @param {math.Rect} a A Rectangle.
 * @param {math.Rect} b A Rectangle.
 * @return {boolean} Whether a and b intersect.
 */
math.Rect.intersects = function(a, b) {
  return (a.left <= b.left + b.width && b.left <= a.left + a.width &&
      a.top <= b.top + b.height && b.top <= a.top + a.height);
};


/**
 * Returns whether a rectangle intersects this rectangle.
 * @param {math.Rect} rect A rectangle.
 * @return {boolean} Whether rect intersects this rectangle.
 */
math.Rect.prototype.intersects = function(rect) {
  return math.Rect.intersects(this, rect);
};


/**
 * Computes the difference regions between two rectangles. The return value is
 * an array of 0 to 4 rectangles defining the remaining regions of the first
 * rectangle after the second has been subtracted.
 * @param {math.Rect} a A Rectangle.
 * @param {math.Rect} b A Rectangle.
 * @return {!Array.<!math.Rect>} An array with 0 to 4 rectangles which
 *     together define the difference area of rectangle a minus rectangle b.
 */
math.Rect.difference = function(a, b) {
  var intersection = math.Rect.intersection(a, b);
  if (!intersection || !intersection.height || !intersection.width) {
    return [a.clone()];
  }

  var result = [];

  var top = a.top;
  var height = a.height;

  var ar = a.left + a.width;
  var ab = a.top + a.height;

  var br = b.left + b.width;
  var bb = b.top + b.height;

  // Subtract off any area on top where A extends past B
  if (b.top > a.top) {
    result.push(new math.Rect(a.left, a.top, a.width, b.top - a.top));
    top = b.top;
    // If we're moving the top down, we also need to subtract the height diff.
    height -= b.top - a.top;
  }
  // Subtract off any area on bottom where A extends past B
  if (bb < ab) {
    result.push(new math.Rect(a.left, bb, a.width, ab - bb));
    height = bb - top;
  }
  // Subtract any area on left where A extends past B
  if (b.left > a.left) {
    result.push(new math.Rect(a.left, top, b.left - a.left, height));
  }
  // Subtract any area on right where A extends past B
  if (br < ar) {
    result.push(new math.Rect(br, top, ar - br, height));
  }

  return result;
};


/**
 * Computes the difference regions between this rectangle and {@code rect}. The
 * return value is an array of 0 to 4 rectangles defining the remaining regions
 * of this rectangle after the other has been subtracted.
 * @param {math.Rect} rect A Rectangle.
 * @return {!Array.<!math.Rect>} An array with 0 to 4 rectangles which
 *     together define the difference area of rectangle a minus rectangle b.
 */
math.Rect.prototype.difference = function(rect) {
  return math.Rect.difference(this, rect);
};


/**
 * Expand this rectangle to also include the area of the given rectangle.
 * @param {math.Rect} rect The other rectangle.
 */
math.Rect.prototype.boundingRect = function(rect) {
  // We compute right and bottom before we change left and top below.
  var right = Math.max(this.left + this.width, rect.left + rect.width);
  var bottom = Math.max(this.top + this.height, rect.top + rect.height);

  this.left = Math.min(this.left, rect.left);
  this.top = Math.min(this.top, rect.top);

  this.width = right - this.left;
  this.height = bottom - this.top;
};


/**
 * Returns a new rectangle which completely contains both input rectangles.
 * @param {math.Rect} a A rectangle.
 * @param {math.Rect} b A rectangle.
 * @return {math.Rect} A new bounding rect, or null if either rect is
 *     null.
 */
math.Rect.boundingRect = function(a, b) {
  if (!a || !b) {
    return null;
  }

  var clone = a.clone();
  clone.boundingRect(b);

  return clone;
};


/**
 * Tests whether this rectangle entirely contains another rectangle or
 * coordinate.
 *
 * @param {math.Rect|math.Coordinate} another The rectangle or
 *     coordinate to test for containment.
 * @return {boolean} Whether this rectangle contains given rectangle or
 *     coordinate.
 */
math.Rect.prototype.contains = function(another) {
  if (another instanceof math.Rect) {
    return this.left <= another.left &&
           this.left + this.width >= another.left + another.width &&
           this.top <= another.top &&
           this.top + this.height >= another.top + another.height;
  } else { // (another instanceof math.Coordinate)
    return another.x >= this.left &&
           another.x <= this.left + this.width &&
           another.y >= this.top &&
           another.y <= this.top + this.height;
  }
};


/**
 * Returns the size of this rectangle.
 * @return {!math.Size} The size of this rectangle.
 */
math.Rect.prototype.getSize = function() {
  return new math.Size(this.width, this.height);
};
