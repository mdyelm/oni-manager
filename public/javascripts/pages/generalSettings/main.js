////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
require("../../_includes/common.js");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var form = require("../../_includes/form.js");
var dataAccess = require("../../_includes/dataAccess.js");
var commonRender = require("../../_includes/render.js");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MODULES
var listEditor = require("../../_includes/modules/listEditor.js");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

$(function(){

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 一覧画面
    /////////////////////////////////////////////////////////////////////////////////////////////////////////

    function decodeHtml(html) {
        var txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    }

    var topicsFooterHTMLListEditor = listEditor();
    topicsFooterHTMLListEditor.init({
        $body: $(".topicsFooterHTMLListEditor"),
        $output: $("textarea[name=TOPICS_FOOTER_HTML]"),
        tableTemplateId: "#listEditor_table_topics_footerhtml",
        enableEnv: true,
        mainDataName: "topicsFooterHTML",
        data: {
            languages: onidenAdmin.data.languages,
            os: onidenAdmin.data.os,
            topicsFooterHTML: JSON.parse(decodeHtml(onidenAdmin.data.keyValues.TOPICS_FOOTER_HTML.value))
        },
        defaultValues: {
            html: ""
        }
    });

    var categoryListEditor = listEditor();
    categoryListEditor.init({
        $body: $(".categoryListEditor"),
        $output: $("textarea[name=SETTINGS_CATEGORIES]"),
        tableTemplateId: "#listEditor_table_category",
        enableEnv: true,
        mainDataName: "categories",
        data: {
            languages: onidenAdmin.data.languages,
            os: onidenAdmin.data.os,
            categories: JSON.parse(onidenAdmin.data.keyValues.SETTINGS_CATEGORIES.value)
        },
        defaultValues: {
            isEnabled: 0,
            code: "",
            name: "",
            enableTimezoneSuggest: false,
            position: null,
        }
    });

    var timezoneListEditor = listEditor();
    timezoneListEditor.init({
        $body: $(".timezoneListEditor"),
        $output: $("textarea[name=SETTINGS_TIMEZONES]"),
        tableTemplateId: "#listEditor_table_timezone",
        enableEnv: true,
        mainDataName: "timezones",
        data: {
            languages: onidenAdmin.data.languages,
            os: onidenAdmin.data.os,
            timezones: JSON.parse(onidenAdmin.data.keyValues.SETTINGS_TIMEZONES.value)
        }
    });

    // var timezoneListEditor = listEditor();
    // timezoneListEditor.init({
    //     $body: $(".timezoneListEditor"),
    //     enableEnv: false,
    //     enablePosition: false,
        // data: [
        //     {
        //         code: "morning",
        //         name: "朝",
        //         beginTime: "05:00",
        //         endTime: "10:59",
        //     },
        //     {
        //         code: "noon",
        //         name: "昼",
        //         beginTime: "11:00",
        //         endTime: "13:59",
        //     },
        //     {
        //         code: "afternoon",
        //         name: "午後",
        //         beginTime: "14:00",
        //         endTime: "15:59",
        //     },
        //     {
        //         code: "evening",
        //         name: "夕方",
        //         beginTime: "16:00",
        //         endTime: "17:59",
        //     },
        //     {
        //         code: "night",
        //         name: "夜",
        //         beginTime: "18:00",
        //         endTime: "23:59",
        //     },
        //     {
        //         code: "midnight",
        //         name: "深夜",
        //         beginTime: "00:00",
        //         endTime: "04:59",
        //     }
        // ]
    // });

    // ---------------------------------------------------------------------------------
    // 保存ボタン
    // ---------------------------------------------------------------------------------
    var $saveButton = $(".actionSaveSettings");
    $saveButton.on("click", function(){
        var $form = $("form");
        form.formSubmit({
            $form: $form,
            confirmMessage: "本当に保存しますか？"
        });
    });

});
