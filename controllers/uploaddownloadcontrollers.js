

const express = require('express');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');



const dotenv=require('dotenv');
const model = require('../schema');

dotenv.config()
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







const uploadone= async (req, res) => {
    // Assuming your file is passed in the request as 'file'
    const file = req.file;
  
    if (!file) {
      return res.status(400).send('No file uploaded.');
    }
  
    try {
      // Create a new model
      const newModel = await model.create({
        userId:req.body.userId,
        title: req.body.title, // Assuming title is sent in the request body
        file: file.originalname,
      });
  
      // Generate a pre-signed URL using AWS SDK v3
      const params = {
        Bucket: process.env.bucket,
        Key: file.originalname,
        ContentType: file.mimetype,
      };
  
      const command = new PutObjectCommand(params);
      const url = await getSignedUrl(s3, command, { expiresIn: 300 });
  
      // Send the pre-signed URL and model information to the client
      res.status(201).json({
        message: 'Model created successfully',
        data: {
          model: newModel,
          url: url,
        },
      });
    } catch (error) {
      console.error('Error creating model:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }



  const getall = async (req, res) => {
    const userId = req.query.userId;
  console.log(userId);
    try {
      // Assuming model.findById returns a promise
      const all = await model.find({ userId: userId });
  
      if (!all || all.length === 0) {
        return res.status(404).json({ error: 'No files found for the given user.' });
      }
  
      const urls = [];
  
      if (!Array.isArray(all)) {
        // Handle the case when `all` is not an array
        // You might want to log or handle this case accordingly
        console.error('Unexpected type returned by model.find:', typeof all);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
  
      for (const doc of all) {
        const params = {
          Bucket: process.env.bucket,
          Key: doc.file,
        };
  
        const command = new GetObjectCommand(params);
        const url = await getSignedUrl(s3, command, { expiresIn: 300 });
  
        console.log('Generated URL:', url);
  
        urls.push({ file: doc.file, url, title: doc.title, id: doc.id });
      }
  
      console.log('Pre-signed URLs for viewing:', urls);
      res.json(urls);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  





  const deleteFile = async (bucket, key) => {
    const s3Client = new S3Client({ region: process.env.region,
        credentials: {
            accessKeyId:process.env.accessKeyId,
            secretAccessKey: process.env.secretAccessKey,
          }


     }); // Create a new instance of S3Client
  
    const params = {
      Bucket: bucket,
      Key: key,
    };
  
    const command = new DeleteObjectCommand(params);
  
    try {
      // Call the send method on the S3 client instance
      await s3Client.send(command);
      console.log(`File deleted successfully: ${key}`);
    } catch (error) {
      console.error(`Error deleting file ${key}:`, error);
      throw error; // Propagate the error to the calling function
    }
  };
  
  const deleteone = async (req, res) => {
    const { id, file } = req.body;
    console.log('Received request to delete:', { id, file });
  
    try {
      // Delete record from the database
      const deletedRecord = await model.findByIdAndDelete(id);
  
      // Check if the record was found and deleted
      if (!deletedRecord) {
        return res.status(404).json({ message: 'Record not found' });
      }
  
      // Delete file from AWS S3
      const bucketName = process.env.bucket; // Replace with your S3 bucket name
  
      // Call the deleteFile function
      await deleteFile(bucketName, file);
  
      res.status(200).json({ message: 'Record and file deleted successfully' });
    } catch (error) {
      console.error('Error deleting record and file:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  










  module.exports={getall,uploadone,deleteone}