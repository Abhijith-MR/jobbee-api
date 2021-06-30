const jwt = require('jsonwebtoken');
const User = require('../models/users');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const ErrorHandler = require('../config/utils/errorHandler');

// Check if the user is authenticated or not
exports.isAuthenticatedUser = catchAsyncErrors(async(req,res,next)=>{
    let token;
    console.log(req.headers);

    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        console.log(req.headers.authorization.split(' ')[1])
        token = req.headers.authorization.split(' ')[1];
    }
    if(!token){
        return next(new ErrorHandler('Login first to access to this source',401));
    }
    
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
    
   
    req.user = await User.findById(decoded.id);
    next();
});
//handling user roles
exports.authorizeRoles = (...roles)=>{
    return(req,res,next)=>{
        if(!roles.includes(req.user.role)){
            return next(new ErrorHandler(`Role(${req.user.role}) is not allowed to access this resource`,403));

        }
        next();
    }
}