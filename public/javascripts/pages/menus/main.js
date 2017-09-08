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
                $container: $(".dataList.enabledMenuList"),
                $appendTo: $(".dataList.enabledMenuList"),
                templateSelector: "#list",
                listData: onidenAdmin.data.enabledEnvedMenus,
                render: commonRender.renderList,
                additionalLocals: {
                    categories: onidenAdmin.data.categories,
                }
            },
            {
                $container: $(".dataList.disabledMenuList"),
                $appendTo: $(".dataList.disabledMenuList"),
                templateSelector: "#list_disabled",
                listData: onidenAdmin.data.disabledEnvedMenus,
                render: commonRender.renderList,
                additionalLocals: {
                    categories: onidenAdmin.data.categories,
                }
            }
        ]
    });

    // ---------------------------------------------------------------------------------
    // 追加・編集ボタン用関数
    // ---------------------------------------------------------------------------------

    var afterEditRender = function ($pane) {
        var d = $.Deferred();

        var queue = []

        // 背景アップローダー設定
        var menuButtonBackgroundUploader = recycleUploader();
        var $uploader = $(".backgroundUploader", $pane);

        queue.push(menuButtonBackgroundUploader.init({
            api: "/menus/images/buttonBackgrounds/",
            $appendTo: $(".upload", $uploader),
            $input: $(".field .input input", $uploader),
        }));

        // アイコンアップローダー設定
        var menuButtonIconUploader = recycleUploader();
        var $uploader = $(".iconUploader", $pane);

        queue.push(menuButtonIconUploader.init({
            api: "/menus/images/buttonIcons/",
            $appendTo: $(".upload", $uploader),
            $input: $(".field .input input", $uploader),
        }));

        // 関連項目の表示切替
        $(".actionShowCategoryRelated").on("click", function () {
            $(".chainCategoryRelated").removeClass("hidden");
            $(".chainTimezoneSuggestRelated").addClass("hidden");
        })
        $(".actionShowTimezoneSuggestRelated").on("click", function () {
            $(".chainCategoryRelated").addClass("hidden");
            $(".chainTimezoneSuggestRelated").removeClass("hidden");
        })

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

        var currentOSId = parseInt(enviromentSelector.getEnvOSId());
        var currentLanguageId = parseInt(enviromentSelector.getEnvLanguageId());

        // 言語/OSでフィルタしたシチュエーション詳細(シチュエーション基本情報付き)を取得
        var situationDetails = dataAccess.getListDataByEnv(
                currentLanguageId,
                currentOSId,
                onidenAdmin.data.allEnvedSituationDetails
                );

        // 表示
        var currentLanguageCode = onidenAdmin.data.languages.filter(function (language) {
            return language.id == currentLanguageId
        })[0].code;
        var currentOSCode = onidenAdmin.data.os.filter(function (os) {
            return os.id == currentOSId
        })[0].code;

        console.log(currentOSCode, currentLanguageCode)

        commonRender.renderEditPane({
            $pane: $(".editPane"),
            templateSelector: "#edit",
            locals: {
                languages: onidenAdmin.data.languages,
                os: onidenAdmin.data.os,
                categories: onidenAdmin.data.categories[currentLanguageCode][currentOSCode],
                // timezones: onidenAdmin.data.timezones[currentLanguageCode][currentOSCode],
                situationDetails: situationDetails,
                item: {
                    languageId: currentLanguageId,
                    osId: currentOSId,
                    situation: {},
                    situationDetail: {},
                    timestamps: 1
                },
                actionName: "追加", // タイトル書き換え用
                saveActionName: "追加", // ボタン書き換え用
                formActionURL: "/menus", // 送信先の修正
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
        var currentOSId = parseInt(enviromentSelector.getEnvOSId());
        var currentLanguageId = parseInt(enviromentSelector.getEnvLanguageId());

        // 言語/OSでフィルタしたシチュエーション詳細(シチュエーション基本情報付き)を取得
        var situationDetails = dataAccess.getListDataByEnv(
                currentLanguageId,
                currentOSId,
                onidenAdmin.data.allEnvedSituationDetails
                );
        var errorTime = $(".messageTitle").text();
        var dpErr = 1;
        if (errorTime === '他の画面及び人に更新されているため、保存できません') {
            dpErr = 1;
        } else {
            dpErr = 0;
        }

        // 選択したメニューのデータを取得
        var item = dataAccess.getSingleData({
            data: onidenAdmin.data.allEnvedMenus,
            id: itemId,
            osId: currentOSId,
            languageId: currentLanguageId
        });

        // 表示
        var currentLanguageCode = onidenAdmin.data.languages.filter(function (language) {
            return language.id == currentLanguageId
        })[0].code;
        var currentOSCode = onidenAdmin.data.os.filter(function (os) {
            return os.id == currentLanguageId
        })[0].code;
        commonRender.renderEditPane({
            $pane: $(".editPane"),
            templateSelector: "#edit",
            locals: {
                id: itemId,
                languages: onidenAdmin.data.languages,
                os: onidenAdmin.data.os,
                categories: onidenAdmin.data.categories[currentLanguageCode][currentOSCode],
                // timezones: onidenAdmin.data.timezones[currentLanguageCode][currentOSCode],
                situationDetails: situationDetails,
                item: item,
                actionName: "編集", // タイトル書き換え用
                saveActionName: "保存", // ボタン書き換え用
                formActionURL: "/menus/" + itemId, // 送信先の修正
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
        var $prevItem = $item.prev(".item");
        var isSwitchable = ($prevItem.size() != 0);

        if (isSwitchable) {

            var currentId = parseInt($item.attr("data-id"));
            var currentPosition = parseInt($item.attr("data-position"));

            // 位置をセット
            $item.attr("data-position", currentPosition - 1);
            $prevItem.attr("data-position", currentPosition);

            // 表示の並び替え
            $item.insertBefore($prevItem);

            // データの並び替え
            var currentLanguageId = enviromentSelector.getEnvLanguageId();
            var currentOSId = enviromentSelector.getEnvOSId();

//            console.log("language", language)

            // onidenAdmin.data.enabledEnvedMenus.find(function(menu){
            //     return (menu.)
            //
            // })

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
        var $nextItem = $item.next(".item");
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
            api: "/menus/position/save",
            positionList: positionList
        });

    });

    // ---------------------------------------------------------------------------------
    // カテゴリ切り替え
    // ---------------------------------------------------------------------------------

    $(document).on("click", ".actionShowCategoryRelated", function () {
        var categoryCode = $(this).attr("data-category-code");

        $(".actionShowCategoryRelated").removeClass("selected");
        $(this).addClass("selected");

        $(".chainCategoryRelated").addClass("hidden");
        $(".chainCategoryRelated[data-category-code=" + categoryCode + "]").removeClass("hidden");
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
        var api = "/menus/" + id;

        form.deleteSubmit(api);

    });

// ---------------------------------------------------------------------------------
    var url = window.location.href;
    var idEr =  url.split('/menus/');
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
