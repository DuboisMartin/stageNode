var app = require('express')();
var session = require('express-session');
var CASAuthentication = require('cas-authentication');

app.use( session({
    secret: 'super secret key',
    resave: false,
    saveUninitialized: true
}));

var cas = new CASAuthentication({
    cas_url         : 'https://cas.u-picardie.fr',
    service_url     : 'https://upjv.edt.ovh'
});

app.get( '/app', cas.bounce, function( req, res ) {
    res.send( '<html><body>Hello!</body></html>' );
});

app.get( '/api', cas.block, function( req, res ) {
    res.json( { success: true } );
})

app.get( '/api/user', cas.block, function( req, res ) {
    res.json( { cas_user: req.session[ cas.session_name ] } );
});

app.get( '/authenticate', cas.bounce_redirect );

app.get( '/logout', cas.logout );

app.listen(9000);