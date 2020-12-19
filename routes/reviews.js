const express = require('express');
const router = express.Router({ mergeParams: true }); //mergeParams - so that params from app.use('/campgrounds/:id/reviews', reviews); (the id) can be used in this file
const Campground = require('../models/campground');
const Review = require('../models/review');
const reviews = require('../controllers/reviews');
const { reviewSchema } = require('../schemas');
const wrapAsync = require('../utilities/wrapAsync');
const ExpressError = require('../utilities/ExpressError');
const { validateReview, isLoggedIn, isReviewAuthor } = require('../middleware');

// Create
router.post('/', isLoggedIn, validateReview, wrapAsync(reviews.createReview));

// Delete 
router.delete('/:reviewId', isLoggedIn, isReviewAuthor, wrapAsync(reviews.deleteReview))

module.exports = router;