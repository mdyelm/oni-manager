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
                $container: $(".dataList.enabledPickups"),
                $appendTo: $(".dataList.enabledPickups"),
                templateSelector: "#list",
                listData: onidenAdmin.data.enabledEnvedPickups,
                render: commonRender.renderList,
            },
            {
                $container: $(".dataList.disabledPickups"),
                $appendTo: $(".dataList.disabledPickups"),
                templateSelector: "#list",
                listData: onidenAdmin.data.disabledEnvedPickups,
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

        // 通常バナーアップローダー設定
        var bannerUploader = recycleUploader();
        var $uploader = $(".bannerUploader", $pane);

        queue.push(bannerUploader.init({
            api: "/pickups/images/banner/",
            $appendTo: $(".upload", $uploader),
            $input: $(".field .input input", $uploader),
        }));

        // ネイティブアド背景画像アップローダー設定
        var nativeAdBackgroundUploader = recycleUploader();
        var $uploader = $(".nativeAdBackgroundUploader", $pane);

        queue.push(nativeAdBackgroundUploader.init({
            api: "/pickups/images/nativeAdBackground/",
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
                nativeAdEffects: onidenAdmin.data.nativeAdEffects,
                item: {
                    languageId: enviromentSelector.getEnvLanguageId(),
                    osId: enviromentSelector.getEnvOSId(),
                    nativeAdSettings: {
                        background: {},
                        icon: {},
                        headline: {},
                        body: {},
                        action: {}
                    },
                    timestamps: 1
                },
                actionName: "追加", // タイトル書き換え用
                saveActionName: "追加", // ボタン書き換え用
                formActionURL: "/pickups", // 送信先の修正
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
        // 対象のピックアップ枠データ取得
        var item = dataAccess.getSingleData({
            data: onidenAdmin.data.allEnvedPickups,
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
                nativeAdEffects: onidenAdmin.data.nativeAdEffects,
                item: item,
                actionName: "編集", // タイトル書き換え用
                saveActionName: "保存", // ボタン書き換え用
                formActionURL: "/pickups/" + itemId, // 送信先の修正
                formMethod: "PUT", // メソッドの修正
                dpErr: dpErr
            },
            afterEditRender: afterEditRender
        });

    });

    // ---------------------------------------------------------------------------------
    // 並び替えボタン
    // ---------------------------------------------------------------------------------

    // up

    var upButton = ".list .item .actionPositionUp";

    $("body").on("click", upButton, function (e) {
        e.stopPropagation();

        var $item = $(this).parents(".item");
        var $prevItem = $item.prev();
        var isSwitchable = ($prevItem.size() != 0);

        if (isSwitchable) {
            var currentPosition = parseInt($item.attr("data-position"));
            $item.attr("data-position", currentPosition - 1);
            $prevItem.attr("data-position", currentPosition);
            $item.insertBefore($prevItem);
        }

        // 並び順保存ボタン表示
        var $section = $item.parents("section");
        $(".actionSavePosition", $section).removeClass("hidden");

    });

    // down

    var downButton = ".list .item .actionPositionDown";

    $("body").on("click", downButton, function (e) {
        e.stopPropagation();

        var $item = $(this).parents(".item");
        var $nextItem = $item.next();
        var isSwitchable = ($nextItem.size() != 0);

        if (isSwitchable) {
            var currentPosition = parseInt($item.attr("data-position"));
            $item.attr("data-position", currentPosition + 1);
            $nextItem.attr("data-position", currentPosition);
            $item.insertAfter($nextItem);
        }

        // 並び順保存ボタン表示
        var $section = $item.parents("section");
        $(".actionSavePosition", $section).removeClass("hidden");

    });

    // ---------------------------------------------------------------------------------
    // 並び順保存ボタン
    // ---------------------------------------------------------------------------------

    var $savePositionButton = $(".actionSavePosition");

    $savePositionButton.on("click", function () {

        // 並び順取得
        var positionList = []
        var $section = $(this).parents("section");
        var $items = $(".item", $section);

        $.each($items, function () {
            positionList.push({
                id: $(this).attr("data-id"),
                position: $(this).attr("data-position")
            });
        });

        form.positionSave({
            api: "/pickups/position/save",
            positionList: positionList
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
        var api = "/pickups/" + id;

        form.deleteSubmit(api);

    });

    // ---------------------------------------------------------------------------------
    // 通常バナー / ネイティブアド設定表示切替
    // ---------------------------------------------------------------------------------

    $("body").on("change", "input[name=ad_type]", function () {
        switch ($(this).val()) {
            case "normal":
                $(".formGroupNormalAd").show();
                $(".formGroupNativeAd").hide();
                break;
            case "nativeAd":
                $(".formGroupNormalAd").hide();
                $(".formGroupNativeAd").show();
                break;
        }
    });
    // ---------------------------------------------------------------------------------
    var url = window.location.href;
    var idEr =  url.split('/pickups/');
    var errorTime = $(".messageTitle").text();
    if (idEr != '/' && errorTime === '他の画面及び人に更新されているため、保存できません') {
        $('.list li.item').each(function () {
            console.log(idEr[1]);
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

})
