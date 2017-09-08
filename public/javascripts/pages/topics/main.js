////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
require("../../_includes/common.js");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var form = require("../../_includes/form.js");
var dataAccess = require("../../_includes/dataAccess.js");
var commonRender = require("../../_includes/render.js");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MODULES
var enviromentSelector = require("../../_includes/modules/enviromentSelector.js");
var recycleUploader = require("../../_includes/modules/recycleUploader.js");
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

    enviromentSelector.init({
        $enviromentSelector: $(".enviromentSelector"),
        renderTargets: [
            {
                $container: $(".dataList.topics"),
                $appendTo: $(".dataList.topics"),
                templateSelector: "#list",
                listData: onidenAdmin.data.allEnvedTopics,
                render: commonRender.renderList,
            }
        ]
    });

    // ---------------------------------------------------------------------------------
    // 追加・編集ボタン用関数
    // ---------------------------------------------------------------------------------

    var afterEditRender = function ($pane) {
        var d = $.Deferred();

        var queue = []

        // 再利用アップローダー利用
        var imageUploader = recycleUploader();
        var $uploader = $(".imageUploader", $pane);

        queue.push(imageUploader.init({
            type: "image",
            api: "/topics/images/",
            $appendTo: $(".upload", $uploader),
            $input: $(".field .input input", $uploader),
        }));

        Promise.all(queue)
                .then(function () {
                    d.resolve();
                });

        return d.promise();

    }

    // ---------------------------------------------------------------------------------
    // 追加ボタン
    // ---------------------------------------------------------------------------------

    var $addButton = $(".actionOpenAddPane");

    $addButton.on("click", function () {

        // 表示
        commonRender.renderEditPane({
            $pane: $(".editPane"),
            templateSelector: "#edit",
            locals: {
                languages: onidenAdmin.data.languages,
                os: onidenAdmin.data.os,
                item: {
                    languageId: enviromentSelector.getEnvLanguageId(),
                    osId: enviromentSelector.getEnvOSId(),
                    timestamps: 1
                },
                actionName: "追加", // タイトル書き換え用
                saveActionName: "追加", // ボタン書き換え用
                formActionURL: "/topics", // 送信先の修正
                formMethod: "POST" // メソッドの修正
            },
            afterEditRender: afterEditRender
        });

    });

    // ---------------------------------------------------------------------------------
    // 編集ボタン
    // ---------------------------------------------------------------------------------

    var editButton = ".dataList .actionEdit";

    $("body").on("click", editButton, function () {

        var $item = $(this).parents(".topicItem");
        var itemId = parseInt($item.attr("data-id"));
        var currentOSId = parseInt($item.attr("data-osId"));
        var currentLanguageId = parseInt($item.attr("data-languageId"));

        var errorTime = $(".messageTitle").text();
        var dpErr = 1;
        if (errorTime === '他の画面及び人に更新されているため、保存できません') {
            dpErr = 1;
        } else {
            dpErr = 0;
        }

        var item = dataAccess.getSingleData({
            data: onidenAdmin.data.allEnvedTopics,
            id: itemId,
            osId: currentOSId, // 共通の場合はiOSのほうから編集用データとして参照(両方にDBからは出力している)
            languageId: currentLanguageId
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
                formActionURL: "/topics/" + itemId, // 送信先の修正
                formMethod: "PUT", // メソッドの修正
                dpErr: dpErr
            },
            afterEditRender: afterEditRender
        });

    });

    // ---------------------------------------------------------------------------------
    // 削除ボタン
    // ---------------------------------------------------------------------------------

    var deleteButton = ".dataList .actionDelete";

    $("body").on("click", deleteButton, function () {

        var id = parseInt($(this).attr("data-id"));
        var api = "/topics/" + id;

        form.deleteSubmit(api);

    });

    // ---------------------------------------------------------------------------------
    // フッターHTML保存ボタン
    // ---------------------------------------------------------------------------------

    var $saveButton = $(".actionSaveFooterHTML");

    $saveButton.on("click", function () {

        var $form = $(this).parents("form");

        form.formSubmit({
            $form: $form,
            confirmMessage: "本当に保存しますか？"
        });

    });


    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 編集画面
    /////////////////////////////////////////////////////////////////////////////////////////////////////////

    // ---------------------------------------------------------------------------------
    // 保存ボタン
    // ---------------------------------------------------------------------------------

    var editSubmitButton = ".editPane .actionSave";

    $("body").on("click", editSubmitButton, function () {

        var $form = $(".editPane form#editForm");

        form.formSubmit({
            $form: $form,
            confirmMessage: "本当に保存しますか？"
        });

    });
    // ---------------------------------------------------------------------------------
    var url = window.location.href;
    var idEr = url.split('/topics/');
    var errorTime = $(".messageTitle").text();
    if (idEr != '/' && errorTime === '他の画面及び人に更新されているため、保存できません') {
        $('.dataList div.button.actionDelete').each(function () {
            if ($(this).attr('data-id') == idEr[1]) {
                $(this).next().click();
            }
        });
    }
    if ($('.mesError').attr('data-id') == 1) {
        $('.mesError').css({"color": "red", "display": "block"});
    } else {
        $('.mesError').css({"color": "red", "display": "none"});

    }

});
