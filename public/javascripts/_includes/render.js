////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
require("./renderConfig");
var pane = require("./modules/pane");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// ---------------------------------------------------------------------------------
// 一覧表示
// ---------------------------------------------------------------------------------

module.exports.renderList = function( options ){
    var data = onidenAdmin.data;

    var defaultOptions = {
        $container: null,
        $appendTo: null,
        templateSelector: "",
        locals: {
            languages: data.languages,
            os: data.os,
            listData: null
        }
    }
    var options = Object.assign(defaultOptions, options);

    // テンプレートにデータを展開しHTML生成
    var template = $.templates(options.templateSelector);
    var html = template.render(options.locals);


    // HTMLを貼り付け
    options.$appendTo.empty().append( html );

    // 表示数更新
    var itemCount = options.locals.listData ? Object.keys(options.locals.listData).length : 0;

    // $(".info .resultCount span",  options.$container).text(itemCount);

}

// ---------------------------------------------------------------------------------
// 編集画面表示
// ---------------------------------------------------------------------------------

module.exports.renderEditPane = function( options ){
    var data = onidenAdmin.data;

    var defaultOptions = {
        id: null,
        $pane: null,
        templateSelector: "",
        locals: {
            languages: data.languages,
            os: data.os,
            actionName: "", // タイトル書き換え用 (追加 / 変更など)
            saveActionName: "", // ボタン書き換え用 (追加 / 変更)
            formActionURL: "", // 送信先の修正 (例 /topics)
            formMethod: "", // メソッドの修正 (POST / PUT)
            item: {},
        },
        afterEditRender: function( $pane ){
            var d = $.Deferred();
            return d.resolve();
        }
    }
    var options = Object.assign(defaultOptions, options);

    console.log("includes/render locals", options.locals);

    // テンプレートにデータを展開しHTML生成
    var template = $.templates(options.templateSelector);
    var html = template.render( options.locals );

    // HTMLを貼り付け
    options.$pane.html( html );

    //イベント設定
    $(".formSubGroup").on("click", function(){
        $(this).toggleClass("isCollapsed");
    });

    // 追加処理
    options.afterEditRender( options.$pane, options.locals.item )
    .then(function(){
        // 編集枠表示
        pane.showSidePane( options.$pane );

    });

}
