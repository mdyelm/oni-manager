var util = require("./util.js");

$(function(){

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // JSRenderのテンプレート内で使用できるコンバーターを定義
    // ※{{コンバーター名:変数名}}で使用できる

    $.views.converters("enableString", function(val) {
        return val ? "有効" : "無効";
    });

    $.views.converters("enableClass", function( val ){
        return val ? "isEnabled" : "isDisabled";
    });

    $.views.converters("visibleClass", function( val ){
        return val ? "isVisible" : "isHidden";
    });

    $.views.converters("paymentClass", function( val ){
        return val ? "isPay" : "isFree";
    });

    $.views.converters("getPlainDate", function( val ){
        var datetime = new Date(val);
        var year  = datetime.getFullYear();
        var month = util.doubleDigit( parseInt( datetime.getMonth() ) + 1 );
        var day = util.doubleDigit( datetime.getDate() );

        return  year + "-" + month + "-" + day;
     });

    $.views.converters("datetimeToDate", function( val ){
         var datetime = new Date(val);
         var year  = datetime.getFullYear();
         var month = util.doubleDigit( parseInt( datetime.getMonth() ) + 1 );
         var day = util.doubleDigit( datetime.getDate() );

         return year + "-" + month + "-" + day;
     });

     $.views.converters("datetimeToTime", function( val ){
         var datetime = new Date(val);
         var hours  = util.doubleDigit( datetime.getHours() );
         var minutes = util.doubleDigit( datetime.getMinutes() );

         return  hours + ":" + minutes;
     });

     $.views.converters("getLabeledDateTime", function( val ){
         var datetime = new Date(val);
         var year  = datetime.getFullYear();
         var month = util.doubleDigit( parseInt( datetime.getMonth() ) + 1 );
         var day = util.doubleDigit( datetime.getDate() );
         var hours  = util.doubleDigit( datetime.getHours() );
         var minutes  = util.doubleDigit( datetime.getMinutes() );

         return year + "年" + month + "月" + day + "日" + " " + hours + ":" + minutes;
     });

    $.views.converters("getLabeledDate", function( val ){
        var datetime = new Date(val);
        var year  = datetime.getFullYear();
        var month = util.doubleDigit( parseInt( datetime.getMonth() ) + 1 );
        var day = util.doubleDigit( datetime.getDate() );

        return  year + "年" + month + "月" + day + "日";
    });

    $.views.converters("getDate", function( val ){
        var datetime = new Date(val);
        var year  = datetime.getFullYear();
        var month = util.doubleDigit( parseInt( datetime.getMonth() ) + 1 );
        var day = util.doubleDigit( datetime.getDate() );

        return year + "-" + month + "-" + day;
    });

    $.views.converters("getTime", function( val ){
        var datetime = new Date(val);
        var hours = util.doubleDigit( datetime.getHours() );
        var minutes = util.doubleDigit(datetime.getMinutes() );

        return hours + ":" + minutes;
    });

    $.views.converters("msToSecond", function( val ){
        return Math.floor( ( val / 1000 ) * 100 ) / 100;
    })

    // JSRenderのテンプレート内で使用できるヘルパーを定義
    // ※{{~ヘルパー名()}}で使用できる

    $.views.helpers({
        getMixLoopIndex: function( langIndex, osIndex ){
            if (osIndex == 1) {
                return  osIndex + (langIndex * 2);
            } else if (osIndex == 2) {
                return  osIndex + (langIndex * 2);
            }
        },
        getFingerPrint: function(){ return "?" + Date.now() }
    })

});
