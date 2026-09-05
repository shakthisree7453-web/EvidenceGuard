const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

// ==================================================
// MIDDLEWARE
// ==================================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================================================
// PATHS
// ==================================================

const frontendPath = path.join(__dirname, "../frontend");
const databaseFolder = path.join(__dirname, "../database");
const databasePath = path.join(databaseFolder, "database.json");
const uploadFolder = path.join(__dirname, "uploads");

// ==================================================
// CREATE REQUIRED FOLDERS
// ==================================================

if (!fs.existsSync(databaseFolder)) {
    fs.mkdirSync(databaseFolder, { recursive: true });
}

if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
}

// ==================================================
// DATABASE
// ==================================================

if (!fs.existsSync(databasePath)) {

    const initialDatabase = {
        users: [
            {
                id: "POL1001",
                name: "Arun Kumar",
                role: "Higher Official",
                password: "admin123"
            },
            {
                id: "POL1002",
                name: "Rahul",
                role: "Investigation Officer",
                password: "officer123"
            }
        ],

        documents: [],
        versions: [],
        auditLogs: [],
        blockchainRecords: []
    };

    fs.writeFileSync(
        databasePath,
        JSON.stringify(initialDatabase, null, 2)
    );
}

function readDatabase() {

    try {

        return JSON.parse(
            fs.readFileSync(databasePath, "utf8")
        );

    } catch (error) {

        return {
            users: [],
            documents: [],
            versions: [],
            auditLogs: [],
            blockchainRecords: []
        };
    }
}

function saveDatabase(database) {

    fs.writeFileSync(
        databasePath,
        JSON.stringify(database, null, 2)
    );
}

// ==================================================
// FRONTEND
// ==================================================

app.use(
    express.static(frontendPath)
);

app.get("/", (req, res) => {

    res.sendFile(
        path.join(frontendPath, "login.html")
    );
});

// ==================================================
// STATUS
// ==================================================

app.get("/api/status", (req, res) => {

    res.json({
        success: true,
        message: "EvidenceGuard server is running",
        cybersecurity: "ACTIVE",
        blockchain: "READY"
    });
});

// ==================================================
// LOGIN
// ==================================================

app.post("/api/login", (req, res) => {

    const id =
        String(req.body.id || "").trim();

    const password =
        String(req.body.password || "");

    // HIGHER OFFICIAL

    if (
        id === "POL1001" &&
        password === "admin123"
    ) {

        const database = readDatabase();

        database.auditLogs.push({

            action: "LOGIN",

            officerId: "POL1001",

            officerName: "Arun Kumar",

            role: "Higher Official",

            dateTime:
                new Date().toISOString()

        });

        saveDatabase(database);

        return res.json({

            success: true,

            message: "Login successful",

            user: {

                id: "POL1001",

                name: "Arun Kumar",

                role: "Higher Official"

            }

        });
    }

    // INVESTIGATION OFFICER

    if (
        id === "POL1002" &&
        password === "officer123"
    ) {

        const database = readDatabase();

        database.auditLogs.push({

            action: "LOGIN",

            officerId: "POL1002",

            officerName: "Rahul",

            role: "Investigation Officer",

            dateTime:
                new Date().toISOString()

        });

        saveDatabase(database);

        return res.json({

            success: true,

            message: "Login successful",

            user: {

                id: "POL1002",

                name: "Rahul",

                role: "Investigation Officer"

            }

        });
    }

    return res.status(401).json({

        success: false,

        message: "Invalid Officer ID or Password"

    });
});

// ==================================================
// LOGOUT
// ==================================================

app.post("/api/logout", (req, res) => {

    const database = readDatabase();

    database.auditLogs.push({

        action: "LOGOUT",

        officerId:
            req.body.officerId || "UNKNOWN",

        dateTime:
            new Date().toISOString()

    });

    saveDatabase(database);

    res.json({

        success: true,

        message: "Logout recorded"

    });
});

// ==================================================
// MULTER
// ==================================================

