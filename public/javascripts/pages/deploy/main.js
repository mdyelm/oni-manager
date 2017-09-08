////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
require("../../_includes/common.js");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var form = require("../../_includes/form.js");
var dataAccess = require("../../_includes/dataAccess.js");
var commonRender = require("../../_includes/render.js");
var recycleUploader = require("../../_includes/modules/recycleUploader.js");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

$(function(){


    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 一覧画面
    /////////////////////////////////////////////////////////////////////////////////////////////////////////

    // diffにスタイル適用
    $(window).load(function(){

        function decodeSpecialCharText(text) {
            var txt = document.createElement("textarea");
            txt.innerHTML = text;
            return txt.value;
        }

        if( onidenAdmin.data.diff ) {
            var diff2htmlUi = new Diff2HtmlUI({diff: decodeSpecialCharText(onidenAdmin.data.diff)});
            diff2htmlUi.draw('#diff', {inputFormat: 'json', showFiles: true, matching: 'lines'});
        }
    })


    // バックアップエクスプローラー(ほぼアップローダー)設定
    var backupExplorer = recycleUploader();
    var $explorer = $(".backupExplorer");
    backupExplorer.init({
            api: "/deploy/backup/",
            $appendTo: $(".upload", $explorer),
            $input: $(".field .input input", $explorer),
    });

    // ---------------------------------------------------------------------------------
    // お知らせ テスト版更新
    // ---------------------------------------------------------------------------------

    var $testTopicDeployButton = $(".actionTestTopicDeploy");

    $testTopicDeployButton.on("click", function(){
        if ( confirm("テストアプリ向けのお知らせを更新します。よろしいですか？") ) {
            $(".overlay").show();
            window.location.href = "/deploy/topic/test";
        }

    });

    // ---------------------------------------------------------------------------------
    // お知らせ 本番更新
    // ---------------------------------------------------------------------------------

    var $productionTopicDeployButton = $(".actionProductionTopicDeploy");

    $productionTopicDeployButton.on("click", function(){
        $(".popupWarning textarea[name=commitMessage]").hide();
        $(".popupWarning").show().attr("data-target", "topic");
    });

    // ---------------------------------------------------------------------------------
    // テスト版データ更新
    // ---------------------------------------------------------------------------------

    var $testDeployButton = $(".actionTestDeploy");

    $testDeployButton.on("click", function(){
        if ( confirm("テストサーバーのデータを更新します。よろしいですか？") ) {
            $(".overlay").show();
            window.location.href = "/deploy/test";
        }

    });

    // ---------------------------------------------------------------------------------
    // 更新内容の取得
    // ---------------------------------------------------------------------------------

    var $productionExportButton = $(".actionProductionExport");

    $productionExportButton.on("click", function(){
        $(".overlay").show();
        window.location.href = "/deploy/export/production";
    });

    // ---------------------------------------------------------------------------------
    // 全体ZIP作成
    // ---------------------------------------------------------------------------------

    var $productionBackupButton = $(".actionProductionBackup");

    $productionBackupButton.on("click", function(){
        $(".overlay").show();
        window.location.href = "/deploy/fullzip/production";
    });

    // ---------------------------------------------------------------------------------
    // 本番データ更新
    // ---------------------------------------------------------------------------------

    var $productionDeployButton = $(".actionProductionDeploy");

    $productionDeployButton.on("click", function(){
        $(".popupWarning textarea[name=commitMessage]").show();
        $(".popupWarning").show().attr("data-target", "all");
    });

    // ---------------------------------------------------------------------------------
    // アプリデータリセット
    // ---------------------------------------------------------------------------------

    var $productionFullDeployButton = $(".actionProductionFullDeploy");

    $productionFullDeployButton.on("click", function(){
        $(".popupWarning textarea[name=commitMessage]").hide();
        $(".popupWarning").show().attr("data-target", "reset");
    });

    // ---------------------------------------------------------------------------------
    // ポップアップ 公開
    // ---------------------------------------------------------------------------------

    var $popupYesButton = $(".actionDeployYes");

    $popupYesButton.on("click", function(){

        var $popup = $(".popupWarning");
        var target = $popup.attr("data-target");
        var $form = $("form", $popup);

        $popup.hide();
        $(".overlay").show();

        if ( target == "topic" ) {
            $form.attr("action", "/deploy/topic/production");
        } else if ( target == "all" ) {
            $form.attr("action", "/deploy/production");
        } else if ( target == "reset" ) {
            $form.attr("action", "/deploy/production/full");
        }

        $form.submit();

    });


    // ---------------------------------------------------------------------------------
    // ポップアップ キャンセル
    // ---------------------------------------------------------------------------------

    var $popupNoButton = $(".actionDeployNo");

    $popupNoButton.on("click", function(){

        var $popup = $(".popupWarning");
        var target = $popup.attr("data-target");

        $popup.hide();

    });

    // ---------------------------------------------------------------------------------
    // ポップアップ Enterキーによる送信防止
    // ---------------------------------------------------------------------------------

    $(".popupWarning textarea, .popupWarning input").keypress(function (e) {
        if (e.which === 13) {
            return false;
        }
    });


});
