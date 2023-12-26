const  mongoose  = require("mongoose");

const schema=mongoose.Schema({
    userId: { type: String, required: true },
    title: { type: String, required: true },
    file: { type: String, required: true },
})
const model=mongoose.model('pfds',schema);












module.exports=model