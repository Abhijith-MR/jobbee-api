const job = require('../models/jobs');
const geoCoder = require('../config/utils/geocoder');
const ErrorHandler = require('../config/utils/errorHandler');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const APIFilters = require('../config/utils/apiFilters');
const path = require('path');
const fs = require('fs');
//Find job
exports.getJobs = catchAsyncErrors(async (req, res, next) => {

    const apiFilters = new APIFilters(job.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .searchByQuery()
        .pagination();
    const jobs = await apiFilters.query;
    res.status(200).json({
        success: true,
        results: jobs.length,
        data: jobs
    });
});
//Create a job
exports.newJob = catchAsyncErrors(async (req, res, next) => {
    const job1 = await job.create(req.body);

    //Adding user to body
    req.body.user = req.user.id;

    res.status(200).json({
        success: true,
        message: 'Job Created',
        data: job1
    });
});
// Delete a job => api/v1/job/:id
exports.deleteJob = catchAsyncErrors(async (req, res, next) => {
    let ans = await job.findById(req.params.id).select('+applicantsApplied');

    if (!ans) {
        return next(new ErrorHandler('Job not found', 404));
    }
    //check if the user is owner
    if (job.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorHandler(`User(${req.user.id}) is not allowed to delete this job`))
    }
    //Deleting files associated with job

    for (let i = 0; i < job.applicantsApplied.length; i++) {
        let filepath = `${_dirname}/public/uploads/${job.applicantsApplied[i].resume}`.replace('\\controllers', '');

        fs.unlink(filepath, err => {
            if (err) console.log(err);
        });
    }
    ans = await job.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        message: 'Job is Deleted'
    });
});


// Update a job => api/v1/job/:id
exports.updateJob = catchAsyncErrors(async (req, res, next) => {

    let ans = await job.findById(req.params.id)
    console.log('update called', ans)
    if (!ans) {
        return next(new ErrorHandler('Job not found', 404));
    }
    //check if the user is owner
    if (job.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorHandler(`User(${req.user.id}) is not allowed to update this job`))
    }

    ans = await job.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: true
    });
    res.status(200).json({
        success: true,
        message: 'Job is Updated'
    })
});
//Get a single job using id and slug => api/v1/job/:id/:slug
exports.getJob = catchAsyncErrors(async (req, res, next) => {
    const ans = await job.find({ $and: [{ _id: req.params.id }, { slug: req.params.slug }] });

    if (!ans || ans.length === 0) {
        res.status(404).json({
            success: false,
            message: 'Job not found'
        });
    }
    res.status(200).json({
        success: true,
        data: ans
    })
});


//Search job within radius
exports.getJobsInRadius = catchAsyncErrors(async (req, res, next) => {
    const { zipcode, distance } = req.params;

    // Getting longitude and latitude from geocoder with zipcode
    const loc = await geoCoder.geocode(zipcode);

    const latitude = loc[0].latitude;
    const longitude = loc[0].longitude;
    const radius = distance / 3963;

    const jobs = await job.find({
        location: {
            $geoWithin: {
                $centerSphere: [[longitude, latitude], radius]
            }
        }
    });

    res.status(200).json({
        success: true,
        results: jobs.length,
        data: jobs
    })
});
//Get stats about topic(job) => api/v1/stats/:topic
exports.jobStats = catchAsyncErrors(async (req, res, next) => {
    const stats = await job.aggregate([
        {
            $match: { $text: { $search: "\"" + req.params.topic + "\"" } }
        },
        {
            $group: {
                _id: { $toUpper: '$experience' },
                totalJobs: { $sum: 1 },
                avgPosition: { $avg: '$positions' },
                avgSalary: { $avg: '$salary' },
                minSalary: { $min: '$salary' },
                maxSalary: { $max: '$salary' }
            }
        }
    ]);
    if (stats.length === 0) {
        res.status(200).json({
            success: false,
            message: ` No stats found for - ${req.params.topic}`
        });
    }
    res.status(200).json({
        success: true,
        data: stats
    })
});
//Apply to job using resume => /api/v1/job/:id/apply
exports.applyJob = catchAsyncErrors(async (req, res, next) => {
    let Job = await job.findById(req.params.id).select('+applicantsApplied');

    if (!Job) {
        return next(new ErrorHandler('Job not found', 404));
    }

    //Check  that if the job date has been passed or not
    if (Job.lastDate < new Date(Date.now())) {
        return next(new ErrorHandler('You cannot apply to this job,date is over', 400));
    }
    //Check the files
    if (!req.files) {
        return next(new ErrorHandler('Please upload file', 400));
    }
    const file = req.files.file;

    //check if user has applied before
    for (let i = 0; i < Job.applicantsApplied.length; i++) {
        if (Job.applicantsApplied[i].id === req.user.id) {
            return next(new ErrorHandler('You have already applied to this job', 400));
        }
    }

    //Check the file type
    const supportedFiles = /.docx|.pdf/;
    if (!supportedFiles.test(path.extname(file.name))) {
        return next(new ErrorHandler('Please upload document file', 400));
    }

    //Check document size
    if (file.size > process.env.MAX_FILE_SIZE) {
        return next(new ErrorHandler('Please upload file less than 2MB', 400));
    }
    //Renaming resume
    file.name = `${req.user.name}_${Job._id}${path.parse(file.name).ext}`;

    file.mv(`${process.env.UPLOAD_PATH}/${file.name}`, async err => {
        if (err) {
            console.log(err);
            return next(new ErrorHandler('Resume upload failed', 500));
        }
    })


    await job.findByIdAndUpdate(req.params.id, {
        $push: {
            applicantsApplied: {
                id: req.user.id,
                resume: file.name
            }
        }
    }, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });
    res.status(200).json({
        success: true,
        message: 'Applied to job successfully',
        data: file.name
    });

});