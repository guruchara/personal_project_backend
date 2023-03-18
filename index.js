const formidable = require("formidable");
const cors = require("cors");
const express = require("express");
const app = express();
var admin = require("firebase-admin");

var nodemailer = require("nodemailer");
app.use(cors());

// guru prod db json  main personal accout
var serviceAccount = require("./guruProd.json");

// temp db service account local
// var serviceAccount = require("./prod.json");

const imgbbUploader = require("imgbb-uploader");
const bodyParser = require("body-parser");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // temp db Url local
  // databaseURL: "https://websitedata-9cdbf-default-rtdb.firebaseio.com/",

  //guru prod db url main url personal mail gurucharanchouhan7@gmail.com
  databaseURL:"https://websiteguru-5ab2b-default-rtdb.firebaseio.com/"
});

const db = admin.database();
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));

// set add user data in firebase add user in firebase db
app.post("/upload", async (req, res) => {
  const form = formidable({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error parsing form data.");
      return;
    }

    let {
      name,
      email,
      companyName = "",
      linkedinUrl = "",
      batchYear = "",
      url = "",
    } = fields;

    console.log("email20", email);
    const file = files.photo;
    let response = {};
    try {
      response = await imgbbUploader(
        "cbd44dd9b4da93cee7cea6b1c15ada92",
        file.filepath
      );
    } catch (error) {
      console.log("error", error);
    }

    const emailId = email ? email.replace(/[^\w\s]/gi, "") : "";
    const formDataRef = db.ref(`form_data/${emailId}`);

    if (!emailId) {
      return res.send({ message: "email not found " });
    }
    const formData = {
      name: name,
      email: email,
      companyName: companyName,
      imageUrl: response.url || "",
      linkedinUrl: url,
      batchYear: batchYear,
      updated: Date.now(),
      approve: false,
      reject: false,
    };

    formDataRef
      .set(formData)
      .then(() => {
        console.log("Form data saved successfully.");
      })
      .catch((error) => {
        console.error("Error saving form data:", error);
        res.send({ message: "bad request" });
      });

    res.send({
      message: "success",
      data: JSON.parse(JSON.stringify(response)),
    });
    return;

    res.send("File uploaded successfully.");
  });
});

// get all data of private page  from firebase
app.get("/getPrivatePageData", async (req, res) => {
  console.log("get api call");
  const ref = db.ref("form_data");
  ref.once("value").then((snapshot) => {
    const data = snapshot.val();
    console.log("getAllData", data);

    let privateDataArr = [];

    for (let key in data) {
      if (data[key]) {
        privateDataArr.push(data[key]);
      }
    }
    return res.send({ ans: JSON.parse(JSON.stringify(privateDataArr)) });
  });
});

// get specifiec node data from firebase database
app.get("/getData", async (req, res) => {
  const { approve, reject, email } = req.body;

  console.log("bodyData", req.body);
  const key = email ? email.replace(/[^\w\s]/gi, "") : "";

  const ref = db.ref("form_data");
  ref.child(key).on("value", function (snapshot) {
    console.log("value", snapshot.val());
    return res.send({ data: JSON.parse(JSON.stringify(snapshot.val())) });
  });
});

//  edit private page data like approve reject

app.post("/editPrivatePageData", async (req, res) => {
  const { approve, reject, email } = req.body;

  const key = email ? email.replace(/[^\w\s]/gi, "") : "";

  if (!key) {
    return res.send("bad Request mail not found");
  }

  const ref = db.ref("form_data");

  ref.child(key).on("value", function (snapshot) {
    console.log("getPrviateData115", snapshot.val());

    if (!snapshot.val()) {
      return;
    }

    const databaseRef = db.ref(`form_data/${key}`);

    const backRes = snapshot.val();

    if (approve) {
      databaseRef
        .update({
          name: backRes.name,
          batchYear: backRes.batchYear || 2019,
          companyName: backRes.companyName || "",
          linkedinUrl: backRes.linkedinUrl || "",
          email: backRes.email || "",
          approve: true,
          reject: false,
          updated: Date.now(),
          imageUrl: backRes.imageUrl || "",
        })
        .then(() => {
          console.log("Data updated successfully!");
          res.send({ message: "Data updated successfully" });
          return;
        })
        .catch((error) => {
          console.error("Error updating data:", error);
        });
    } else {
      databaseRef
        .update({
          approve: false,
          reject: true,
          updated: Date.now(),
        })
        .then(() => {
          console.log("reject failed!");
          return res.send({ message: "Data Rejected updated successfully" });
        })
        .catch((error) => {
          console.error("Error updating data:", error);
        });
    }
  });
});

// get all card data on home students who already placed this send only filtering data

app.get("/allCardsData", async (req, res) => {
  const ref = db.ref("form_data");

  ref.once("value").then((snapshot) => {
    const data = snapshot.val();
    console.log("allData191", data);
    let arr = [];

    for (let key in data) {
      if (data[key].approve === true) {
        console.log("object", data[key]);
        arr.push(data[key]);
      }
    }

    return res.send({ ans: JSON.parse(JSON.stringify(arr)) });
  });
});

