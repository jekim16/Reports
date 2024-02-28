const { Pool } = require("pg");
const fs = require("fs");
const express = require("express");
const multer = require("multer");

const app = express();

const pool = new Pool({
  user: "postgres",
  host: "129.150.47.67",
  database: "postgres",
  password: "gismap",
  port: 5432,
});

const upload = multer({ dest: "public/image/uploads/" });

app.use(express.static("public"));
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: false }));
app.use("public/image/uploads", express.static("uploads"));


app.get("/getDistrict", async (req, res) => {
  try {
    const result = await pool.query("SELECT DISTINCT admindistrict, districtcode FROM brgy_code ORDER BY districtcode ASC");

    if(result.rows.length > 0 ) {
      res.json(result.rows);
    } else {
      res.json({ error: "No result!" });
    }
  } catch (error) {
    console.error("Error executing SQL query", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/getBarangay/:district", async (req, res) => {
  const district = req.params.district;
  try {
    const result = await pool.query(`SELECT brgycodelast3, brgy FROM brgy_code WHERE districtcode = '${district}' ORDER BY brgycode ASC`);

    if(result.rows.length > 0 ) {
      res.json(result.rows);
    } else {
      res.json({ error: "No result!" });
    }
  } catch (error) {
    console.error("Error executing SQL query", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/getPerimeters", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM prop_id_perims");

    if(result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.json({ error: "No result!" });
    }
  } catch (error) {
    console.error("Error executing SQL query", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/updatePerimeters", async (req, res) => {
  const prepared_name = req.body.prepared_name;
  const prepared_position = req.body.prepared_position;
  const verified_name = req.body.verified_name;
  const verified_position = req.body.verified_position;
  const approved_name = req.body.approved_name;
  const approved_position = req.body.approved_position;
  const id = req.body.id;

  try {
    const result = await pool.query("UPDATE prop_id_perims SET prepared_name = $1, prepared_position = $2, verified_name = $3, verified_position = $4, approved_name = $5, approved_position = $6 WHERE id = $7", [prepared_name, prepared_position, verified_name, verified_position, approved_name, approved_position, id]);

    if (result) {
      res.json({ success: "Successfully updated perimeters" });
    } else {
      res.json({ error: "No result found" });
    }
  } catch (error) {
    console.error("Error executing SQL query", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/upload", upload.single("image"), (req, res) => {
  const { file } = req;
  const { image_type } = req.body;
  const imageBuffer = fs.readFileSync(file.path);

  pool.query(
    "INSERT INTO prop_id_image (filename, path, path_find, image_type) VALUES ($1, $2, $3, $4)",
    [file.originalname, imageBuffer, file.filename, image_type],
    (error, result) => {
      if (error) {
        console.error(error);
        res.status(500).json({ message: "Error uploading image" });
      } else {
        res.status(200).json({ message: "Image uploaded successfully" });
      }
    }
  );
});

app.put("/update", upload.single("image"), (req, res) => {
  const { file } = req;
  const { image_type } = req.body;
  const imageBuffer = fs.readFileSync(file.path);

  pool.query(
    "UPDATE prop_id_image SET filename = $1, path = $2, path_find = $3 WHERE image_type = $4",
    [file.originalname, imageBuffer, file.filename, image_type],
    (error, result) => {
      if (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating image" });
      } else {
        res.status(200).json({ message: "Image updated successfully" });
      }
    }
  );
});

app.get("/delete", async (req, res) => {
  const path_find = req.query.path_find;
  const filePath = `public/image/uploads/${path_find}`;

  fs.stat(filePath, (err, stats) => {
    if (err) {
      return res.status(404).json({ message: "File not found" });
    }

    fs.unlink(filePath, (err) => {
      if (err) {
        return res.status(500).json({ message: "File deletion failed" });
      }
      res.json({ message: "File deleted successfully" });
    });
  });
});

app.get("/checkImage", async (req, res) => {
  const image_type = req.query.image_type;
  try {
    const result = await pool.query("SELECT * FROM prop_id_image WHERE image_type = $1", [image_type]);
    if (result.rows.length > 0) {
      const data = result.rows[0];
      res.json(data);
    } else {
      res.json({ error: "Updating image" });
    }
  } catch (error) {
    console.error("Error executing SQL query", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/getImage", async (req, res) => {
  const image_type = req.query.image_type;
  try {
    const result = await pool.query(
      "SELECT * FROM prop_id_image WHERE image_type = $1", [image_type]
    );
    if (result.rows.length > 0) {
      const data = result.rows[0].path;
      res.setHeader("Content-Type", "image/jpeg");
      res.end(data);
    } else {
      res.json({ error: "No image found" });
    }
  } catch (error) {
    console.error("Error executing SQL query", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/deleteImage", async (req, res) => {
  const image_type = req.query.image_type;
  try {
    const result = await pool.query("DELETE FROM prop_id_image WHERE image_type = $1", [image_type]);
    if (result) {
      res.json({ success: "Data deleted" });
    } else {
      res.json({ error: "No result found" });
    }
  } catch (error) {
    console.error("Error executing SQL query", error);
    res.status(500).json({ error: "Internal server error" });
  }
})

const port = 5000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
