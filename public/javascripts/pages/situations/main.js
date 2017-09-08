////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
require("../../_includes/common.js");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var form = require("../../_includes/form.js");
var dataAccess = require("../../_includes/dataAccess.js");
var commonRender = require("../../_includes/render.js");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MODULES
var enviromentSelector = require("../../_includes/modules/enviromentSelector.js");
var formEnviromentSelector = require("../../_includes/modules/formEnviromentSelector.js");
var recycleUploader = require("../../_includes/modules/recycleUploader.js");
var sceneSetEditor = require("../../_includes/modules/sceneSetEditor.js");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var render = require("./_render.js");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

$(function () {

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 一覧画面
    /////////////////////////////////////////////////////////////////////////////////////////////////////////

    // ---------------------------------------------------------------------------------
    // リスト描画
    // ---------------------------------------------------------------------------------

    // 一覧表示
    function showList() {

        var data = onidenAdmin.data;

        var template = $.templates("#list");
        var html = template.render({
            languages: data.languages,
            os: data.os,
            situations: data.allSituations
        });
        $(".situations .list table").remove(".item").append(html);

    }

    showList();

    // ---------------------------------------------------------------------------------
    // 追加・編集ボタン用関数
    // ---------------------------------------------------------------------------------

    var afterEditRender = function ($pane, item) {
        var d = $.Deferred();

        // ---------------------------------------------------------------------------------

        var queues = []
        var editModuleInstances = []

        $(".situation", $pane).each(function (i) {
            var d = $.Deferred();

            editModuleInstances[i] = {}

            // 1 シーンセットエディタ設定
            function setupSceneSetEditor() {
                var d = $.Deferred();

                var $sceneSetEditor = $(".sceneSetEditor", this);
                var langCode = $sceneSetEditor.attr("data-lang-code");
                var osCode = $sceneSetEditor.attr("data-os-code");

                var options = {
                    $body: $sceneSetEditor,
                    code: item.code,
                    currentItemDetail: item.details[langCode][osCode],
                }

                // DBからのJSONデータがあれば事前にパース
                if (item.details[langCode][osCode].sceneSets) {
                    options.sceneSets = JSON.parse(item.details[langCode][osCode].sceneSets);
                }

                var _sceneSetEditor = sceneSetEditor();
                _sceneSetEditor.init(options);

                editModuleInstances[i].sceneSetEditor = _sceneSetEditor;

                d.resolve();
            }

            // ストアサムネイル画像用アップローダー設定
            function setupStoreThumbnailUploader() {
                var d = $.Deferred();

                var $uploader = $(".storeThumbnailUploader", this);
                var storeThumbnailUploader = recycleUploader();

                storeThumbnailUploader.init({
                    type: "image",
                    api: "/situations/images/storeThumbnails/" + item.code + "/",
                    $appendTo: $(".upload", $uploader),
                    $input: $(".field .input input", $uploader),
                });

                editModuleInstances[i].storeThumbnailUploader = storeThumbnailUploader;

                d.resolve();
            }

            // スペシャルボタン背景用アップローダー設定
            function setupSpecialButtonUploader() {
                var d = $.Deferred();

                var $uploader = $(".specialButtonUploader", this);
                var specialButtonUploader = recycleUploader();

                specialButtonUploader.init({
                    type: "image",
                    api: "/situations/images/specialButtons/",
                    $appendTo: $(".upload", $uploader),
                    $input: $(".field .input input", $uploader),
                });

                editModuleInstances[i].specialButtonUploader = specialButtonUploader;

                d.resolve();
            }

            var editModuleQueues = [
                $.proxy(setupSceneSetEditor, this)(),
                $.proxy(setupStoreThumbnailUploader, this)(),
                $.proxy(setupSpecialButtonUploader, this)(),
            ]

            $.when.apply($, editModuleQueues)
                    .done(function () {
                        d.resolve();
                    });

            queues.push(d);

        });

        // ---------------------------------------------------------------------------------

        // 言語OSセレクタ設定
        formEnviromentSelector.init({
            $body: $(".formEnviromentSelector", $pane),
            $content: $(".situation", $pane),
        })

        // コードネームの重複確認とコードネームによるAPIURL更新
        // DBのコードを拾わず、シチュエーションの素材フォルダ内にコードが存在するかで判定中
        $("input.actionUpdateCode", $pane).on("change", function () {

            function checkCodeExists(code) {
                var d = $.Deferred();

                $.ajax({
                    url: "/situations/checkCodeExists/" + code,
                    cache: false
                }).then(function (result) {
                    d.resolve(result.isExists ? true : false);
                });

                return d.promise();

            }

            var $message = $(this).next(".message");
            var newCode = $(this).val();

            if ($(this)[0].validity.valid === false) {
                $message.removeClass("success").addClass("error").html("正しいコードネームを入力してください");
                $(this).removeClass("success").addClass("error");
                return false
            }

            checkCodeExists(newCode)
                    .then($.proxy(function (isExists) {

                        if (isExists) {
                            // エラー表示
                            $message.removeClass("success").addClass("error").html("「" + newCode + "」は既に素材フォルダが存在します。利用されているコードネームの可能性が高いです。確認の上変更を行ってください。");
                            $(this).removeClass("success").addClass("error");
                            return false;
                        }

                        // 成功メッセージ表示
                        $message.removeClass("error").addClass("success").html("利用可能");
                        $(this).removeClass("error").addClass("success");

                        // アップローダーAPIURL更新
                        $.each(editModuleInstances, function (index, editModuleInstance) {
                            editModuleInstance.sceneSetEditor.setAPIUrlCode(newCode);
                            editModuleInstance.storeThumbnailUploader.setAPIUrl("/situations/images/storeThumbnails/" + newCode + "/");
                        })

                    }, this));

        });

        // 関連項目の表示切替
        $(".actionShowYoutubeRelated").on("click", function () {
            $(".chainYoutubeRelated").removeClass("hidden");
            $(".chainWebRelated").addClass("hidden");
        })
        $(".actionShowWebRelated").on("click", function () {
            $(".chainYoutubeRelated").addClass("hidden");
            $(".chainWebRelated").removeClass("hidden");
        })
        $(".actionHideInterstitialTypeRelated").on("click", function () {
            $(".chainYoutubeRelated").addClass("hidden");
            $(".chainWebRelated").addClass("hidden");
        })

        $(".actionShowStoreRelated").on("click", function () {
            $(".chainStoreRelated").removeClass("hidden");
        })
        $(".actionHideStoreRelated").on("click", function () {
            $(".chainStoreRelated").addClass("hidden");
        })

        // 言語/OSすべての値同期
        $("body").on("change", ".sync-all", function (e) {
            console.log("all sync!");
            var fieldName = $(this).attr("data-sync-fieldname");
            var fieldType = this.type ? this.type : this.nodeName.toLowerCase();

            switch (fieldType) {

                case "text":
                case "textarea":
                case "date":
                case "time":
                    $("[data-sync-fieldname=" + fieldName + "]", $pane).val($(this).val());
                    break;

                case "checkbox":
                case "radio":
                    $("[data-sync-fieldname=" + fieldName + "]", $pane).prop("checked", $(this).prop("checked"));
                    break;

            }

            // アップローダーの表示更新をたたきたい TODO

        });

        // OS間の値同期
        $("body").on("change", ".sync-os", function (e) {
            var fieldName = $(this).attr("data-sync-fieldname");
            var languageCode = $(this).attr("data-language-code");

            var fieldType = this.type ? this.type : this.nodeName.toLowerCase();

            switch (fieldType) {

                case "text":
                case "textarea":
                case "date":
                case "time":
                case "select-one":
                    $("[data-sync-fieldname=" + fieldName + "][data-language-code=" + languageCode + "]", $pane).val($(this).val());
                    break;

                case "checkbox":
                case "radio":
                    $("[data-sync-fieldname=" + fieldName + "][data-language-code=" + languageCode + "]", $pane).prop("checked", $(this).prop("checked"));
                    break;



            }

            // アップローダーの表示更新をたたきたい TODO

        });

        Promise.all(queues)
                .then(function () {
                    d.resolve();
                })


        return d.promise();

    }

    // ---------------------------------------------------------------------------------
    // 追加ボタン
    // ---------------------------------------------------------------------------------

    var $addButton = $(".actionOpenAddPane");

    $addButton.on("click", function () {

        // 空の言語/OS構造体を作成(jsrenderのundefinedエラー対策)
        var detailsSkelton = {}

        onidenAdmin.data.languages.forEach(function (language) {
            detailsSkelton[language.code] = {}
            onidenAdmin.data.os.forEach(function (os) {
                detailsSkelton[language.code][os.code] = {}
            });
        })

        // 表示
        commonRender.renderEditPane({
            $pane: $(".editPane"),
            templateSelector: "#edit",
            locals: {
                languages: onidenAdmin.data.languages,
                os: onidenAdmin.data.os,
                item: {
                    details: detailsSkelton,
                    timestamps: 1
                },
                actionName: "追加", // タイトル書き換え用
                saveActionName: "追加", // ボタン書き換え用
                formActionURL: "/situations", // 送信先の修正
                formMethod: "POST", // メソッドの修正
            },
            afterEditRender: afterEditRender
        });

    });

    // ---------------------------------------------------------------------------------
    // 編集ボタン
    // ---------------------------------------------------------------------------------

    var editButton = ".list .item";

    $("body").on("click", editButton, function () {

        var $item = $(this);
        var itemId = parseInt($item.attr("data-id"));

        var errorTime = $(".messageTitle").text();
        var dpErr = 1;
        if (errorTime === '他の画面及び人に更新されているため、保存できません') {
            dpErr = 1;
        } else {
            dpErr = 0;
        }

        // 対象のシチュエーションデータ取得
        var item = dataAccess.getSingleData({
            data: onidenAdmin.data.allSituations,
            id: itemId,
        });
        // 表示
        commonRender.renderEditPane({
            $pane: $(".editPane"),
            templateSelector: "#edit",
            locals: {
                id: itemId,
                languages: onidenAdmin.data.languages,
                os: onidenAdmin.data.os,
                item: item,
                actionName: "編集", // タイトル書き換え用
                saveActionName: "保存", // ボタン書き換え用
                formActionURL: "/situations/" + itemId, // 送信先の修正
                formMethod: "PUT", // メソッドの修正
                dpErr: dpErr
            },
            afterEditRender: afterEditRender
        });

    });

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 編集画面
    /////////////////////////////////////////////////////////////////////////////////////////////////////////

    var editSubmitButton = ".editPane .actionSave";

    $("body").on("click", editSubmitButton, function () {

        var $form = $(".editPane form#editForm");

        form.formSubmit({
            $form: $form,
            confirmMessage: "本当に保存しますか？"
        });

    });

    // ---------------------------------------------------------------------------------
    // 削除ボタン
    // ---------------------------------------------------------------------------------

    var deleteButton = ".editPane .actionDelete";

    $("body").on("click", deleteButton, function () {
        var id = parseInt($(this).attr("data-id"));
        var api = "/situations/" + id;

        form.deleteSubmit(api);

    });
    // ---------------------------------------------------------------------------------
    var url = window.location.href;
    var idEr = url.split('/situations/');
    var errorTime = $(".messageTitle").text();
    if (idEr != '/' && errorTime === '他の画面及び人に更新されているため、保存できません') {
        $('.list table tr.item.disabled').each(function () {
            if ($(this).attr('data-id') == idEr[1]) {
                $(this).click();
            }
        });
    }
    if ($('.mesError').attr('data-id') == 1) {
        $('.mesError').css({"color": "red", "display": "block"});
    } else {
        $('.mesError').css({"color": "red", "display": "none"});

    }

});