const storage =
    multer.diskStorage({

        destination: function (
            req,
            file,
            cb
        ) {

            cb(
                null,
                uploadFolder
            );
        },

        filename: function (
            req,
            file,
            cb
        ) {

            const safeName =
                Date.now() +
                "-" +
                file.originalname
                    .replace(/[^a-zA-Z0-9._-]/g, "_");

            cb(
                null,
                safeName
            );
        }

    });

const upload =
    multer({
        storage: storage
    });

// ==================================================
// SHA-256 HASH
// ==================================================

function generateHash(filePath) {

    const fileBuffer =
        fs.readFileSync(filePath);

    return crypto
        .createHash("sha256")
        .update(fileBuffer)
        .digest("hex");
}

// ==================================================
// BLOCKCHAIN-STYLE IMMUTABLE LEDGER
// ==================================================

function createBlockchainRecord(
    database,
    documentName,
    hash,
    officerId,
    action,
    version
) {

    const previousBlock =
        database.blockchainRecords[
            database.blockchainRecords.length - 1
        ];

    const previousHash =
        previousBlock
            ? previousBlock.blockHash
            : "GENESIS";

    const timestamp =
        new Date().toISOString();

    const blockData = {

        documentName:
            documentName,

        hash:
            hash,

        officerId:
            officerId,

        action:
            action,

        version:
            version,

        timestamp:
            timestamp,

        previousHash:
            previousHash
    };

    const blockHash =
        crypto
            .createHash("sha256")
            .update(
                JSON.stringify(blockData)
            )
            .digest("hex");

    database.blockchainRecords.push({

        ...blockData,

        blockHash:
            blockHash
    });
}

// ==================================================
// UPLOAD DOCUMENT
// ==================================================

app.post(
    "/api/upload",
    upload.single("document"),
    (req, res) => {

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message:
                    "No document selected"

            });
        }

        const database =
            readDatabase();

        const caseId =
            req.body.caseId ||
            "CASE-001";

        const documentName =
            req.body.documentName ||
            req.file.originalname;

        const officerId =
            req.body.officerId ||
            "POL1001";

        const hash =
            generateHash(
                req.file.path
            );

        const documentData = {

            caseId:

                caseId,

            documentType:

                req.body.documentType ||
                "Legal Document",

            documentName:

                documentName,

            fileName:

                req.file.filename,

            originalName:

                req.file.originalname,

            uploadedBy:

                officerId,

            uploadedAt:

                new Date().toISOString(),

            version:

                1,

            hash:

                hash

        };

        database.documents.push(
            documentData
        );

        database.versions.push({

            caseId:
                caseId,

            documentName:
                documentName,

            version:
                1,

            fileName:
                req.file.filename,

            hash:
                hash,

            modifiedBy:
                officerId,

            modifiedAt:
                new Date().toISOString(),

            action:
                "UPLOADED"

        });

        database.auditLogs.push({

            action:
                "DOCUMENT UPLOADED",

            caseId:
                caseId,

            documentName:
                documentName,

            officerId:
                officerId,

            version:
                1,

            hash:
                hash,

            dateTime:
                new Date().toISOString()

        });

        createBlockchainRecord(

            database,

            documentName,

            hash,

            officerId,

            "DOCUMENT UPLOADED",

            1

        );

        saveDatabase(database);

        res.json({

            success: true,

            message:
                "Document uploaded successfully",

            fileName:
                req.file.filename,

            hash:
                hash,

            version:
                1

        });
    }
);

// ==================================================
// GET DOCUMENTS
// ==================================================

app.get(
    "/api/documents",
    (req, res) => {

        const database =
            readDatabase();

        res.json({

            success: true,

            files:
                database.documents

        });
    }
);

// ==================================================
// ACCESS CHECK
// ==================================================

app.get(
    "/api/access-check/:officerId/:documentName",
    (req, res) => {

        const officerId =
            req.params.officerId;

        const documentName =
            decodeURIComponent(
                req.params.documentName
            );

        if (
            officerId === "POL1001"
        ) {

            return res.json({

                success: true,

                allowed: true,

                message:
                    "Full access granted"

            });
        }

        if (
            officerId === "POL1002"
        ) {

            if (
                documentName
                    .toLowerCase()
                    .includes("fir")
            ) {

                return res.json({

                    success: true,

                    allowed: true,

                    message:
                        "Access granted"

                });
            }

            return res.json({

                success: false,

                allowed: false,

                message:
                    "Access denied"

            });
        }

        res.json({

            success: false,

            allowed: false,

            message:
                "Unauthorized officer"

        });
    }
);

