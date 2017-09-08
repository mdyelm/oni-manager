////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var moment = require('moment-timezone');
moment.tz.setDefault("Asia/Tokyo");
var vsprintf = require("sprintf-js").vsprintf;
var debug = require('debug')('om/menuBackgrounds/apiController');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var maUtil = require(process.cwd() + '/util//maUtil');
var cleaner = require(process.cwd() + '/util/cleaner');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var languagesDAO = require(process.cwd() + '/dao/languagesDAO');
var osDAO = require(process.cwd() + '/dao/osDAO');
var appDAO = require(process.cwd() + '/dao/appDAO');
var menuBackgroundsDAO = require(process.cwd() + '/dao/menuBackgroundsDAO');
var logsDAO = require(process.cwd() + '/dao/logsDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var render = require("./_render");
var checkTimeEr = 0;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 背景画像の追加
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.add = async function (req, res, next) {
    debug("add");

    try {

        var formPostData = req.body;

        var response = await menuBackgroundsDAO.add(formPostData);

        logsDAO.add({
            time: moment().format("YYYY-MM-DD HH:mm:ss"),
            user: req.user.name,
            object: "menuBackgrounds-" + response.id,
            type: "add",
            detail: "メニュー背景(" + formPostData.name + ")を追加しました"
        }).catch(err => maUtil.dumpError(err))

        render(req, res, next, {
            message: {
                text: response.message,
            },
            error: response.error
        });

        debug("add finished");

    } catch (e) {
        debug("add err %0", e);
    }

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 背景画像の編集
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.edit = async function (req, res, next) {
    debug("edit");
    var checkMenuBackgrounds = await menuBackgroundsDAO.fetch();
    checkMenuBackgrounds.forEach(function (menuBackgrounds, i) {
        if (req.params.id == menuBackgrounds.id) {
            if (menuBackgrounds.timestamps.updateErr == req.body.updateErr) {
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
            var response = await menuBackgroundsDAO.update(id, formPostData);

            logsDAO.add({
                time: moment().format("YYYY-MM-DD HH:mm:ss"),
                user: req.user.name,
                object: "menuBackgrounds-" + response.id,
                type: "edit",
                detail: "メニュー背景(" + formPostData.name + ")を編集しました"
            }).catch(err => maUtil.dumpError(err))

            render(req, res, next, {
                message: {
                    text: response.message,
                },
                error: response.error
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
        debug("edit %0", e);
    }

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 背景画像の削除
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.remove = async function (req, res, next) {
    debug("remove");

    try {

        var id = req.params.id;

        var response = await menuBackgroundsDAO.remove(id);

        logsDAO.add({
            time: moment().format("YYYY-MM-DD HH:mm:ss"),
            user: req.user.name,
            object: "menuBackgrounds-" + response.id,
            type: "remove",
            detail: "メニュー背景(" + response.id + ")を削除しました"
        }).catch(err => maUtil.dumpError(err))

        render(req, res, next, {
            message: {
                text: response.message,
            },
            error: response.error
        });

    } catch (e) {
        debug("remove err %0", e);
    }

}
