////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var moment = require('moment-timezone');
moment.tz.setDefault("Asia/Tokyo");
var vsprintf = require("sprintf-js").vsprintf;
var debug = require('debug')('om/pickups/apiController');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var maUtil = require(process.cwd() + '/util//maUtil');
var cleaner = require(process.cwd() + '/util/cleaner');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var languagesDAO = require(process.cwd() + '/dao/languagesDAO');
var osDAO = require(process.cwd() + '/dao/osDAO');
var appDAO = require(process.cwd() + '/dao/appDAO');
var pickupsDAO = require(process.cwd() + '/dao/pickupsDAO');
var logsDAO = require(process.cwd() + '/dao/logsDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var render = require("./_render");
var checkTimeEr = 0;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ピックアップ枠の追加
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.add = async function (req, res, next) {
    debug("add");

    try {

        var formPostData = req.body;

        var response = await pickupsDAO.add(formPostData);

        logsDAO.add({
            time: moment().format("YYYY-MM-DD HH:mm:ss"),
            user: req.user.name,
            object: "pickups-" + response.id,
            type: "add",
            detail: "ピックアップ枠(" + formPostData.name + ")を追加しました"
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
// ピックアップ枠の編集
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.edit = async function (req, res, next) {
    debug("edit");
    var checkPickups = await pickupsDAO.fetch();

    checkPickups.forEach(function (pickups, i) {
        if (req.params.id == pickups.id) {
            if (pickups.timestamps.updateErr == req.body.updateErr) {
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
            var response = await pickupsDAO.update(id, formPostData);

            logsDAO.add({
                time: moment().format("YYYY-MM-DD HH:mm:ss"),
                user: req.user.name,
                object: "pickups-" + response.id,
                type: "edit",
                detail: "ピックアップ枠(" + formPostData.name + ")を編集しました"
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
// ピックアップ枠の削除
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.remove = async function (req, res, next) {
    debug("remove");

    try {

        var id = req.params.id;

        var response = await pickupsDAO.remove(id);

        logsDAO.add({
            time: moment().format("YYYY-MM-DD HH:mm:ss"),
            user: req.user.name,
            object: "pickups-" + response.id,
            type: "remove",
            detail: "ピックアップ枠(" + response.id + ")を削除しました"
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

        var response = await pickupsDAO.savePosition(positionList);

        logsDAO.add({
            time: moment().format("YYYY-MM-DD HH:mm:ss"),
            user: req.user.name,
            object: "menus",
            type: "save position",
            detail: "ピックアップ枠(" + response.id + ")の並び順を変更しました"
        }).catch(err => maUtil.dumpError(err))

        res.json({code: 200})

        debug("savePosition finished");

    } catch (e) {
        debug("savePosition err %0", e);
    }

}
