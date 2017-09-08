////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var config = require("config");
var moment = require('moment-timezone');
moment.tz.setDefault("Asia/Tokyo");
var crypto = require("crypto");
var debug = require('debug')('om/util/auth');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var usersDAO = require(process.cwd() + '/dao/usersDAO');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.authorize = function( submittedUserName, submittedPassword ) {
    return new Promise( async function( resolve, reject ){
        debug("authorize");

        try {

            var fetchOptions = {
                where: { username: submittedUserName }
            }

            var users = await usersDAO.fetch( fetchOptions );

            // 入力されたパスワードを暗号化し照合可能な状態にする
            var salt = config.get("oniManagerConfig.salt");
            var encryptedSubmittedPassword = crypto.createHash('sha256').update( submittedPassword + salt ).digest('base64');

            // 認証開始
            var isAuthorized = false;
            var authorizedUser = {}

            users.forEach(function( user ){

                if ( ( user.username == submittedUserName ) && ( user.password == encryptedSubmittedPassword) ) {
                    isAuthorized = true;
                    authorizedUser = {
                        username: user.username,
                        role: user.role,
                        name: user.name
                    }
                }

            })

            resolve({
                isAuthorized: isAuthorized,
                user: authorizedUser
            });

            debug("authorize finished");

        } catch(e) {
            debug("authorize err %0", e);
        }

    });
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
