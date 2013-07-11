var express        = require('express'),
    passport       = require('passport'), // passportjs
    DigestStrategy = require('passport-http').DigestStrategy; // http digest

// #############################################################################################################

// ----------------
// Environment conf
// ----------------
var app = express();

// configure Express
app.configure(function()
{
	app.use(express.logger());

	app.use(express.bodyParser()); // for img uploads
	app.use(express.methodOverride());
	
	// Initialize Passport! Note: no need to use session middleware when each
	// request carries authentication credentials, as is the case with HTTP
	// Digest.
	app.use(passport.initialize());
	
	app.use(app.router);
	app.use(express.static( __dirname + '/public' ));
});

app.configure( 'development', function () { app.use( express.errorHandler( { dumpExceptions: true, showStack: true } ) ); });
app.configure( 'production',  function () { app.use( express.errorHandler() ); } );

// #############################################################################################################

// fake database
var users = [
    { id: 1, username: 'John', password: 'pass', 	 domain: "http://localhost:2563/", email: 'john@example.com' }
  , { id: 2, username: 'joe',  password: 'birthday', domain: "www.domain.com", 		   email: 'joe@example.com' }
];

// #############################################################################################################

function findByUsername( username, fn )
{
	for (var i = 0, len = users.length; i < len; i++)
	{
		var user = users[i];
		if (user.username === username) return fn( null, user );
	}
	return fn(null, null);
}

// -------------
// Passport conf
// -------------

// Use the DigestStrategy within Passport.
// This strategy requires a `secret`function, which is used to look up the
// use and the user's password known to both the client and server. The
// password is used to compute a hash, and authentication will fail if the
// computed value does not match that of the request. Also required is a
// `validate` function, which can be used to validate nonces and other
// authentication parameters contained in the request.
passport.use
(
  new DigestStrategy(
	{ qop: 'auth', realm: 'your.realm' },
	function( username, done )
	{
		// Find the user by username. If there is no user with the given username
		// set the user to `false` to indicate failure. Otherwise, return the
		// user and user's password.
		findByUsername(
			username, 
			function( err, user )
			{
				if ( err ) 	 return done( err );
				if ( !user ) return done( null, false );
				return done( null, user, user.password );
			}
		);
	},
	function( params, done ) // second callback
	{
		// asynchronous validation, for effect...
		process.nextTick(
			function ()
			{
				// check nonces in params here, if desired
				console.log( params );
				/*
				nonce: 'MYto1vSuu6eK9PMNNYAqIdsmUXOA2ppU',
				cnonce: 'MDA4NjY5',
				nc: '00000001',
				opaque: undefined }
				*/
				return done( null, true );
			}
		);
	}
));

// #################################################################################

app.all(
	'/',
	// Authenticate using HTTP Digest credentials, with session support disabled.
	passport.authenticate( 'digest', { session: false } ),
	function( req, res )
	{
		/************************************************/
		//  CROSS-DOMAIN RESOURCE SHARING
		res.setHeader( 'Access-Control-Allow-Origin', '*' );
		/************************************************/

		// domain check
		if ( req.user.domain.match( req.headers.origin ) )
		  res.json( { logged: true, username: req.user.username, email: req.user.email } );
	}
);

app.listen( 3000 );