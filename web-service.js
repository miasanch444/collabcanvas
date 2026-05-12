let { MongoClient } = require("mongodb");
let uri = "mongodb://127.0.0.1:27017";
let client = new MongoClient(uri);

let express = require("express");
let path    = require("path");

let app  = express();
let port = 7777;

app.use(express.static(__dirname));

// Parse JSON bodies (for fetch POST/PUT)
app.use(express.json());

// Parse form bodies (for <form method="post"> etc.)
app.use(express.urlencoded({ extended: true }));

app.listen(port, function() {
    console.log(`Full-stack app is listening on port ${port}`);
});

app.get("/helloworld", function (req, res) {
    res.send("Hello World: Nick Flor!");
});

// ✅ Root should serve the *www/index.html* file
app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "index.html"));
});

// --------------------------- RETRIEVE ALL ---------------------------
app.get("/retrieve", function (req, res) {
    async function run() {
        try {
            await client.connect();
            let database = client.db("SanchezMia");
            let table    = database.collection("visitorlog");
            let query    = {};
            let rows     = await table.find(query);
            res.send(JSON.stringify(await rows.toArray()));
        } catch (err) {
            console.error(err);
            res.status(500).send("Error retrieving records");
        } finally {
            await client.close();
        }
    }
    run();
});

// --------------------------- RETRIEVE ONE ---------------------------
app.get("/retrieve-one/:guestid", function(req, res) {
    async function run() {
        try {
            await client.connect();
            let database = client.db("SanchezMia");
            let table    = database.collection("visitorlog");
            let query    = { guestid: parseInt(req.params.guestid) };
            let row      = await table.findOne(query);
            res.send(JSON.stringify(row));
        } catch (err) {
            console.error(err);
            res.status(500).send("Error retrieving record");
        } finally {
            await client.close();
        }
    }
    run();
});

// --------------------------- CREATE ---------------------------
app.post("/create", function (req, res) {
    async function run() {
        try {
            await client.connect()
            const database = client.db("SanchezMia")
            const table    = database.collection("visitorlog")

            // Log what the browser is sending (helpful if things break)
            console.log("CREATE body:", req.body)

            const expRaw = req.body.guestexperience ?? req.body.guestexp ?? ""
            const expNum = expRaw === "" || expRaw === undefined || expRaw === null
                ? null
                : parseInt(expRaw)

            const record = {
                guestid   : parseInt(req.body.guestid),
                guestname : req.body.guestname,
                guestage  : req.body.guestage ? parseInt(req.body.guestage) : null,
                guestart  : req.body.guestart || "",
                // store both for compatibility with old docs
                guestexperience : expNum,
                guestexp        : expNum,
                guestimage      : req.body.guestimage || "",
                guestdate       : new Date()
            }

            const result = await table.insertOne(record)
            console.log("Inserted id:", result.insertedId)

            // Send a JSON response so the front-end knows it worked
            res.send(JSON.stringify({ ok: true, id: result.insertedId }))
        } catch (err) {
            console.error("Error in /create:", err)
            res.status(500).send(JSON.stringify({ ok: false, error: err.message }))
        } finally {
            await client.close()
        }
    }
    run()
})


// --------------------------- DELETE ---------------------------
app.delete("/delete/:guestid", function(req, res) {
    async function run() {
        try {
            await client.connect();
            let database = client.db("SanchezMia");
            let table    = database.collection("visitorlog");
            let query    = { guestid: parseInt(req.params.guestid) };
            let result   = await table.deleteOne(query);
            res.json({ deletedCount: result.deletedCount });
        } catch (err) {
            console.error(err);
            res.status(500).send("Error deleting record");
        } finally {
            await client.close();
        }
    }
    run();
});

// --------------------------- UPDATE ---------------------------
app.put("/update", function(req, res) {
    async function run() {
        try {
            await client.connect()
            database  = client.db("SanchezMia")
            table     = database.collection("visitorlog")
            where     = {guestid: parseInt(req.body.guestid)}
            changes   = {$set:{
                guestname       : req.body.guestname,
                guestage        : parseInt(req.body.guestage),
                guestart        : req.body.guestart,
                guestexperience : parseInt(req.body.guestexperience),
                guestimage      : req.body.guestimage || ""
            }}
            result    = await table.updateOne(where, changes)
            res.send(JSON.stringify({ok:true}))
        } finally {
            await client.close()
        }
    }
    run()
})

