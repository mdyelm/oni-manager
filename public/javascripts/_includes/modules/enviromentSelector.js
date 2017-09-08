////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var dataAccess = require("../dataAccess.js");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var enviromentSelector = {
    setEnvLanguageId: function(id){
        onidenAdmin.enviromentSelector.currentLanguageId = id;
        Cookies.set("currentEnvLanguageId", id);
    },
    setEnvOSId: function(id){
        onidenAdmin.enviromentSelector.currentOSId = id;
        Cookies.set("currentEnvOsId", id);
    },
    setEnvRenderTargets: function(renderTargets){
        onidenAdmin.enviromentSelector.renderTargets = renderTargets;
    },
    setEvents: function($envSelector){
        var _this = this;

        // 言語切り替え
        $(".languageSelect .languageItem", $envSelector).on("click", function(){

            // スタイル用クラス付け替え
            $(".languageSelect .selected", $envSelector).removeClass("selected");
            $(this).addClass("selected");

            // 設定を更新
            var languageId = $(this).attr("data-language-id");
            _this.setEnvLanguageId(languageId);

            // レンダリング
            _this.renderAll();

        });

        // OS切り替え
        $(".osSelect .osItem", $envSelector).on("click", function(){

            // スタイル用クラス付け替え
            $(".osSelect .selected", $envSelector).removeClass("selected");
            $(this).addClass("selected");

            // 設定を更新
            var osId = $(this).attr("data-os-id");
            _this.setEnvOSId(osId);

            // レンダリング
            _this.renderAll();

        });

    },
    getEnvLanguageId: function(){
        return onidenAdmin.enviromentSelector.currentLanguageId;
    },
    getEnvOSId: function(){
        return onidenAdmin.enviromentSelector.currentOSId;
    },
    getEnvRenderTargets: function(){
        return onidenAdmin.enviromentSelector.renderTargets;
    },
    renderAll: function(){

        var renderTargets = this.getEnvRenderTargets();

        renderTargets.forEach( $.proxy(function( renderTarget ){

            var renderTargetDefaults = {
                $container: null,
                $appendTo: null,
                templateSelector: "",
                listData: [],
                render: null,
                additionalLocals: {},
            }
            var renderTarget = Object.assign(renderTargetDefaults, renderTarget);

            // リストデータを取得
            var envLanguageId = this.getEnvLanguageId();
            var envOSId = this.getEnvOSId();
            var filteredListData = dataAccess.getListDataByEnv( envLanguageId, envOSId, renderTarget.listData );

            // リストを描画
            var languages = onidenAdmin.data.languages;
            var os = onidenAdmin.data.os;

            var renderOptions = {
                $container: renderTarget.$container,
                $appendTo: renderTarget.$appendTo,
                templateSelector: renderTarget.templateSelector,
                locals: Object.assign( renderTarget.additionalLocals, {
                    currentLanguageCode: languages.filter(function(language){ return language.id == envLanguageId })[0].code,
                    currentOsCode: os.filter(function(os){ return os.id == envOSId })[0].code,
                    languages: languages,
                    os: os,
                    listData: filteredListData
                })
            }
           renderTarget.render(renderOptions);

        }, this));

    },
    init: function( options ){

        var defaultOptions = {
            $enviromentSelector: null,
            renderTargets: [
                // $container: null,
                // $appendTo: null,
                // templateSelector: "",
                // listData: [],
                // render: null,
                // additionalLocals: {},
            ]
        }
        var options = Object.assign( defaultOptions, options );

        // 言語/OSの初期値を設定
        onidenAdmin.enviromentSelector = {}
        if ( Cookies.get("currentEnvLanguageId") ) {
            this.setEnvLanguageId( Cookies.get("currentEnvLanguageId") );
            $(".languageSelect .selected", options.$enviromentSelector).removeClass("selected");
            $(".languageSelect [data-language-id="+Cookies.get("currentEnvLanguageId")+"]", options.$enviromentSelector).addClass("selected");
        } else {
            this.setEnvLanguageId(1);
        }
        if ( Cookies.get("currentEnvOsId") ) {
            this.setEnvOSId( Cookies.get("currentEnvOsId") );
            $(".osSelect .selected", options.$enviromentSelector).removeClass("selected");
            $(".osSelect [data-os-id="+Cookies.get("currentEnvOsId")+"]", options.$enviromentSelector).addClass("selected");
        } else {
            this.setEnvOSId(1);
        }

        this.setEnvRenderTargets( options.renderTargets );

        // イベントバインド
        this.setEvents( options.$enviromentSelector );

        // 対象ごとにレンダリング(通常一覧、無効一覧など一覧が複数ある場合に対応)
        this.renderAll();

    }
}

module.exports = enviromentSelector;
