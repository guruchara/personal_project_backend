const formidable = require('formidable');
const express = require('express');
const app = express();
var admin = require("firebase-admin");
var serviceAccount = require("./prod.json");
const imgbbUploader = require("imgbb-uploader");


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount), 
    databaseURL: "https://websitedata-9cdbf-default-rtdb.firebaseio.com/"
});

const db = admin.database();

app.post('/upload', async (req, res) => {
    const form = formidable({ multiples: true });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error parsing form data.');
            return;
        }

        let { name, email } = fields;
        const file = files.photo;
        let response = {}
        // try {
        //     response = await imgbbUploader("cbd44dd9b4da93cee7cea6b1c15ada92", file.filepath)
        // } catch (error) {
        //     console.log("error", error)
        // }

        email = email.replace(/[^\w\s]/gi, '')

        console.log("name", name)
        console.log("email", email)
        console.log("files", file.filepath)

        const formDataRef = db.ref(`form_data/${email}`);

        const formData = {
            name: 'John Doe',
            email: 'johndoe@example.com',
            link: 'https://www.zunpulse.com'
        };

        formDataRef.set(formData)
            .then(() => {
                console.log('Form data saved successfully.');
            })
            .catch((error) => {
                console.error('Error saving form data:', error);
            });


        res.send({ message: 'success'})
        return

        res.send('File uploaded successfully.');
    });
});

app.listen(5000, () => {
    console.log('Server listening on port 5000.');
});


