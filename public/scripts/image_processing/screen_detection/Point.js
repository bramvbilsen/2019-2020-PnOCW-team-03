"use strict";
exports.__esModule = true;
var Point = /** @class */ (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    Point.prototype.distanceTo = function (point) {
        return Math.sqrt(Math.pow(point.x - this.x, 2) + Math.pow(point.y - this.y, 2));
    };
    return Point;
}());
exports["default"] = Point;