// add career job information
app.post("/addCareer", async (req, res) => {
  const form = formidable({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error parsing form data.");
      return;
    }

    let { email, link, companyName } = fields;

    console.log("email20", email);
    const file = files.photo;
    let response = {};
    try {
      response = await imgbbUploader(
        "cbd44dd9b4da93cee7cea6b1c15ada92",
        file.filepath
      );
    } catch (error) {
      console.log("error", error);
    }

    const emailId = email ? email.replace(/[^\w\s]/gi, "") : "";

    const careerDataRef = db.ref(`career_data/${emailId}`);
    // return res.send({message:'yaa'})
    const careerData = {
      companyName: companyName || "",
      jobUrl: link || "",
      email: email || "",
      imageUrl: response.url || "",
    };

    careerDataRef
      .set(careerData)
      .then(() => {
        console.log("Form data saved successfully.");
        return res.send({ message: "career data uploaded successfully" });
      })
      .catch((error) => {
        console.error("Error saving form data:", error);
        res.send({ message: "bad request" });
      });
  });
});

// get career data from carerr_data firebase database
app.get("/getCareerData", async (req, res) => {
  const ref = db.ref("career_data");
  ref.once("value").then((snapshot) => {
    const data = snapshot.val();
    console.log("CareerData", data);
    let responseArr = [];

    for (let key in data) {
      if (data[key]) {
        responseArr.push(data[key]);
      }
    }

    return res.send({ ans: JSON.parse(JSON.stringify(responseArr)) });
  });
});

//  add contest registration data
app.post("/addContestInfo", async (req, res) => {
  let { email, name, passoutYear, branch, phoneNumber } = req.body;
  console.log("name274", name, passoutYear, branch, phoneNumber);

  const emailId = email ? email.replace(/[^\w\s]/gi, "") : "";

  if (!email) {
    return res.send({ message: "failed mail not found" });
  }
  const contestDataRef = db.ref(`contest_Data/${emailId}`);

  const contestData = {
    name: name || "",
    branch: branch || "",
    email: email || "",
    passoutYear: passoutYear.toString() || "",
    phoneNumber: phoneNumber.toString() || "",
  };

  contestDataRef
    .set(contestData)
    .then(() => {
      console.log("contest data submittted succesfully");
      return res.send({ message: "contest data submit successfully" });
    })
    .catch((err) => {
      console.log("err", err);
      return res.send({ message: "something went wrong" });
    });

  return res.send({ message: "success" });
});

app.post("/sendContestMail", async (req, res) => {

  let contestLink=req.body.contestUrl || ''
  if(!contestLink){
    return res.send({message:' please check link found empty :('})
  }
  const ref = db.ref("contest_Data");
  ref.once("value").then((snapshot) => {
    const data = snapshot.val();
    console.log("allData316", data);
   
    let arr = Object.keys(data);

    let emailArr = [];

    for (let i = 0; i < arr.length; i++) {
      emailArr.push({
        name: data[arr[i]].name,
        email: data[arr[i]].email,
      });
    }

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "gurucharan.chouhan@zunpulse.com",
        pass: "cczkxzbwewgrbmxz",
      },
    });

    for (let i = 0; i < emailArr.length; i++) {
      var mailOptions = {
        from: "gurucharan.chouhan@zunpulse.com",
        to: emailArr[i].email,
        subject: "Contest Link ",
        html: `<h3 style="color:gray; font-family:sans-serif">Thankyou for participate in Coding Event</h3><p>Hey , ${emailArr[i].name}</p> <p style="font-family:sans-serif;font-size:12px; margin:0px">Start Coding Test by using below link</p><p style="font-family:sans-serif; font-size:14px; margin:0px">Link =) ${contestLink}</p> 
       <p> -------------------------------------------------------</p>
        <p style="font-family:sans-serif">All the Best :)<br style="font-family:sans-serif; font-size:14px">Regards</br><br><b style="font-family:sans-serif">JitCoder's_Comm.</b><br></p>
       <p>-------------------------------------------------------</p>`,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
    }

    return res.send({ data: emailArr.length});
  });
});

app.post("/setFeedback", async (req, res) => {
  const { name, email, feedback, starCount } = req.body;

  console.log("name", name, email, feedback, starCount);

  const emailId = email ? email.replace(/[^\w\s]/gi, "") : "";

  if (!email) {
    return res.send({ message: "failed mail not found" });
  }

  const feedbackDataRef = db.ref(`feedback_data/${emailId}`);

  const feedbackData = {
    name: name || "",
    email: email || "",
    feedback:feedback || '',
    starCount:starCount || 0,
    feedbackDate: Date.now(),
  };

  feedbackDataRef
    .set(feedbackData)
    .then(() => {
      console.log(" feedback submittted succesfully");
      return res.send({ message: "feedback data submit successfully" });
    })
    .catch((err) => {
      console.log("err", err);
      return res.send({ message: "something went wrong" });
    });
});

app.get('/getFeedbackData',async(req,res)=>{

  const ref = db.ref("feedback_data");
  ref.once("value").then((snapshot) => {
    const data = snapshot.val();

    let feedbackDataArr = [];

    for (let key in data) {
      if (data[key]) {
        feedbackDataArr.push(data[key]);
      }
    }

    // sort data on the basis of star
    feedbackDataArr.sort(function(a,b){
      return new Date(b.starCount) - new Date(a.starCount);
    });

    return res.send({ ans:feedbackDataArr});
  });

})

// const port = process.env.PORT || 4040;

app.listen(4041, () => {
  console.log(`server listesting on ${4041}`);
});

module.exports = app;
