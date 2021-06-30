const mongoose = require('mongoose');
const validator = require('validator');
const slugify = require('slugify');
const geoCoder = require('../config/utils/geocoder');

const jobSchema = new mongoose.Schema({
    title:{
        type:String,
        required : [true,'Please enter the job title'],
        trim: true,
        maxlength:[100,'Job title cannot exceed 100 character']
    },
    slug:String,
    description:{
        type:String,
        required:[true,'Please enter the job description'],
        maxlength:[1000,'Job description cannot excedd 1000 characters']
    },
    email:{
        type:String,
        validate:[validator.isEmail,'Please enter the valid email adress']
    },
    address:{
        type:String,
        required:[true,'Please enter an address']
    },
    location:{
        type:{
            type:String,
            enum:['Point']
        },
        coordinates:{
            type:[Number],
            index:'2dsphere'
        },
        formattedAdress: String,
        city: String,
        state: String,
        zipcode: String,
        country :String

    },
    company:{
        type:String,
        required:[true,'Please add a company']
    },
    industry:{
        type:[String],
        required:[true,'Please enter industry for this job'],
        enum:{
            values:[
                'Business',
                'Information Technology',
                'Banking',
                'Education/Training',
                'Telecommunicatons',
                'Others'
            ],
            message:'Please select coorect options for industry'
        }
    },
    jobType:{
        type:String,
        required:[true,'Please enter a jobtype'],
        enum:{
            values:[
                'Permanent',
                'Temporary',
                'Internshp'
            ],
            message:'Please select correct options for jobType'
        }
    },
    minEducation:{
        type:String,
        required:[true,'Please enter minimum education for this role'],
        enum:{
            values:[
                'Bachelors',
                'Masters',
                'PhD'
            ],
            message:'Please select coorect options for minEducation'
        }
    },
    positions:{
        type:Number,
        default:1
    },
    experience:{
        type:String,
        required:[true,'Please enter an experience for this role'],
        enum:{
            values:[
                'No Experience',
                '1 Year - 2 Year',
                '2 Year - 4 Year',
                '2 Year - 4 Year',
                '5+ Year'
            ],
            message:'Please select coorect options for experience'
        }
    },
    salary:{
        type:Number,
        required:[true,'Please enter the expected salary for this job.']
    },
    postingDate:{
        type:Date,
        default:Date.now
    },
    lastDate:{
        type:Date,
        default:new Date().setDate(new Date().getDate()+7)
    },
    applicantsApplied:{
        type:[Object],
        select:false
    },
    user : {
        type:mongoose.Schema.ObjectId,
        ref:'User',
        required:true
    }
});
jobSchema.pre('save',function(next){
    console.log(this.title);
    this.slug = slugify(this.title,{lower:true});
    next();
});

jobSchema.pre('save',async function(next){
    console.log(this.address);
    const loc = await geoCoder.geocode(this.address);
    
    this.location={
        type:'Point',
        coordinates:[loc[0].longitude,loc[0].latitude],
        formattedAdress:loc[0].formattedAdress,
        city:loc[0].city,
        state:loc[0].stateCode,
        zipcode:loc[0].zipcode,
        country:loc[0].country
    }
});
module.exports = mongoose.model('job',jobSchema);