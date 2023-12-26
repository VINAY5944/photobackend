const mongoose=require('mongoose')
const dotenv=require('dotenv')
dotenv.config()
const connection=async()=>{
    try {
        const connect= await mongoose.connect(`${process.env.mongooseconnectionstring}`)
        if(connect){
           console.log('data base is active');
        }
        else{
            console.log('data base not active');
        }
    } catch (error) {
        console.log("there is an error",error);
        process.exit()
    }
  
}
module.exports=connection
