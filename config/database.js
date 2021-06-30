const mangoose = require('mongoose');

const connectDatabase=()=>{
    mangoose.connect(process.env.DB_URI,{
    useNewUrlParser:true,
    useUnifiedTopology:true,
    useCreateIndex:true

}).then(con =>{
    console.log(`mongoDB database connected with host:${con.connection.host}`
    );
});
}
module.exports = connectDatabase;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               ;