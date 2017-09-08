////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var moment = require('moment-timezone');
moment.tz.setDefault("Asia/Tokyo");
var vsprintf = require("sprintf-js").vsprintf;
var debug = require('debug')('om/menus/viewController');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var maUtil = require(process.cwd() + '/util//maUtil');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var render = require("./_render");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.index =function(req, res, next){
    debug("index");
    render(req, res, next);
}
