const formidable = require("formidable");
const express = require("express");
const app = express();
var admin = require("firebase-admin");
var serviceAccount = require("./prod.json");
const imgbbUploader = require("imgbb-uploader");
const bodyParser=require('body-parser')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://websitedata-9cdbf-default-rtdb.firebaseio.com/",
});

const db = admin.database();
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));

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

app.get("/getData", async (req, res) => {

  const { approve, reject, email } = req.body;

  console.log("bodyData",req.body)
  const key = email ? email.replace(/[^\w\s]/gi, "") : "";

  const ref = db.ref("form_data/" + key);
  ref.once("value", (snapshot) => {
    const data = snapshot.val();
    console.log(data);
    res.send({result:data})
  });
});

app.listen(6000, () => {
  console.log("Server listening on port 6000.");
});
