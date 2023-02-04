var express = require('express');
var router = express.Router();
var db = require('../database');
var popup = require('alert');
const path = require('path');
let alert = require('alert');
var nodemailer = require('nodemailer');




const multer = require("multer");
var photoFileName = "";

var storage = multer.diskStorage({
  destination: function (req, file, cb) {

    // Uploads is the Upload_folder_name
    cb(null, "uploads")
  },
  filename: function (req, file, cb) {
    let ts = Date.now();
    let date_ob = new Date(ts);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();
    let time = date_ob.getHours() + "_" + date_ob.getMinutes();
    photoFileName = date + "_" + month + "_" + year + "_" + time + "_" + file.originalname;
    cb(null, photoFileName);
  }
})

// Define the maximum size for uploading
// picture i.e. 1 MB. it is optional
const maxSize = 10 * 1000 * 1000;

var upload = multer({
  storage: storage,
  limits: { fileSize: maxSize },
  fileFilter: function (req, file, cb) {

    // Set the filetypes, it is optional
    var filetypes = /jpeg|jpg|png/;
    var mimetype = filetypes.test(file.mimetype);

    var extname = filetypes.test(path.extname(
      file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb("Error: File upload only supports the "
      + "following filetypes - " + filetypes);
  }

  // mypic is the name of file attribute
}).single("photo");

router.get('/graduatesenses', function (req, res, next) {
  var sql = 'SELECT course_name FROM ssk.m_courses;';
  db.query(sql, function (err, data, fields) {
    if (err) throw err;
    res.render('graduateSenses', { title: 'User List', courseList: data });
  });
});

router.get('/communications', function (req, res, next) {
  var sql = 'SELECT gram_sabha FROM ssk.m_gram_sabha;';
  db.query(sql, function (err, data, fields) {
    if (err) throw err;
    res.render('commSkills', { title: 'User List', gramSabhaList: data });
  });
});

router.get('/laginManch', function (req, res, next) {
  var sql = 'SELECT ms.surName, mg.gotra FROM ssk.m_surnames ms, ssk.m_gotra mg where ms.gotra_id =  mg.id order by surName;;';
  db.query(sql, function (err, data, fields) {
    let result = Object.values(JSON.parse(JSON.stringify(data)));
    let surNames = []; let gotras = [];
    for (var i = 0; i < result.length; i++){
      surNames.push(result[i].surName);
      gotras.push(result[i].gotra);
    }
    if (err) throw err;
    res.render('marriageBuero', { surNameList: surNames, gotrasList: gotras});
  });
});

router.post("/uploadpp", function (req, res, next) {

  // Error MiddleWare for multer file upload, so if any
  // error occurs, the image would not be uploaded!
  upload(req, res, function (err) {
    const MBDetails = req.body;
    MBDetails.photo = photoFileName;
    var sql = 'INSERT INTO ssk.marriage_bureau_details SET ?';
    db.query(sql, MBDetails, function (error, data) { 
        if (error) {
       //throw error;
      // ERROR occurred (here it can be occurred due
      // to uploading image of size greater than
      // 1MB or uploading different file type)
      res.render('error_1',{error : "Error ; "+error.message+ " please go back and check the error"});
    }
    
  });
    if (err) {
      // ERROR occurred (here it can be occurred due
      // to uploading image of size greater than
      // 1MB or uploading different file type)
      res.render('error_1',{error : "Error ; "+err.message+ " please go back and check the error"});
    }
    else {
      photoFileName = "";

      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'chandrakanthbadam@gmail.com',
          pass: 'gknsidhwmbcfjzas'
        }
      });
      
      var mailOptions = {
        from: 'chandrakanthbadam@gmail.com',
        to: 'saigopal009@gmail.com',
        subject: 'Sending Email using Node.js',
        html: '<h1>Welcome</h1><p>That was easy!</p>'
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });

      res.render('success')
    }
  });
});

router.post('/updateGraduateSenses', function (req, res, next) {
  const userDetails = req.body;
  var sql = 'INSERT INTO graduate_senses SET ?';
  db.query(sql, userDetails, function (err, data) {
    if (err) {
      if (err.code == "ER_DUP_ENTRY") {
        console.log(err);
        res.render('error');
        // throw err;
      }
    }
    else {
      console.log("User data is inserted successfully ");
      res.render('success');
    }
  });
});

router.post('/updateRegistration', function (req, res, next) {
  const userDetails = req.body;
  if (userDetails.gramSabha == "Others") {
    userDetails.gramSabha = userDetails.others;
    delete userDetails.others;
  }
  else {
    delete userDetails.others;
  }
  var sql = 'INSERT INTO registrations SET ?';
  db.query(sql, userDetails, function (err, data) {
    if (err) {
      if (err.code == "ER_DUP_ENTRY") {
        console.log(err);
        res.render('error');
        // throw err;
      }
    }
    else {
      console.log("User data is inserted successfully ");
      res.render('success');
    }
  });
});
module.exports = router;
