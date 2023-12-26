
const bcrypt=require("bcryptjs")

const jwt=require('jsonwebtoken');

const dotenv=require("dotenv");
const usermodel = require('../userschema');
dotenv.config()
///registerning a new user
const tokengenerate=(id)=>{
    return jwt.sign({id},process.env.JWT_SECRET,{
    
    expiresIn:'30d'
    
    })}





const register=async(req,res)=>{

    const {name,email,password,}=req.body
   const salt=await bcrypt.genSalt(10)
   const hashedpassword= await bcrypt.hash(password,salt);
   const alreadyexist=await usermodel.findOne({email})

if(alreadyexist){
res.json('already exist')

}
else{
    const createuser=await usermodel.create({
        name,email,password:hashedpassword
    })

    res.json({
        Id:createuser._id,
        name:createuser.name,
        password:createuser.password,
        token:tokengenerate(createuser._id)
        });
}
} 




////login 

const login=async(req,res)=>{

    const {email,password}=req.body
   
   const loggedinuser=await usermodel.findOne({email})


   if(loggedinuser&&(await bcrypt.compare(password,loggedinuser.password))){

    res.json({

        Id:loggedinuser._id,
        name:loggedinuser.name,
        email:loggedinuser.email,
        token:tokengenerate(loggedinuser._id)
        });
   }

}

module.exports={register,login};
