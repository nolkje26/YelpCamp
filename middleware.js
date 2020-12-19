const { campgroundSchema, reviewSchema } = require('./schemas');
const ExpressError = require('./utilities/ExpressError');
const Campground = require('./models/campground');
const Review = require('./models/review');

module.exports.isLoggedIn = function (req, res, next) {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in');
        return res.redirect('/login');
    } else {
        next()
    }
};

//Middleware to validate campgrounds (POST and PATCH) requests using Joi
module.exports.validateCampground = function (req, res, next) {
    const { error } = campgroundSchema.validate(req.body);

    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

//Middleware authorization 
module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground.author.equals(req.user._id)) {
        req.flash('error', 'You don\'t have permission');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}

module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review.author.equals(req.user._id)) {
        req.flash('error', 'You don\'t have permission');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}

//Middleware to validate reviews (POST) request using Joi
module.exports.validateReview = function (req, res, next) {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}