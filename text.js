app.post("/editPrivatePageData", async (req, res) => {
    const { approve, reject, email } = req.body;
  
    const key = email ? email.replace(/[^\w\s]/gi, "") : "";
  
    if (!key) {
      return res.send("bad Request mail not found");
    }
  
    const ref = db.ref("form_data");
    console.log("approvedData", req.body.approve);
  
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
  