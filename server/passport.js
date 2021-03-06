const passport = require('passport');
const GoogleTokenStrategy = require('passport-google-token').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const UserService = require('./services/UserService');
const config = require('./config');

const cookieExtractor = function (req) {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies['_session'];
    }
    return token;
};

module.exports = function () {
    passport.use(new GoogleTokenStrategy({
        clientID: "759112139334 - t6lh1tbfg8gm8p5p0bd1e21pr25n0vp2.apps.googleusercontent.com", // TODO: put in config
        clientSecret: "uDXrBXEXi2WFPcyOy_tNbgr" // TODO: put in config
    },
        async function (accessToken, refreshToken, profile, done) {
            try {
                const { name, email } = profile._json;
                const userService = new UserService();
                let matchingUsers = await userService.getUsers(null, null, email, null, null);

                if (matchingUsers.length == 0) {
                    await userService.addUser(name, email);
                    matchingUsers = await userService.getUsers(null, null, email, null, null);
                }

                return done(null, matchingUsers[0]);
            } catch (error) {
                return done(error);
             }
        }
    ));

    let opts = {}
    opts.jwtFromRequest = cookieExtractor;
    opts.secretOrKey = config.jwt_secret; // TODO: use real secret from config file
    passport.use(new JwtStrategy(opts, function (jwt_payload, done) {
        if (jwt_payload.id != null) {
            // TODO: is there a case where we want to actually lookup the user?
            return done(null, jwt_payload);
        }
    }));
}