// ==================================================
// OPEN DOCUMENT
// ==================================================

app.get(
    "/api/document/:fileName",
    (req, res) => {

        const fileName =
            path.basename(
                decodeURIComponent(
                    req.params.fileName
                )
            );

        const officerId =
            req.query.officerId;

        if (!officerId) {

            return res.status(401).json({

                success: false,

                message:
                    "Officer authentication required"

            });
        }

        const database =
            readDatabase();

        const document =
            database.documents.find(

                d =>
                    d.fileName ===
                    fileName

            );

        if (!document) {

            return res.status(404).json({

                success: false,

                message:
                    "Document not found"

            });
        }

        // ACCESS CONTROL

        if (
            officerId !== "POL1001" &&
            officerId !== "POL1002"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Unauthorized officer"

            });
        }

        if (
            officerId === "POL1002" &&
            !document.documentName
                .toLowerCase()
                .includes("fir")
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Access denied"

            });
        }

        const filePath =
            path.join(
                uploadFolder,
                fileName
            );

        if (
            !fs.existsSync(filePath)
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Document file not found"

            });
        }

        database.auditLogs.push({

            action:
                "DOCUMENT VIEWED",

            caseId:
                document.caseId,

            documentName:
                document.documentName,

            officerId:
                officerId,

            version:
                document.version,

            hash:
                document.hash,

            dateTime:
                new Date().toISOString()

        });

        saveDatabase(database);

        res.sendFile(filePath);
    }
);

// ==================================================
// MODIFY DOCUMENT
// ==================================================

app.post(
    "/api/modify",
    upload.single("document"),
    (req, res) => {

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message:
                    "No modified document selected"

            });
        }

        const database =
            readDatabase();

        const caseId =
            req.body.caseId ||
            "CASE-001";

        const documentName =
            req.body.documentName ||
            req.file.originalname;

        const officerId =
            req.body.officerId ||
            "POL1001";

        const oldDocument =
            database.documents.find(

                d =>
                    d.caseId === caseId &&
                    d.documentName ===
                    documentName

            );

        const previousVersions =
            database.versions.filter(

                v =>
                    v.caseId === caseId &&
                    v.documentName ===
                    documentName

            );

        const versionNumber =
            previousVersions.length + 1;

        const hash =
            generateHash(
                req.file.path
            );

        const versionData = {

            caseId:
                caseId,

            documentName:
                documentName,

            version:
                versionNumber,

            fileName:
                req.file.filename,

            hash:
                hash,

            modifiedBy:
                officerId,

            modifiedAt:
                new Date().toISOString(),

            action:
                "MODIFIED"

        };

        database.versions.push(
            versionData
        );

        if (oldDocument) {

            oldDocument.fileName =
                req.file.filename;

            oldDocument.version =
                versionNumber;

            oldDocument.hash =
                hash;

        } else {

            database.documents.push({

                caseId:
                    caseId,

                documentName:
                    documentName,

                originalName:
                    req.file.originalname,

                fileName:
                    req.file.filename,

                uploadedBy:
                    officerId,

                uploadedAt:
                    new Date().toISOString(),

                version:
                    versionNumber,

                hash:
                    hash

            });
        }

        database.auditLogs.push({

            action:
                "DOCUMENT MODIFIED",

            caseId:
                caseId,

            documentName:
                documentName,

            officerId:
                officerId,

            version:
                versionNumber,

            hash:
                hash,

            dateTime:
                new Date().toISOString()

        });

        createBlockchainRecord(

            database,

            documentName,

            hash,

            officerId,

            "DOCUMENT MODIFIED",

            versionNumber

        );

        saveDatabase(database);

        res.json({

            success: true,

            message:
                "New document version created",

            version:
                versionNumber,

            hash:
                hash

        });
    }
);

// ==================================================
// VERSION HISTORY
// ==================================================

