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
                $container: $(".dataList.enabledMenuBackgrounds"),
                $appendTo: $(".dataList.enabledMenuBackgrounds"),
                templateSelector: "#list",
                listData: onidenAdmin.data.enabledEnvedMenuBackgrounds,
                render: commonRender.renderList,
            },
            {
                $container: $(".dataList.disabledMenuBackgrounds"),
                $appendTo: $(".dataList.disabledMenuBackgrounds"),
                templateSelector: "#list",
                listData: onidenAdmin.data.disabledEnvedMenuBackgrounds,
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

        // 背景画像用アップローダー設定
        var backgroundUploader = recycleUploader();
        var $uploader = $(".backgroundUploader", $pane);

        queue.push(backgroundUploader.init({
            api: "/menuBackgrounds/images/",
            $appendTo: $(".upload", $uploader),
            $input: $(".field .input input", $uploader),
        }));

        Promise.all(queue)
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
                formActionURL: "/menuBackgrounds", // 送信先の修正
                formMethod: "POST" // メソッドの修正
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
            data: onidenAdmin.data.allEnvedMenuBackgrounds,
            id: itemId,
            osId: currentOSId,
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
                formActionURL: "/menuBackgrounds/" + itemId, // 送信先の修正
                formMethod: "PUT", // メソッドの修正
                dpErr: dpErr
            },
            afterEditRender: afterEditRender
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
    // 削除ボタン
    // ---------------------------------------------------------------------------------

    var deleteButton = ".editPane .actionDelete";

    $("body").on("click", deleteButton, function () {
        var id = parseInt($(this).attr("data-id"));
        var api = "/menuBackgrounds/" + id;

        form.deleteSubmit(api);

    });

// ---------------------------------------------------------------------------------
    var idEr = window.location.href.slice(-1);
    var errorTime = $(".messageTitle").text();
    if (idEr != '/' && errorTime === '他の画面及び人に更新されているため、保存できません') {
        $('.list table tr.item').each(function () {
            console.log($(this).attr('data-id'));
            if ($(this).attr('data-id') == idEr) {
                $(this).click();
            }
        });
    }
    if ($('.mesError').attr('data-id') == 1) {
        $('.mesError').css({"color": "red", "display": "block"});
    } else {
        $('.mesError').css({"color": "red", "display": "none"});

    }
})
