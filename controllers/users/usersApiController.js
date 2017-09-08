////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var moment = require('moment-timezone');
moment.tz.setDefault("Asia/Tokyo");
var vsprintf = require("sprintf-js").vsprintf;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// UTILITY
var maUtil = require(process.cwd() + '/util//maUtil');
var cleaner = require(process.cwd() + '/util/cleaner');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DAO
var logsDAO = require(process.cwd() + '/dao/logsDAO');
var usersDAO = require(process.cwd() + '/dao/usersDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PARTS
var render = require("./_render");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function debug( label, value, color ){
    var DEBUG_API = "";
    var DEBUG_OBJECT = "CONTROLLER";
    var DEBUG_FILE = "users.api";
    var DEBUG_TMP = DEBUG_API + " " + DEBUG_OBJECT + " " + DEBUG_FILE + " ";
    maUtil.debug(DEBUG_TMP + label, value, color);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ユーザーの追加
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.add = async function(req, res, next) {
    debug("add");

    try {

        var formPostData = req.body;

        var response = await usersDAO.add( formPostData );

        logsDAO.add({
            time: moment().format("YYYY-MM-DD HH:mm:ss"),
            user: req.user.name,
            object: "users-" + response.id,
            type: "add",
            detail: "ユーザー("+formPostData.name+")を追加しました"
        }).catch( err => maUtil.dumpError(err) )

        response.message =  vsprintf("ユーザーを追加しました(%s)", [response.id]);

        render( req, res, next, {
            message: {
                text: response.message,
            },
            error: response.error,
        });

        debug("add finished");

    } catch(e) {
        debug("add err %0", e);
    }

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ユーザーの編集
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.edit = async function(req, res, next) {
    debug("edit");

    try {

        var formPostData = req.body;
        var id = req.params.id;

        var response = await usersDAO.update( id, formPostData );

        logsDAO.add({
            time: moment().format("YYYY-MM-DD HH:mm:ss"),
            user: req.user.name,
            object: "users-" + response.id,
            type: "edit",
            detail: "ユーザー("+formPostData.name+")を編集しました"
        }).catch( err => maUtil.dumpError(err) )

        render( req, res, next, {
            message: {
                text: response.message,
            },
            error: response.error,
        });

        debug("edit finished");

    } catch(e) {
        debug("edit err %0", e);
    }

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ユーザーの削除
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.remove = async function(req, res, next) {
    debug("remove");

    try {

        var id = req.params.id;

        var response = await usersDAO.remove(id);

        logsDAO.add({
            time: moment().format("YYYY-MM-DD HH:mm:ss"),
            user: req.user.name,
            object: "users-" + response.id,
            type: "remove",
            detail: "ユーザー("+response.id+")を削除しました"
        }).catch( err => maUtil.dumpError(err) )

        render( req, res, next, {
            message: {
                text: response.message,
            },
            error: response.error,
        });

        debug("remove finished");

    } catch(e) {
        debug("remove err %0", e);
    }

}
