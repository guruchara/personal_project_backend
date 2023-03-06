const formidable = require("formidable");
const express = require("express");
const app = express();
var admin = require("firebase-admin");
var serviceAccount = require("./prod.json");
const imgbbUploader = require("imgbb-uploader");
const bodyParser = require("body-parser");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://websitedata-9cdbf-default-rtdb.firebaseio.com/",
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

    console.log("name", name);
    console.log("email", email);
    console.log("files", file.filepath);

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
app.get('/getPrivatePageData',async(req,res)=>{

  const ref = db.ref("form_data");
  ref.once('value').then((snapshot) => {
    const data = snapshot.val();
    console.log("getAllData",data);
    return res.send({ans:data})
  });

})


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
app.get('/editPrivatePageData',async(req,res)=>{
  const { approve, reject, email } = req.body;

  const key = email ? email.replace(/[^\w\s]/gi, "") : "";

  if(!key){
    return res.send("bad Request mail not found")
  }
  const ref = db.ref("form_data");

  if(req.body.approve){

    ref.child(key).on("value", function (snapshot) {
      console.log("getPrviateData115", snapshot.val());
      // return res.send({ data: snapshot.val() });

      if (!snapshot.val()) {
        return;
      }

      // Assume that you have already initialized Firebase and obtained a reference to your database
      const databaseRef =db.ref("form_data"+key);

      // Update data at a specific node
      databaseRef
        .update({
          name: "varun",
          batchYear:2022
        })
        .then(() => {
          console.log("Data updated successfully!");
        })
        .catch((error) => {
          console.error("Error updating data:", error);
        });

    });

  }

 



   
   
})

app.listen(6000, () => {
  console.log("Server listening on port 6000.");
});
