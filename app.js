
// DO THIS COMMAND FIRST : export NODE_ENV=production or export NODE_ENV=development

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require('config');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var compileSass = require('express-compile-sass');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var moment = require('moment-timezone');
moment.tz.setDefault("Asia/Tokyo");
var methodOverride = require('method-override');
var browserify = require('browserify-middleware');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var authManager = require( process.cwd() + '/util/auth.js');
var flash = require('connect-flash');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var multer  = require('multer');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( process.env.NODE_ENV == "production" ){
    process.setuid('webadmin');
}

var app = express();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CORSを許可する

if (config.get("oniManagerConfig.allowCORS")) {

    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// view engine setup

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// sass setup

var root = process.cwd();

app.use(compileSass({
    root: root + "/public",
    sourceMap: true, // Includes Base64 encoded source maps in output css
    sourceComments: true, // Includes source comments in output css
    watchFiles: true, // Watches sass files and updates mtime on main files for each change
    logToConsole: false // If true, will log to console.error on errors
}));
app.use(express.static(root));

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// POSTに対応

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PUT/DELETEに対応

app.use(methodOverride((req, res) => {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method
    delete req.body._method
    return method
  }
}));

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Session設定

var dbConfig = config.get('dbConfig');
var sessionOptions = {
	host: dbConfig.host,
	port: 3306,
	user: dbConfig.user,
	password:dbConfig.password,
	database: dbConfig.database
};
var sessionStore = new MySQLStore(sessionOptions);

app.use(session({
    store: sessionStore,
    secret: 'nine',
    cookie: { maxAge: 600000000 }
}));

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// フロントJSの依存性管理(Browserifyでrequireを処理)

app.use('/javascripts/pages_compiled/', browserify(__dirname + '/public/javascripts/pages/'));

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// メッセージ表示

app.use( flash() );

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 認証

app.use( passport.initialize() );
app.use( passport.session() );

passport.use(
    new LocalStrategy(
        {
            usernameField: 'login_ID',
            passwordField: 'login_PW'
        },
        function( username, password, done ){

            authManager.authorize( username, password )
                .then(function( result ){

                    if ( result.isAuthorized ) {
                        return done( null, {
                            user: result.user.username,
                            name: result.user.name,
                            role: result.user.role
                        });
                    } else {
                        return done(null, false, {
                            message: "認証エラー"
                        });
                    }

                });

        }
    )

)

passport.serializeUser(function( args, done ){
    done(null, args)
})

passport.deserializeUser(function( args, done ){
    done( null, {
        user: args.user,
        name: args.name,
        role: args.role
    } )
})


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ルーティング

// 雑多(DBセットアップ等)
var commonRouter = require('./routes/commonRouter');
app.use('/', commonRouter);

// ログイン
var loginRouter = require('./routes/loginRouter');
app.use('/login', loginRouter);

// ダッシュボード
var dashboardRouter = require('./routes/dashboardRouter');
app.use('/dashboard', dashboardRouter);

// 本番反映(デプロイ)管理
var deployRouter = require('./routes/deployRouter');
app.use('/deploy', deployRouter);

// 配信：お知らせ管理
var topicsRouter = require('./routes/topicsRouter');
app.use('/topics', topicsRouter);

// 設定：シチュエーション管理
var situationsRouter = require('./routes/situationsRouter');
app.use('/situations', situationsRouter);

// 設定：メニュー項目管理
var menusRouter = require('./routes/menusRouter');
app.use('/menus', menusRouter);

// 設定：ピックアップ枠管理
var pickupsRouter = require('./routes/pickupsRouter');
app.use('/pickups', pickupsRouter);

// 設定：メニュー背景管理
var menuBackgroundsRouter = require('./routes/menuBackgroundsRouter');
app.use('/menuBackgrounds', menuBackgroundsRouter);

// 設定：全般設定
var generalSettingsRouter = require('./routes/generalSettingsRouter');
app.use('/generalSettings', generalSettingsRouter);

// 管理画面：ユーザー管理
var usersRouter = require('./routes/usersRouter');
app.use('/users', usersRouter);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// エラー処理


// 404ページ設定
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = app;
