////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var moment = require('moment-timezone');
moment.tz.setDefault("Asia/Tokyo");
var vsprintf = require("sprintf-js").vsprintf;
var debug = require('debug')('om/situations/apiController');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var maUtil = require(process.cwd() + '/util/maUtil');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var languagesDAO = require(process.cwd() + '/dao/languagesDAO');
var osDAO = require(process.cwd() + '/dao/osDAO');
var appDAO = require(process.cwd() + '/dao/appDAO');
var situationsDAO = require(process.cwd() + '/dao/situationsDAO');
var situationDetailsDAO = require(process.cwd() + '/dao/situationDetailsDAO');
var logsDAO = require(process.cwd() + '/dao/logsDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var checkTimeEr = 0;
var render = require("./_render");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getSanitizedPostStruct(req) {
    return {
        situation: {
            code: req.body.code,
            note: req.body.note,
            is_payment: req.body.is_payment,
            version: req.body.version,
            updateErr: req.body.updateErr
        },
        situationDetails: req.body.situationDetails
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// シチュエーション追加
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.add = async function (req, res, next) {
    debug("add");

    try {

        var formPostData = getSanitizedPostStruct(req);

        // シチュエーションを追加
        var response = await situationsDAO.add(formPostData.situation);

        // シチュエーション詳細を追加
        for (let situationDetail of formPostData.situationDetails) {
            situationDetail.situation_id = response.id; //シチュエーションIDを更新
            await situationDetailsDAO.add(situationDetail);
        }

        logsDAO.add({
            time: moment().format("YYYY-MM-DD HH:mm:ss"),
            user: req.user.name,
            object: "situations-" + response.id,
            type: "add",
            detail: "シチュエーション(" + formPostData.situation.code + ")を追加しました"
        }).catch(err => maUtil.dumpError(err))

        render(req, res, next, {
            message: {
                text: "シチュエーションを追加しました",
            }
        });

        debug("add finished");

    } catch (e) {
        debug("add err %0", e);
    }

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// シチュエーション編集
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.edit = async function (req, res, next) {
    debug("edit");
    var checkSituations = await situationsDAO.fetch();

    checkSituations.forEach(function (situation, i) {
        if (req.params.id == situation.id) {
            if (situation.timestamps.updateErr == getSanitizedPostStruct(req).situation.updateErr) {
                checkTimeEr = 1;
            } else {
                checkTimeEr = 0;
            }
        }
    });
    try {

        var id = parseInt(req.params.id);
        var formPostData = getSanitizedPostStruct(req);

        if (checkTimeEr === 1) {
            // シチュエーションを更新
            var response = await situationsDAO.update(id, formPostData.situation);

            // シチュエーション詳細を更新
            for (let situationDetail of formPostData.situationDetails) {
                var id = parseInt(situationDetail.id);
                await situationDetailsDAO.update(id, situationDetail);
            }

            logsDAO.add({
                time: moment().format("YYYY-MM-DD HH:mm:ss"),
                user: req.user.name,
                object: "situations-" + id,
                type: "edit",
                detail: "シチュエーション(" + formPostData.situation.code + ")を更新しました"
            }).catch(err => maUtil.dumpError(err))

            render(req, res, next, {
                message: {
                    text: "シチュエーションを編集しました",
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
// シチュエーション削除
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.remove = async function (req, res, next) {
    debug("remove");

    try {

        var id = parseInt(req.params.id);
        var languages = await languagesDAO.fetch();
        var os = await osDAO.fetch();
        var situation = await situationsDAO.fetch({where: {id: id}}).then(array => {
            return array[0];
        });

        if (!situation) {
            throw "シチュエーションがありません";
        } // シチュエーションがない場合は終了

        debug("situation", situation);
        debug("situationCode", situation.code);

        // 削除ファイル一覧準備


        if (situation.code) { // シチュエーションコードがない場合の全体削除対策

            debug("inside")

            var removeTargets = []

            // シチュエーション固有素材ディレクトリ追加(共有ディレクトリのファイルは削除されません)
            removeTargets.push({
                type: "directory",
                path: vsprintf(config.get('app.paths.situations.source._base').path, [situation.code]),
            })

            debug("removeTargets", removeTargets);

            // 一覧にあるファイルを削除
            for (let target of removeTargets) {

                debug("forloop target", target);
                if (target.type == "file") {
                    await maUtil.removeFile(process.cwd() + target.path);
                } else if (target.type == "directory") {
                    await maUtil.removeDirectory(process.cwd() + target.path);
                }

            }

        }

        // DBから削除
        await situationsDAO.remove(id);
        await situationDetailsDAO.remove(id)

        logsDAO.add({
            time: moment().format("YYYY-MM-DD HH:mm:ss"),
            user: req.user.name,
            object: "situations-" + id,
            type: "add",
            detail: "シチュエーション(" + id + ")を削除しました"
        }).catch(err => maUtil.dumpError(err))

        render(req, res, next, {
            message: {
                text: "シチュエーションの削除に成功しました"
            }
        });

        debug("remove finished");

    } catch (e) {
        debug("remove err %0", e);

        logsDAO.add({
            time: moment().format("YYYY-MM-DD HH:mm:ss"),
            user: req.user.name,
            object: "situations-" + id,
            type: "add",
            detail: "シチュエーション(" + id + ")を削除に失敗しました"
        }).catch(err => maUtil.dumpError(err))

        render(req, res, next, {
            message: {
                text: "シチュエーションの削除に失敗しました"
            },
            error: e
        });

    }

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// シチュエーションコード重複確認
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.checkCodeExists = async function (req, res, next) {
    debug("checkCodeExists");

    try {

        var code = req.params.code;
        var apiUrl = req.baseUrl + req.path;
        var sourcePath = maUtil.getSourcePathByAPI(apiUrl);
        sourcePath = vsprintf(sourcePath.path, [code]);

        res.json({
            isExists: await maUtil.getDirectoryExists(process.cwd() + sourcePath)
        });

        debug("checkCodeExists finished");

    } catch (e) {
        debug("checkCodeExists err %0", e);
    }

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
