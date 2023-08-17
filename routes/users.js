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

router.get('/graduateCensus', function (req, res, next) {
  var sql = 'SELECT course_name FROM ssk.m_courses;';
  db.query(sql, function (err, data, fields) {
    if (err) throw err;
    res.render('graduateCensus', { title: 'User List', courseList: data });
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
  console.log(req.headers.host);
  var logoURL = '';
  if(req.headers.host == 'ssksamajrjnr.org:8080'){
     logoURL = "/../images/banner.jpg";
  }
  else if(req.headers.host == 'ssksamajwgl.org:8080'){
    logoURL = "/../images/sskWglLogo.jpg";
  }
     
  var sql = 'SELECT ms.surName, mg.gotra FROM ssk.m_surnames ms, ssk.m_gotra mg where ms.gotra_id =  mg.id order by surName;';
  db.query(sql, function (err, data, fields) {
    let result = Object.values(JSON.parse(JSON.stringify(data)));
    let surNames = []; let gotras = [];
    for (var i = 0; i < result.length; i++) {
      surNames.push(result[i].surName);
      gotras.push(result[i].gotra);
    }
    if (err) throw err;
    else {
      var sql = 'SELECT QUADESC,code FROM ssk.m_qualifications;';
      db.query(sql, function (err, data, fields) {
        let result2 = Object.values(JSON.parse(JSON.stringify(data)));
        if (err) throw err;
        else{
  res.render('marriageBuero', { surNameList: surNames, gotrasList: gotras, qualificationa: result2, logoURL : logoURL});
        }
      });
    }
    });
});

router.post("/uploadpp", function (req, res, next) {

  // Error MiddleWare for multer file upload, so if any
  // error occurs, the image would not be uploaded!
  upload(req, res, function (err) {
    var isDataInserted = 0, isPhotoUploaded = 0, inserId;
    const MBDetails = req.body;
    MBDetails.photo = photoFileName;
    var sql = 'INSERT INTO ssk.marriage_bureau_details SET ?';
    db.query(sql, MBDetails, function (error, data, result) {
      if (error) {
        //throw error;
        // ERROR occurred (here it can be occurred due
        // to uploading image of size greater than
        // 1MB or uploading different file type)
        res.render('error_1', { error: "Error ; " + error.message + " please go back and check the error" });
      }
      else {
        isDataInserted = 1;
        insertId = data.insertId;
        if (isDataInserted == 1 && isPhotoUploaded == 1) {
          sendEmail(insertId, MBDetails);
        }
        else {
          res.render('error_1', { error: "Error : Please go back and check the error" });
        }
      }
    });
    if (err) {
      res.render('error_1', { error: "Error ; " + err.message + " please go back and check the error" });
    }
    else {
      photoFileName = "";
      isPhotoUploaded = 1;
    }
    res.render('success');
  });
});

function sendEmail(insertId, MBDetails) {
  var htmlTable = '';
  var sql = "SELECT t2.id, CONCAT(t2.surName, ' ', t2.name) AS 'Full Name', t2.gender AS 'Gender', t2.gotra AS 'Gotra', t2.dob AS 'DOB', mq2.QUADESC AS 'Qualification', "
          + " t2.fathersName AS 'Fathers Name', t2.fathersMobNum AS 'Fathers Mobile Number', t2.cityOfBirth AS 'City of Birth', t2.placeOfCurrentStay AS 'Current Stay', t2.status AS 'Status' "
          + " FROM ssk.marriage_bureau_details t1, ssk.marriage_bureau_details t2, ssk.m_qualifications mq1, ssk.m_qualifications mq2 WHERE mq1.code = t1.QUACODE AND mq2.code = t2.QUACODE "
          + " AND t1.id in( "+insertId+" ) AND (t2.status = 'UNMARRIED' OR t2.status = 'DIVORCED') AND CASE WHEN t1.gender = 'MALE' THEN t2.dob >= t1.dob AND t2.gotra != t1.gotra AND t1.gender != t2.gender "
          + " AND mq1.GROUP = mq2.GROUP WHEN t1.gender = 'FEMALE' THEN t2.dob <= t1.dob AND t2.gotra != t1.gotra AND t1.gender != t2.gender AND mq1.GROUP = mq2.GROUP END ORDER BY t1.id;";
  db.query(sql, function (err, results, fields) {

    let table = "<head> <style> table { border: 1px solid black; border-collapse: collapse; width: 100%; } th, td { border: 1px solid black; padding: 8px; text-align: left; } th { background-color: #f2f2f2; } </style> </head> <table>";

    // Add header row
    table += '<tr>';
    for (let i = 0; i < fields.length; i++) {
      table += '<th>' + fields[i].name + '</th>';
    }
    table += '</tr>';

    // Add data rows
    for (let i = 0; i < results.length; i++) {
      let row = results[i];
      table += '<tr>';
      for (let key in row) {
        table += '<td>' + row[key] + '</td>';
      }
      table += '</tr>';
    }

    table += '</table>';

    htmlTable = table;
    if (err) {
      res.render('error_1', { error: "Error ; " + err.message + " please go back and check the error" });
    }
    else {
      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'sandeep.sha.vishwanath@gmail.com',
          pass: 'rkfndaexstskjogl'
        }
      });
      var subject = "";
      if (MBDetails.gender == "MALE") {
         subject = 'A new Groom added - ' + MBDetails.surName + " " + MBDetails.name;
      }
      else {
         subject = 'A new Bride added - ' + MBDetails.surName + " " + MBDetails.name;
      }
      var mailOptions = {
        from: 'sandeep.sha.vishwanath@gmail.com',
        to: 'sandeep_sha@hotmail.com,ssklaginmanch@gmail.com,chandrakanthbadam@gmail.com',
        subject: subject,
        html: '<h3>Here are the Details</h3> '
          + '<p>Full Name : ' + MBDetails.surName + " " + MBDetails.name + '</p>'
          + '<p>Gender : ' + MBDetails.gender + '</p>'
          + '<p> Fathers Name : ' + MBDetails.fathersName + '</p>'
          + '<p> Mothers Name : ' + MBDetails.mothersName + '</p>'
          + '<p> Gotra :' + MBDetails.gotra + '</p>'
          + '<p> Janma Naam : ' + MBDetails.janmaNaam + '</p>'
          + '<p> Nakshatar : ' + MBDetails.nakshatar + '</p>'
          + '<p> Rashi : ' + MBDetails.rashi + '</p>'
          + '<p> Educational Qualification : ' + MBDetails.QUACODE + '</p>'
          + '<p> Place of Birth : ' + MBDetails.placeOfBirth + '</p>'
          + '<p> Place of Current Stay : ' + MBDetails.placeOfCurrentStay + '</p>'
          + '<p> Job / Proffession : ' + MBDetails.proffession + '</p>'
          + '<p> Mobile Number of Father : ' + MBDetails.fathersMobNum + '</p>'
          + '<p> Mobile Number of Mother : ' + MBDetails.mothersMobNum + '</p>'
          + '<p> Status : ' + MBDetails.status + '</p>'
          + '<h3>Found Below Matches : </h3> '
          + htmlTable
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
    }
    //res.render('marriageBuero', { surNameList: surNames, gotrasList: gotras });
  });


}
router.post('/updateGraduateCensus', function (req, res, next) {
  const userDetails = req.body;
  var sql = 'INSERT INTO graduate_senses SET ?';
  db.query(sql, userDetails, function (err, data) {
    if (err) {
        res.render('error_1', { error: "Error : " + err.sqlMessage + " please go back and check the error" });
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
