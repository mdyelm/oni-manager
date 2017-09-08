////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var moment = require('moment-timezone');
moment.tz.setDefault("Asia/Tokyo");
var vsprintf = require("sprintf-js").vsprintf;
var debug = require('debug')('om/topics/apiController');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var maUtil = require(process.cwd() + '/util//maUtil');
var cleaner = require(process.cwd() + '/util/cleaner');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var appDAO = require(process.cwd() + '/dao/appDAO');
var languagesDAO = require(process.cwd() + '/dao/languagesDAO');
var osDAO = require(process.cwd() + '/dao/osDAO');
var topicsDAO = require(process.cwd() + '/dao/topicsDAO');
var logsDAO = require(process.cwd() + '/dao/logsDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var render = require("./_render");
var checkTimeEr = 0;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// トピック追加
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.add = async function (req, res, next) {
    debug("add");

    try {

        var formPostData = req.body;

        var response = await topicsDAO.add(formPostData);

        logsDAO.add({
            time: moment().format("YYYY-MM-DD HH:mm:ss"),
            user: req.user.name,
            object: "topics-" + response.id,
            type: "add",
            detail: "お知らせ(" + response.id + ")を追加しました"
        }).catch(err => maUtil.dumpError(err))

        render(req, res, next, {
            message: {
                text: response.message,
            }
        });

        debug("add finished");
    } catch (e) {
        debug("add err %0", e);
    }

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// トピック編集
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.edit = async function (req, res, next) {
    debug("edit");
    var checkTopics = await topicsDAO.fetch();
    checkTopics.forEach(function (toppics, i) {
        if (req.params.id == toppics.id) {
            if (toppics.timestamps.updateErr == req.body.updateErr) {
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
            var response = await topicsDAO.update(id, formPostData);

            logsDAO.add({
                time: moment().format("YYYY-MM-DD HH:mm:ss"),
                user: req.user.name,
                object: "topics-" + id,
                type: "edit",
                detail: "お知らせ(" + id + ")を編集しました"
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
        debug("edit err %0", e);
    }



}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// トピック削除
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.remove = async function (req, res, next) {
    debug("remove");

    try {

        var id = req.params.id;

        var response = await topicsDAO.remove(id);

        logsDAO.add({
            time: moment().format("YYYY-MM-DD HH:mm:ss"),
            user: req.user.name,
            object: "topics-" + id,
            type: "remove",
            detail: "お知らせ(" + id + ")を削除しました"
        }).catch(err => maUtil.dumpError(err))

        render(req, res, next, {
            message: {
                text: response.message,
            },
            error: response.error
        });

        debug("remove finished");

    } catch (e) {
        debug("remove err %0", e);
    }

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 不要画像を削除
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.cleanupImage = async function (req, res, next) {
    debug("cleanupImage");

    try {

        var directory = process.cwd() + config.get("app.paths.topics.source") + "images/"; // CAREFUL
        var existFiles = [];
        var deletedFiles = [];

        var useFiles = await topicsDAO.fetchUseImages(); // DBで使われている画像名一覧を取得する
        var existFiles = await maUtil.getFileList(directory); // フォルダにあるファイル名前一覧を取得する

        var deletedFiles = await cleaner.clean({// 不要ファイルのチェックと削除
            directory: directory,
            useFiles: useFiles,
            existFiles: existFiles
        }).then(list => {
            return list.length ? list : ["不要なファイルがありませんでした"];
        })

        render(req, res, next, {
            message: {
                text: "不要画像の削除を行いました",
            },
            error: null,
            deletedFiles: deletedFiles
        });

        debug("cleanupImage finished");

    } catch (e) {
        debug("cleanupImage err %0", e);
    }

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
