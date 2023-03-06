const formidable = require("formidable");
const express = require("express");
const app = express();
var admin = require("firebase-admin");

var serviceAccount = require("./prod.json");

// guru prod db json personal accout
// var serviceAccount = require("./guruProd.json");
const imgbbUploader = require("imgbb-uploader");
const bodyParser = require("body-parser");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://websitedata-9cdbf-default-rtdb.firebaseio.com/",

  //guru prod db url
  // databaseURL:"https://websiteguru-5ab2b-default-rtdb.firebaseio.com/"
});

const db = admin.database();
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));

// set add user data in firebase
app.post("/upload", async (req, res) => {
  const form = formidable({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error parsing form data.");
      return;
    }

    let { name, email, companyName, linkedinUrl, batchYear, url } = fields;

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

    res.send({ message: "success", data: response });
    return;

    res.send("File uploaded successfully.");
  });
});

// get all private page data from firebase
app.get("/getPrivatePageData", async (req, res) => {
  const ref = db.ref("form_data");
  ref.once("value").then((snapshot) => {
    const data = snapshot.val();
    console.log("getAllData", data);

    let privateDataArr=[]
    
    for(let key in data){
       if(data[key]){
           privateDataArr.push(data[key])
       }
    }
    return res.send({ ans:privateDataArr });
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
    return res.send({ data: snapshot.val() });
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

    const databaseRef = db.ref("form_data/" + key);
    const backRes = snapshot.val();

    if (req.body.approve === "true") {
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
    }
     else {
      
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

    console.log("arr", arr);

    for (let key in data) {
      if (data[key].approve === true) {
        console.log("object", data[key]);
        arr.push(data[key]);
      }
    }

    return res.send({ ans: arr });
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
    let responseArr=[]
    
    for(let key in data){
       if(data[key]){
           responseArr.push(data[key])
       }
    }
    return res.send({ ans: responseArr });
  });
});

app.listen(6000, () => {
  console.log("Server listening on port 6000.");
});
