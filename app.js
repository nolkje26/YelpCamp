if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
};

//required packages and models
const express = require('express')
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utilities/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');

const MongoDBStore = require("connect-mongo")(session);

const campgrounds = require('./routes/campgrounds');
const reviews = require('./routes/reviews');
const users = require('./routes/users');

//import mongo
// development: 'mongodb://localhost:27017/yelp-camps'
// production: dbURL
const dbURL = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';
mongoose.connect(dbURL, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false })
    .then(() => {
        console.log('Database Connected')
    })
    .catch(err => {
        console.log(`Mongo Connection Error: ${err}`)
    })

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('ejs', ejsMate);

//Middleware
app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize());

const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

const store = new MongoDBStore({
    url: dbURL,
    secret,
    touchAfter: 24 * 60 * 60
});

store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e)
})

// Setup session
const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // ms secs mins hour days
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};
app.use(session(sessionConfig));
app.use(flash());
app.use(helmet());

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-alpha3/dist/css/bootstrap.min.css",
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
];
const connectSrcUrls = [
    "https://api.mapbox.com",
    "https://*.tiles.mapbox.com",
    "https://events.mapbox.com",
    "https://ka-f.fontawesome.com"
];
const fontSrcUrls = [
    'https://use.fontawesome.com/',
    'https://fonts.gstatic.com/'
];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/nolkje/",
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Middleware that will be used for all routers - flash messages
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

app.get('/fakeUser', async (req, res) => {
    const user = new User({ email: 'arnoldo@berkeley.edu', username: 'nolkje' });
    const newUser = await User.register(user, 'monkey'); // this takes the instance of User, takes pw (monkey) and hashes it, then stores it
    res.send(newUser);
})

app.use('/campgrounds', campgrounds);
app.use('/campgrounds/:id/reviews', reviews);
app.use('/', users);

app.get('/', (req, res) => {
    res.render('home')
});

//This will be sent to all requests but will only run if nothing has been matched first
app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404)) // this ensures that an error gets throw and gets sent to the error handler
})

//error handler
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Ah geez, something went wrong';
    res.status(statusCode).render('errors', { err });
})

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Serving on port ${port}`)
})
