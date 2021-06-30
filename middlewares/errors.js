const ErrorHandler = require('../config/utils/errorHandler');
module.exports = (err, req, res, next) => {
    console.log(err);
    console.log('error called', process.env.NODE_ENV)
    err.statusCode = err.statusCode || 500;

    if (process.env.NODE_ENV === 'Development') {
        res.status(err.statusCode).json({
            success: false,
            error: err,
            errMessage: err.message,
            stack: err.stack
        })

    }

    if (process.env.NODE_ENV === 'Production') {
        let error = { ...err };

        err.message = error.message;

        //Wrong Mangoose Object Id Error
        if (err.name === 'CastError') {
            const message = `Resourse not found. Invalid:${err.path}`;
            error = new ErrorHandler(message, 404);
        }
        //Handle mongoose duplicate key error
        if (err.code === 11000) {
            console.log('error is ',err);
            const message = `Duplicate ${Object.keys(err.keyValue)} entered.`
        }
        error = new ErrorHandler(message, 400);
    }
    //Handling Wrong JWT Token Error
      if(err.name === 'JsonWebTokenError'){
          const message = 'Json Web Token is invalid. Try again!';
          error = new ErrorHandler(message,500);
      }
      //Handling Expired JWT Token Error
      if(err.name === 'TokenExpiredError'){
        const message = 'Json Web Token is expired. Try again!';
        error = new ErrorHandler(message,500);
    }

    //Handling mangoose validatipon error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(value => value.message);
        error = new ErrorHandler(message, 404);
    }

    res.status(err.statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error'
    })

}



