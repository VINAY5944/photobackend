const express = require('express');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const model = require('./schema');




const dotenv=require('dotenv');
const connection = require('./mongooseconfig');
const cors=require('cors');
const { uploadone, getall, deleteone } = require('./controllers/uploaddownloadcontrollers');
const { login, register } = require('./controllers/Signuplogin');
const protect = require('./middleware/verification');


dotenv.config()

const app=express();

connection()
app.use(express.json());

app.use(cors());



const s3 = new S3Client({
    region: process.env.region,
    credentials: {
      accessKeyId:process.env.accessKeyId,
      secretAccessKey: process.env.secretAccessKey,
    },
});


const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.bucket,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, file.originalname);
    },
  }),
});




app.post('/upload', upload.single('file'),uploadone);
  






  app.get("/get", async (req, res) => {
    try {
      const all = await model.find();
      console.log('All:', all); // Log the entire result to see its structure
  
      const objectKey = all && all.length > 0 ? `${all[0].file}` : '';
      console.log('Object Key:', objectKey); // Log the objectKey to check if it's defined
  
      if (!objectKey) {
        throw new Error('Object key is undefined or empty');
      }
  
      const getObject = async (key) => {
        const params = {
          Bucket: process.env.bucket,
          Key: key,
        };
  
        const command1 = new GetObjectCommand(params);
        const url = await getSignedUrl(s3, command1, { expiresIn: 300 });
  
        return url;
      };
  
      const url = await getObject(objectKey);
      console.log('Pre-signed URL:', url);
      res.json(url);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


///routes

  app.get("/api/images",protect,getall); 
  app.delete('/delete',protect,deleteone)



///login routes

app.post('/login',login)
app.post("/register",register)




const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