app.get(
    "/api/versions/:caseId/:documentName",
    (req, res) => {

        const database =
            readDatabase();

        const caseId =
            req.params.caseId;

        const documentName =
            decodeURIComponent(
                req.params.documentName
            );

        const versions =
            database.versions.filter(

                v =>
                    v.caseId === caseId &&
                    v.documentName ===
                    documentName

            );

        res.json({

            success: true,

            versions:
                versions

        });
    }
);

// ==================================================
// AUDIT LOG
// ==================================================

app.get(
    "/api/audit",
    (req, res) => {

        const database =
            readDatabase();

        res.json({

            success: true,

            logs:
                database.auditLogs

        });
    }
);

// ==================================================
// WEEKLY AUDIT REPORT
// ==================================================

app.get(
    "/api/audit/weekly",
    (req, res) => {

        const database =
            readDatabase();

        const now =
            new Date();

        const sevenDaysAgo =
            new Date(
                now.getTime() -
                7 * 24 * 60 * 60 * 1000
            );

        const logs =
            database.auditLogs.filter(

                log => {

                    const logDate =
                        new Date(
                            log.dateTime
                        );

                    return (
                        logDate >=
                        sevenDaysAgo
                    );
                }
            );

        const report = {

            period:
                "Last 7 Days",

            totalActivities:
                logs.length,

            logins:
                logs.filter(
                    l =>
                        l.action ===
                        "LOGIN"
                ).length,

            uploads:
                logs.filter(
                    l =>
                        l.action ===
                        "DOCUMENT UPLOADED"
                ).length,

            views:
                logs.filter(
                    l =>
                        l.action ===
                        "DOCUMENT VIEWED"
                ).length,

            modifications:
                logs.filter(
                    l =>
                        l.action ===
                        "DOCUMENT MODIFIED"
                ).length,

            accessDenied:
                logs.filter(
                    l =>
                        l.action ===
                        "ACCESS DENIED"
                ).length,

            activities:
                logs

        };

        res.json({

            success: true,

            report:
                report

        });
    }
);

// ==================================================
// BLOCKCHAIN RECORDS
// ==================================================

app.get(
    "/api/blockchain",
    (req, res) => {

        const database =
            readDatabase();

        res.json({

            success: true,

            records:
                database.blockchainRecords

        });
    }
);

// ==================================================
// INTEGRITY VERIFICATION
// ==================================================

app.get(
    "/api/integrity/:fileName",
    (req, res) => {

        const fileName =
            path.basename(
                decodeURIComponent(
                    req.params.fileName
                )
            );

        const database =
            readDatabase();

        const document =
            database.documents.find(

                d =>
                    d.fileName ===
                    fileName

            );

        if (!document) {

            return res.status(404).json({

                success: false,

                message:
                    "Document not found"

            });
        }

        const filePath =
            path.join(
                uploadFolder,
                fileName
            );

        if (!fs.existsSync(filePath)) {

            return res.status(404).json({

                success: false,

                message:
                    "File not found"

            });
        }

        const currentHash =
            generateHash(
                filePath
            );

        const verified =
            currentHash ===
            document.hash;

        res.json({

            success: true,

            document:
                document.documentName,

            storedHash:
                document.hash,

            currentHash:
                currentHash,

            integrity:
                verified
                    ? "VERIFIED"
                    : "TAMPER DETECTED"

        });
    }
);

// ==================================================
// START SERVER
// ==================================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log("");
        console.log(
            "===================================="
        );
        console.log(
            "       EVIDENCEGUARD SERVER"
        );
        console.log(
            "===================================="
        );
        console.log(
            `Server: http://localhost:${PORT}`
        );
        console.log(
            "Status API: /api/status"
        );
        console.log(
            "Login API: /api/login"
        );
        console.log(
            "Document API: ACTIVE"
        );
        console.log(
            "Audit System: ACTIVE"
        );
        console.log(
            "Version Control: ACTIVE"
        );
        console.log(
            "SHA-256 Integrity: ACTIVE"
        );
        console.log(
            "Blockchain Ledger: ACTIVE"
        );
        console.log(
            "===================================="
        );
        console.log("");
    }
);