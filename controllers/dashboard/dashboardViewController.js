////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var debug = require('debug')('om/dashboard/viewController');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PARTS
var render = require("./_render");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.index = function(req, res, next) {
    render(req, res, next);
}
