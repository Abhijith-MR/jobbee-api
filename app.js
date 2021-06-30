const express = require('express');
const app = express();
const dotenv=require('dotenv');
const errorMiddleware = require('./middlewares/errors');
const connectDatabase = require('./config/database');
const ErrorHandler = require('./config/utils/errorHandler');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const bodyParser = require('body-parser');

//Setting up config.env file varibales
dotenv.config({path:'./config/config.env'});


//Handling Uncaught Exception
// process.on('uncaughtException',err=>{
//     console.log(`Error:${err.message}`);
//        console.log('Shutting down the server due to uncaughtException');
//        process.exit(1);
// })

//connecting to database
connectDatabase();


//setup security headers
app.use(helmet());

// setup body parser
app.use(express.json());

// setop cookie parser
app.use(cookieParser());

//Handle file uploads
app.use(fileUpload());

//Sanitize data
app.use(mongoSanitize());

//prevent XSS attacks
app.use(xssClean());

//Prevent Paramter Pollution Attacks
app.use(hpp());
//Rate Limit
const limiter = rateLimit({
    windowMs: 10*60*1000, //10 Minutes
    max:100
});
app.use(limiter);

//Setup CORS - Accessible by other domains
app.use(cors());

// Importing all routes
const jobs = require('./routes/jobs');
const auth = require('./routes/auth');
const user = require('./routes/user');

const errors = require('./middlewares/errors');

app.use('/api/v1',jobs);
app.use('/api/v1',auth);
app.use('/api/v1',user);

//Handle Unhandle Routes
app.all('*',(req,res,next)=>{
    next(new ErrorHandler(`${req.originalUrl} route not found`,404));
});
// Middlewares to handle errors
app.use(errorMiddleware);



const PORT=process.env.PORT
const server=app.listen(PORT,()=>{
    console.log(`Server started on port ${process.env.PORT} in ${process.env.NODE_ENV} mode. `);
});
   //Handling Unhandled Promise Rejection
//    process.on('unhandledRejection',err =>{
//        console.log(`Error:${err.message}`);
//        console.log('Shutting down the server due to unhandled promise rejection');
//        server.close(()=>{
//            process.exit(0);
//        })
//    });

   