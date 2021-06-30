const User = require('../models/users');
const job = require('../models/jobs');
const ErrorHandler = require('../config/utils/errorHandler');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const sendToken = require('../config/utils/jwtToken');
const fs = require('fs');
const jobs = require('../models/jobs');
const APIFilters = require('../config/utils/apiFilters');


// Get current user profile => /api/v1/me
exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id)
        .populate({
            path: 'jobsPublished',
            select: 'title postingDate'
        });

    res.status(200).json({
        success: true,
        data: user
    })
});
//Show all apllied jobs => /api/v1/jobs/applied
exports.getAppliedJobs = catchAsyncErrors(async (req, res, next) => {
    const Jobs = await job.find({ 'applicantsApplied.id': req.user.id }).select('+applicantsApplied');

    res.status(200).json({
        success: true,
        results: Jobs.length,
        data: Jobs
    });
});
// Show all jobs published by employeer => /api/v1/jobs/published
exports.getPublishedJobs = catchAsyncErrors(async (req, res, next) => {
    const Jobs = await job.find({ user: req.user.id });
    console.log('jobs', { user: req.user.id })
    res.status(200).json({
        success: true,
        results: Jobs.length,
        data: Jobs
    })
});


//Update current user password => /api/v1/password/update
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    //Check previous user password
    const isMatched = await user.comparePassword(req.body.currentPassword);

    if (!isMatched) {
        return next(new ErrorHandler('Password is incorrect', 401));
    }
    user.password = req.body.newPassword;
    await user.save();
    sendToken(user, 200, res);
});
//Update current user data => /api/v1/me/update
exports.updateUser = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email
    }
    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        newValidators: true
    });
    res.status(200).json({
        success: true,
        data: user
    })
});
//Delete Current User => /api/v1/me/delete
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {

    deleteUserData(req.user.id, req.user.role);

    const user = await User.findByIdAndDelete(req.user.id);

    res.cookie('token', 'none', {
        expires: new Date(Date.now()),
        httpOnly: true
    });
    res.status(200).json({
        success: true,
        message: 'Your Account Has Been Deleted'
    })
});
//Adding controller methods that only accessible by admins

//Show all user  => /api/v1/users
exports.getUsers = catchAsyncErrors(async (req, res, next) =>{
    const apiFilters = new APIFilters(User.find(),req.query)
          .filter()
          .sort()
          .limitFields()
          .pagination();
     const users = await apiFilters.query;
     
     res.status(200).json({
         success:true,
         results:users.length,
         data:users
     })
});
//Delete User(admin) => /api/v1/user/:id
exports.deleteUserAdmin = catchAsyncErrors(async (req, res, next) =>{
    const user = await User.findById(req.params.id);

    if(!user){
        return next(new ErrorHandler(`User not found with id:${req.params.id}`,404));
    }
    deleteUserData(user.id,user.role);
    await user.remove();

    res.status(200).json({
        success:true,
        message:'User is deleted by Admin'
    })
});

// Delete user files and employee files
async function deleteUserData(user, role) {
    if (role === 'employeer') {
        await job.deleteMany({ user: user });
    }
    if (role === 'user') {
        const appliedJobs = await job.find({ 'applicantsApplied.id': user }).select('+applicantsApplied');

        for (let i = 0; i < appliedJobs.length; i++) {
            let obj = appliedJobs[i].applicantsApplied.find(o => o.id === user);

            console.log(_dirname);
            let filepath = `${_dirname}/public/uploads/${obj.resume}`.replace('\\controllers', '');

            fs.unlink(filepath, err => {
                if (err) console.log(err);
            });

            appliedJobs[i].applicantsApplied.splice(appliedJobs[i].applicantsApplied.indexOf(obj.id));
            appliedJobs[i].save();
        }
    }
}