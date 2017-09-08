////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var moment = require('moment-timezone');
moment.tz.setDefault("Asia/Tokyo");
var vsprintf = require("sprintf-js").vsprintf;
var debug = require('debug')('om/menus/apiController');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var maUtil = require(process.cwd() + '/util//maUtil');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var appDAO = require(process.cwd() + '/dao/appDAO');
var languagesDAO = require(process.cwd() + '/dao/languagesDAO');
var osDAO = require(process.cwd() + '/dao/osDAO');
var menusDAO = require(process.cwd() + '/dao/menusDAO');
var situationsDAO = require(process.cwd() + '/dao/situationsDAO');
var situationDetailsDAO = require(process.cwd() + '/dao/situationDetailsDAO');
var logsDAO = require(process.cwd() + '/dao/logsDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var render = require("./_render");
var checkTimeEr = 0;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// メニュー項目の追加
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.add = async function (req, res, next) {
    debug("add");

    try {

        var formPostData = req.body;

        var response = await menusDAO.add(formPostData);

        logsDAO.add({
            time: moment().format("YYYY-MM-DD HH:mm:ss"),
            user: req.user.name,
            object: "menus-" + response.id,
            type: "add",
            detail: "メニュー項目(" + formPostData.category + "/" + formPostData.situationId + ")を追加しました"
        }).catch(err => maUtil.dumpError(err))

        response.message = vsprintf("メニューを追加しました(%s)", [response.id]);

        render(req, res, next, {
            message: {
                text: response.message,
            },
            error: response.error,
        });

        debug("add finished");

    } catch (e) {
        debug("add err %0", e);
    }


}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// メニュー項目の編集
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.edit = async function (req, res, next) {
    debug("edit");

    var checkMenus = await menusDAO.fetch();
    checkMenus.forEach(function (menus, i) {
        if (req.params.id == menus.id) {
            if (menus.timestamps.updateErr == req.body.updateErr) {
                checkTimeEr = 1;
            } else {
                checkTimeEr = 0;
            }
        }
    });
    try {

        var formPostData = req.body;
        var id = req.params.id;
        
        if (checkTimeEr === 1) {
            var response = await menusDAO.update(id, formPostData);

            logsDAO.add({
                time: moment().format("YYYY-MM-DD HH:mm:ss"),
                user: req.user.name,
                object: "menus-" + response.id,
                type: "edit",
                detail: "メニュー項目(" + formPostData.category + "/" + formPostData.situationId + ")を編集しました"
            }).catch(err => maUtil.dumpError(err))

            render(req, res, next, {
                message: {
                    text: response.message,
                },
                error: response.error,
            });
        } else {
            render(req, res, next, {
                message: {
                    text: "他の画面及び人に更新されているため、保存できません",
                },
            });
        }

        debug("edit finished");

    } catch (e) {
        debug("edit err %0", e);
    }

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// メニュー項目の削除
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.remove = async function (req, res, next) {
    debug("remove");

    try {

        var id = req.params.id;

        var response = await menusDAO.remove(id);

        logsDAO.add({
            time: moment().format("YYYY-MM-DD HH:mm:ss"),
            user: req.user.name,
            object: "menus-" + response.id,
            type: "remove",
            detail: "メニュー項目(" + response.id + ")を削除しました"
        }).catch(err => maUtil.dumpError(err))

        render(req, res, next, {
            message: {
                text: response.message,
            },
            error: response.error,
        });

        debug("remove finished");

    } catch (e) {
        debug("remove err %0", e);
    }

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 並び順保存
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.savePosition = async function (req, res, next) {
    debug("savePosition");

    try {

        var positionList = req.body;

        var response = await menusDAO.savePosition(positionList);
        logsDAO.add({
            time: moment().format("YYYY-MM-DD HH:mm:ss"),
            user: req.user.name,
            object: "menus",
            type: "save position",
            detail: "メニュー項目(" + response.join() + ")の並び順を変更しました"
        }).catch(err => maUtil.dumpError(err))

        res.json({code: 200})

        debug("savePosition finished");

    } catch (e) {
        debug("savePosition err %0", e);
    }

}
