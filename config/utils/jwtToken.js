// Create and Send token and save in cookie
const sendToken = (user,statusCode,res)=>{
    //Create a JWT token
    const token = user.getJwtToken();

    //options for cookie
    const options = {
        expires:new Date(Date.now() + process.env.COOKIE_EXPIRES_TIME * 20*60*60*1000),
        httpOnly: true
    };
    res
         .status(statusCode)
         .cookie('token',token,options)
         .json({
             success:true,
             token
         });
}       
module.exports = sendToken;