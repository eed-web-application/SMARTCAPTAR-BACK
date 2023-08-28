const express = require("express");
const router = express.Router();
var cors = require("cors");
const {
  InsertIntoCableINV,
  LogInHistory,
  addApproverToCables,
} = require("./helperFunctions");

router.post("/csvUploadConnectors", async (req, res) => {
  //New variable for cables taht are being sent
  let arr = req.body.arr;

  console.log(arr);
  const oracledb = req.db;
  const conDetails = req.conDetails;
  oracledb.autoCommit = true;
  let db;
  var temp = Object.keys(arr);
  try {
    db = await oracledb.getConnection(conDetails);
    const truncateTable = await db.execute(
      `TRUNCATE TABLE SMARTCAPTAR_COMPATIBILITY`
    );

    for (var i = 0; i < temp.length; i++) {
      const result = await db.execute(
        `INSERT INTO SMARTCAPTAR_COMPATIBILITY (CABLETYPE,COMPAT)
        VALUES 
        (
        '${temp[i]}',
        '${arr[temp[i]]}'
        )`
      );
    }
    res.status(200);
  } catch (err) {
    console.error(err);
  }

  if (db) {
    try {
      await db.close();
    } catch (err) {
      console.error(err);
    }
  }
});
router.post("/csvUploadUsers", async (req, res) => {
  //New variable for cables taht are being sent
  let arr = req.body.arr;
  console.log(arr);
  const oracledb = req.db;
  const conDetails = req.conDetails;
  oracledb.autoCommit = true;
  let db;
  var temp = Object.keys(arr);
  try {
    db = await oracledb.getConnection(conDetails);
    const resultUsers = await db.execute(
      `SELECT USERNAME FROM SMARTCAPTAR_USERS`
    );

    let users = resultUsers.rows;
    let usernames = [];
    for (var i = 0; i < users.length; i++) {
      usernames.push(users[i].USERNAME);
    }

    for (var i = 0; i < temp.length; i++) {
      if (usernames.includes(temp[i])) {
        console.log("FOUND USER " + temp[i]);
      } else {
        const result = await db.execute(
          `INSERT INTO SMARTCAPTAR_USERS (USERNAME,PROJECTS)
          VALUES 
          (
          '${temp[i]}',
          '${arr[temp[i]]}'
          )`
        );
      }
    }
    res.json({ msg: "SUCCESS" });
  } catch (err) {
    console.error(err);
  }

  if (db) {
    try {
      await db.close();
    } catch (err) {
      console.error(err);
    }
  }
});
router.get("/getCablesInventory", cors(), async (req, res) => {
  const oracledb = req.db;
  const conDetails = req.conDetails;
  let table = req.query.table;
  let offset = req.query.offset;
  let user = req.query.user;
  let txt = req.query.searchTxt;
  let db;
  let filter = req.query.filter;
  try {
    db = await oracledb.getConnection(conDetails);
    const result = await db.execute(
      `SELECT * FROM CABLEINV WHERE CABLEINV.${filter} LIKE '${txt}%' OFFSET ${offset} ROWS FETCH FIRST 10 ROWS ONLY`
    );
    let arr = [];
    for (var i = 0; i < result.rows.length; i++) {
      const cable = await db.execute(
        `SELECT * FROM CONNINV WHERE CABLENUM = '${result.rows[i].CABLENUM}'`
      );
      result.rows[i]["ORIGIN_LOC"] = cable.rows[0].LOC;
      result.rows[i]["ORIGIN_RACK"] = cable.rows[0].RACK;
      result.rows[i]["ORIGIN_SIDE"] = cable.rows[0].SIDE;
      result.rows[i]["ORIGIN_ELE"] = cable.rows[0].ELE;
      result.rows[i]["ORIGIN_SLOT"] = cable.rows[0].SLOT;
      result.rows[i]["ORIGIN_CONNNUM"] = cable.rows[0].CONNUM;
      result.rows[i]["ORIGIN_PINLIST"] = cable.rows[0].PINLIST;
      result.rows[i]["ORIGIN_CONNTYPE"] = cable.rows[0].CONNTYPE;
      result.rows[i]["ORIGIN_STATION"] = cable.rows[0].STATION;
      result.rows[i]["ORIGIN_INSTR"] = cable.rows[0].INSTR;

      result.rows[i]["DEST_LOC"] = cable.rows[1].LOC;
      result.rows[i]["DEST_RACK"] = cable.rows[1].RACK;
      result.rows[i]["DEST_SIDE"] = cable.rows[1].SIDE;
      result.rows[i]["DEST_ELE"] = cable.rows[1].ELE;
      result.rows[i]["DEST_SLOT"] = cable.rows[1].SLOT;
      result.rows[i]["DEST_CONNNUM"] = cable.rows[1].CONNUM;
      result.rows[i]["DEST_PINLIST"] = cable.rows[1].PINLIST;
      result.rows[i]["DEST_CONNTYPE"] = cable.rows[1].CONNTYPE;
      result.rows[i]["DEST_STATION"] = cable.rows[1].STATION;
      result.rows[i]["DEST_INSTR"] = cable.rows[1].INSTR;
      const cableArea = await db.execute(
        `SELECT * FROM CABLE_LISTING WHERE LIST_NO = '${result.rows[i]["LIST_NO"]}'`
      );
      result.rows[i]["LIST_TITLE"] = cableArea.rows[0]["LIST_TITLE"];
      result.rows[i]["AREACODE"] = cableArea.rows[0]["AREA_CODE"];
      const cableExtra = await db.execute(
        `SELECT * FROM CABLE_INSTALL_UPLOAD_EXTRA WHERE CABLENUM = '${result.rows[i]["CABLENUM"]}'`
      );
      if (cableExtra.rows.length > 0) {
        result.rows[i]["SECTOR_AREA_SOURCE"] =
          cableExtra.rows[0].SECTOR_AREA_SOURCE;
        result.rows[i]["BEAM_AREA"] = cableExtra.rows[0].BEAMLINE_AREA;

        result.rows[i]["SECTOR_GROUP"] = cableExtra.rows[0].SECTOR_GROUP;

        result.rows[i]["PENETRATION"] = cableExtra.rows[0].PENETRATION;

        result.rows[i]["PENETRATION_II"] = cableExtra.rows[0].PENETRATION_II;

        result.rows[i]["PROJECT"] = cableExtra.rows[0].PROJECT;

        result.rows[i]["INSTALLED_LENGTH"] =
          cableExtra.rows[0].INSTALLED_LENGTH;

        result.rows[i]["AREA_CODE"] = cableExtra.rows[0].AREA_CODE;

        result.rows[i]["PHASE"] = cableExtra.rows[0].PHASE;

        result.rows[i]["SECTOR_AREA_DEST"] =
          cableExtra.rows[0].SECTOR_AREA_DEST;

        result.rows[i]["MIN_LENGTH"] = cableExtra.rows[0].MIN_LENGTH;

        result.rows[i]["MAX_LENGTH"] = cableExtra.rows[0].MAX_LENGTH;

        result.rows[i]["ADDNL_LENGTH"] = cableExtra.rows[0].ADDNL_LENGTH;
      }
    }

    const resultCount = await db.execute(
      `SELECT COUNT(*) as count FROM ${table} WHERE  CABLEINV.${filter} LIKE '${txt}%'`
    );
    console.log(result.rows);
    res.json({
      cables: result.rows,
      total: resultCount.rows[0].COUNT,
      columnInfo: [],
    });
  } catch (err) {
    console.error(err);
  }
  console.log("Stop");

  if (db) {
    try {
      await db.close();
    } catch (err) {
      console.error(err);
    }
  }
  4;
});
router.get("/getCables", cors(), async (req, res) => {
  const oracledb = req.db;
  const conDetails = req.conDetails;
  let table = req.query.table;
  let offset = req.query.offset;
  let user = req.query.user;
  let rows = req.query.rows;
  console.log(rows);
  let db;
  try {
    db = await oracledb.getConnection(conDetails);
    const resultTest = await db.execute(
      `SELECT column_name, data_type, data_length FROM USER_TAB_COLUMNS WHERE table_name = '${table}'`
    );
    // console.log(resultTest.rows)
    var columnInfo = {};
    for (var i = 0; i < resultTest.rows.length; i++) {
      columnInfo[resultTest.rows[i].COLUMN_NAME] = resultTest.rows[i];
    }
    console.log("ROWS" + rows);
    if (table == "CABLEINV") {
      // get 10 cables
      // go through each cable
      // find it in the conninv
      // append to a result array with the newly formatted cable

      const result = await db.execute(
        `SELECT * FROM CABLEINV a FULL JOIN CABLE_INSTALL_UPLOAD_EXTRA b ON a.CABLENUM = b.CABLENUM OFFSET ${offset} ROWS FETCH FIRST '${rows}' ROWS ONLY`
      );
      console.log(result.rows);
      let arr = [];
      for (var i = 0; i < result.rows.length; i++) {
        const cable = await db.execute(
          `SELECT * FROM CONNINV WHERE CABLENUM = '${result.rows[i].CABLENUM}'`
        );
        result.rows[i]["ORIGIN_LOC"] = cable.rows[0].LOC;
        result.rows[i]["ORIGIN_RACK"] = cable.rows[0].RACK;
        result.rows[i]["ORIGIN_SIDE"] = cable.rows[0].SIDE;
        result.rows[i]["ORIGIN_ELE"] = cable.rows[0].ELE;
        result.rows[i]["ORIGIN_SLOT"] = cable.rows[0].SLOT;
        result.rows[i]["ORIGIN_CONNNUM"] = cable.rows[0].CONNUM;
        result.rows[i]["ORIGIN_PINLIST"] = cable.rows[0].PINLIST;
        result.rows[i]["ORIGIN_CONNTYPE"] = cable.rows[0].CONNTYPE;
        result.rows[i]["ORIGIN_STATION"] = cable.rows[0].STATION;
        result.rows[i]["ORIGIN_INSTR"] = cable.rows[0].INSTR;

        result.rows[i]["DEST_LOC"] = cable.rows[1].LOC;
        result.rows[i]["DEST_RACK"] = cable.rows[1].RACK;
        result.rows[i]["DEST_SIDE"] = cable.rows[1].SIDE;
        result.rows[i]["DEST_ELE"] = cable.rows[1].ELE;
        result.rows[i]["DEST_SLOT"] = cable.rows[1].SLOT;
        result.rows[i]["DEST_CONNNUM"] = cable.rows[1].CONNUM;
        result.rows[i]["DEST_PINLIST"] = cable.rows[1].PINLIST;
        result.rows[i]["DEST_CONNTYPE"] = cable.rows[1].CONNTYPE;
        result.rows[i]["DEST_STATION"] = cable.rows[1].STATION;
        result.rows[i]["DEST_INSTR"] = cable.rows[1].INSTR;
        const cableArea = await db.execute(
          `SELECT * FROM CABLE_LISTING WHERE LIST_NO = '${result.rows[i]["LIST_NO"]}'`
        );
        result.rows[i]["USERID_LIST_TITLE"] = cableArea.rows[0]["LIST_TITLE"];
        result.rows[i]["AREACODE"] = cableArea.rows[0]["AREA_CODE"];

        const cableExtra = await db.execute(
          `SELECT * FROM CABLE_INSTALL_UPLOAD_EXTRA WHERE CABLENUM = '${result.rows[i]["CABLENUM"]}'`
        );
        if (cableExtra.rows.length > 0) {
          result.rows[i]["SECTOR_AREA_SOURCE"] =
            cableExtra.rows[0].SECTOR_AREA_SOURCE;
          result.rows[i]["BEAM_AREA"] = cableExtra.rows[0].BEAMLINE_AREA;

          result.rows[i]["SECTOR_GROUP"] = cableExtra.rows[0].SECTOR_GROUP;

          result.rows[i]["PENETRATION"] = cableExtra.rows[0].PENETRATION;

          result.rows[i]["PENETRATION_II"] = cableExtra.rows[0].PENETRATION_II;

          result.rows[i]["PROJECT"] = cableExtra.rows[0].PROJECT;

          result.rows[i]["INSTALLED_LENGTH"] =
            cableExtra.rows[0].INSTALLED_LENGTH;

          result.rows[i]["AREA_CODE"] = cableExtra.rows[0].AREA_CODE;

          result.rows[i]["PHASE"] = cableExtra.rows[0].PHASE;

          result.rows[i]["SECTOR_AREA_DEST"] =
            cableExtra.rows[0].SECTOR_AREA_DEST;

          result.rows[i]["MIN_LENGTH"] = cableExtra.rows[0].MIN_LENGTH;

          result.rows[i]["MAX_LENGTH"] = cableExtra.rows[0].MAX_LENGTH;

          result.rows[i]["ADDNL_LENGTH"] = cableExtra.rows[0].ADDNL_LENGTH;
        }
      }
      const resultCount = await db.execute(
        `SELECT COUNT(*) as count FROM ${table}`
      );

      res.json({
        cables: result.rows,
        total: resultCount.rows[0].COUNT,
        columnInfo: columnInfo,
      });
    } else if (table == "SMARTCAPTAR_UPLOAD") {
      console.log("USER" + user);
      const result = await db.execute(
        `SELECT * from SMARTCAPTAR_UPLOAD WHERE ENTEREDBY = '${user}' UNION SELECT * FROM SMARTCAPTAR_QUEUE WHERE ENTEREDBY = '${user}'`
      );
      const resultCount = await db.execute(
        `SELECT COUNT(*) as count FROM ${table}`
      );

      let cables = result.rows;
      for (var i = 0; i < cables.length; i++) {
        const QAResult = await db.execute(
          `SELECT COMPAT FROM SMARTCAPTAR_COMPATIBILITY WHERE CABLETYPE = '${cables[i].CABLETYPE}'`
        );
        cables[i].DUPLICATES = QAResult.rows;
        if (
          QAResult.rows[0] == undefined ||
          !QAResult.rows[0].COMPAT.split(",").includes(
            cables[i].ORIGIN_CONNTYPE
          )
        ) {
          cables[i].ORIGIN_TYPEERR = true;
        } else {
          cables[i].ORIGIN_TYPEERR = false;
        }
        if (
          QAResult.rows[0] == undefined ||
          !QAResult.rows[0].COMPAT.split(",").includes(cables[i].DEST_CONNTYPE)
        ) {
          cables[i].DEST_TYPEERR = true;
        } else {
          cables[i].DEST_TYPEERR = false;
        }
      }
      res.json({
        cables: cables,
        total: resultCount.rows[0].COUNT,
        columnInfo: columnInfo,
      });
    } else if (table == "SMARTCAPTAR_HISTORY") {
      const result = await db.execute(
        `SELECT * FROM SMARTCAPTAR_HISTORY WHERE CABLENUM = '${req.query.CABLENUM}' OFFSET ${offset} ROWS FETCH FIRST 10 ROWS ONLY`
      );
      const resultCount = await db.execute(
        `SELECT COUNT(*) as count FROM ${table}`
      );
      console.log(result.rows);

      res.json({ cables: result.rows, total: resultCount.rows[0].COUNT });
    } else {
      console.log("TEST " + user);
      let cables = [];
      if (user != "ADMIN") {
        //get user projects
        const projectsQuery = await db.execute(
          `SELECT PROJECTS FROM SMARTCAPTAR_USERS WHERE USERNAME = '${user}'`
        );
        projects = !projectsQuery.rows[0].PROJECTS
          ? []
          : projectsQuery.rows[0].PROJECTS.split(",");
        //getCables with that project
        for (var i = 0; i < projects.length; i++) {
          console.log(projects[i]);
          const result = await db.execute(
            `SELECT * FROM SMARTCAPTAR_QUEUE WHERE AREACODE = '${projects[i]}'`
          );

          cables = [...cables, ...result.rows];
        }
      } else {
        console.log("QUEUE");
        const result = await db.execute(`SELECT * FROM SMARTCAPTAR_QUEUE`);
        cables = result.rows;
      }

      //append to array

      // const result = await db.execute(
      //   `SELECT * FROM ${table}`
      // );
      const resultCount = await db.execute(
        `SELECT COUNT(*) as count FROM ${table}`
      );

      for (var i = 0; i < cables.length; i++) {
        const QAResult = await db.execute(
          `SELECT COMPAT FROM SMARTCAPTAR_COMPATIBILITY WHERE CABLETYPE = '${cables[i].CABLETYPE}'`
        );
        cables[i].DUPLICATES = QAResult.rows;
        if (
          QAResult.rows[0] == undefined ||
          !QAResult.rows[0].COMPAT.split(",").includes(
            cables[i].ORIGIN_CONNTYPE
          )
        ) {
          cables[i].ORIGIN_TYPEERR = true;
        } else {
          cables[i].ORIGIN_TYPEERR = false;
        }
        if (
          QAResult.rows[0] == undefined ||
          !QAResult.rows[0].COMPAT.split(",").includes(cables[i].DEST_CONNTYPE)
        ) {
          cables[i].DEST_TYPEERR = true;
        } else {
          cables[i].DEST_TYPEERR = false;
        }
      }
      res.json({
        cables: cables,
        total: resultCount.rows[0].COUNT,
        columnInfo: columnInfo,
      });
    }
  } catch (err) {
    console.error(err);
  }
  console.log("Stop");

  if (db) {
    try {
      await db.close();
    } catch (err) {
      console.error(err);
    }
  }
});
router.get("/getCableTypes", cors(), async (req, res) => {
  const oracledb = req.db;
  const conDetails = req.conDetails;
  let db;
  try {
    db = await oracledb.getConnection(conDetails);

    const result = await db.execute(
      `SELECT DISTINCT(CABLETYPE) FROM SMARTCAPTAR_COMPATIBILITY`
    );
    let sortedRes = result.rows;
    await sortedRes.sort((a, b) => a.CABLETYPE.localeCompare(b.CABLETYPE));
    res.json({ types: sortedRes });
  } catch (err) {
    console.error(err);
  }

  if (db) {
    try {
      await db.close();
    } catch (err) {
      console.error(err);
    }
  }
});
router.get("/getConnTypes", cors(), async (req, res) => {
  let db;
  const oracledb = req.db;
  const conDetails = req.conDetails;
  try {
    db = await oracledb.getConnection(conDetails);
    const result = await db.execute(
      `SELECT COMPAT FROM SMARTCAPTAR_COMPATIBILITY WHERE CABLETYPE = '${req.query.cableType}'`
    );

    res.json({
      types: result.rows[0].COMPAT.split(",").sort((a, b) =>
        a.localeCompare(b)
      ),
    });
  } catch (err) {
    console.error(err);
  }

  if (db) {
    try {
      await db.close();
    } catch (err) {
      console.error(err);
    }
  }
});
router.get("/getCompatibility", cors(), async (req, res) => {
  const oracledb = req.db;
  const conDetails = req.conDetails;
  let db;
  try {
    db = await oracledb.getConnection(conDetails);

    const result = await db.execute(`SELECT * FROM SMARTCAPTAR_COMPATIBILITY`);
    res.json({ compat: result.rows });
  } catch (err) {
    console.error(err);
  }

  if (db) {
    try {
      await db.close();
    } catch (err) {
      console.error(err);
    }
  }
});
router.get("/getHistory", cors(), async (req, res) => {
  const oracledb = req.db;
  const conDetails = req.conDetails;
  let offset = req.query.offset;
  let db;
  try {
    db = await oracledb.getConnection(conDetails);
    const result = await db.execute(
      `SELECT DISTINCT(CABLENUM) FROM SMARTCAPTAR_HISTORY OFFSET ${offset} ROWS FETCH FIRST 10 ROWS ONLY`
    );
    const resultCount = await db.execute(
      `SELECT COUNT(DISTINCT(CABLENUM)) as count FROM SMARTCAPTAR_HISTORY`
    );
    res.json({ cables: result.rows, total: resultCount.rows[0].COUNT });
  } catch (err) {
    console.error(err);
  }

  if (db) {
    try {
      await db.close();
    } catch (err) {
      console.error(err);
    }
  }
});
router.get("/getCableHistory", cors(), async (req, res) => {
  let cable = req.query.cable;
  const oracledb = req.db;
  const conDetails = req.conDetails;
  let db;
  try {
    db = await oracledb.getConnection(conDetails);
    const result = await db.execute(
      `SELECT * FROM SMARTCAPTAR_HISTORY WHERE CABLENUM = '${cable}'`
    );
    const resultCount = await db.execute(
      `SELECT COUNT(*) as count FROM SMARTCAPTAR_HISTORY`
    );

    res.json({ cables: result.rows, total: resultCount.rows[0].COUNT });
  } catch (err) {
    console.error(err);
  }

  if (db) {
    try {
      await db.close();
    } catch (err) {
      console.error(err);
    }
  }
});
router.post("/uploadCables", cors(), async (req, res) => {
  //New variable for cables taht are being sent
  const oracledb = req.db;
  const conDetails = req.conDetails;
  let cablesUpload = req.body.cables;
  let user = req.body.user;
  let dupes = req.body.dupes;
  let recon = req.body.recon;

  oracledb.autoCommit = true;
  let db;

  try {
    db = await oracledb.getConnection(conDetails);
    for (var i = 0; i < cablesUpload.length; i++) {
      if (
        !dupes.includes(cablesUpload[i]["CABLENUM"]) &&
        !recon.includes(cablesUpload[i]["CABLENUM"])
      ) {
        console.log(cablesUpload[i]);
        let NEWCABLENUM;
        let STATUS;
        if (cablesUpload[i]["CABLENUM"] == "NEW CABLE") {
          STATUS = "NEW";
          const cableNum = await db.execute(
            `SELECT * FROM SMARTCAPTAR_PROJECTS WHERE PROJECT_NAME = '${cablesUpload[i]["AREACODE"]}'`
          );
          let numCables = cableNum.rows[0].NUM_CABLES;
          let prefix = cableNum.rows[0].PREFIX;
          var string = "" + numCables;
          var pad = "0000";
          n = pad.substring(0, pad.length - string.length) + string;
          NEWCABLENUM = `${prefix + n}`;
          await db.execute(
            `UPDATE SMARTCAPTAR_PROJECTS SET NUM_CABLES = '${
              numCables + 1
            }' WHERE PROJECT_NAME = '${cablesUpload[i]["AREACODE"]}'`
          );
        } else {
          NEWCABLENUM = cablesUpload[i]["CABLENUM"];
          const result = await db.execute(
            `SELECT * FROM CABLEINV WHERE CABLENUM = '${cablesUpload[i]["CABLENUM"]}'`
          );

          if (result.rows.length > 0) {
            console.log(result.rows);
            STATUS = "MODIFY";
          } else {
            STATUS = "NEW";
          }
        }

        const result = await db.execute(
          `INSERT INTO SMARTCAPTAR_UPLOAD (
            CABLENUM,
            CABLETYPE,
            JOBNUM,
            ENTEREDBY,
            DATEENT,
            FUNC,
            LENGTH,
            ROUTING,
            REVISION,
            DWGNUM,
            DRAWING_TITLE,
            STATUS,
            AREACODE,
            ORIGIN_LOC,
            ORIGIN_RACK,
            ORIGIN_SIDE,
            ORIGIN_ELE,
            ORIGIN_SLOT,
            ORIGIN_CONNUM,
            ORIGIN_PINLIST,
            ORIGIN_CONNTYPE,
            ORIGIN_STATION,
            ORIGIN_INSTR,
            DEST_LOC,
            DEST_RACK,
            DEST_SIDE,
            DEST_ELE,
            DEST_SLOT,
            DEST_CONNUM,
            DEST_PINLIST,
            DEST_CONNTYPE,
            DEST_STATION,
            DEST_INSTR,
            FORMDEV_NAME,
            USERID_LIST_TITLE,
            PHASE,
            BEAM_AREA,
            SECTOR_GROUP,
            SECTOR_AREA_SOURCE,
            SECTOR_AREA_DEST,
            PENETRATION,
            PENETRATION_2,
            MIN_LENGTH,
            MAX_LENGTH,
            ADDNL_LENGTH
)
          VALUES 
          ('${NEWCABLENUM}',
          '${cablesUpload[i]["CABLETYPE"]}',
          '${cablesUpload[i]["JOBNUM"]}',
          '${user}',
          TO_TIMESTAMP_TZ(CURRENT_TIMESTAMP, 'DD-MON-RR HH.MI.SSXFF PM TZH:TZM'),
          '${cablesUpload[i]["FUNC"]}',
          '${cablesUpload[i]["LENGTH"]}',
          '${cablesUpload[i]["ROUTING"]}',
          '${cablesUpload[i]["REVISION"]}',
          '${cablesUpload[i]["DWGNUM"]}',
          '${cablesUpload[i]["DRAWING_TITLE"]}',
          '${STATUS}',
          '${cablesUpload[i]["AREACODE"]}',
          '${cablesUpload[i]["ORIGIN_LOC"]}',
          '${cablesUpload[i]["ORIGIN_RACK"]}',
          '${cablesUpload[i]["ORIGIN_SIDE"]}',
          '${cablesUpload[i]["ORIGIN_ELE"]}',
          '${cablesUpload[i]["ORIGIN_SLOT"]}',
          '${cablesUpload[i]["ORIGIN_CONNUM"]}',
          '${cablesUpload[i]["ORIGIN_PINLIST"]}',
          '${cablesUpload[i]["ORIGIN_CONNTYPE"]}',
          '${cablesUpload[i]["ORIGIN_STATION"]}',
          '${cablesUpload[i]["ORIGIN_INSTR"]}',
          '${cablesUpload[i]["DEST_LOC"]}',
          '${cablesUpload[i]["DEST_RACK"]}',
          '${cablesUpload[i]["DEST_SIDE"]}',
          '${cablesUpload[i]["DEST_ELE"]}',
          '${cablesUpload[i]["DEST_SLOT"]}',
          '${cablesUpload[i]["DEST_CONNUM"]}',
          '${cablesUpload[i]["DEST_PINLIST"]}',
          '${cablesUpload[i]["DEST_CONNTYPE"]}',
          '${cablesUpload[i]["DEST_STATION"]}',
          '${cablesUpload[i]["DEST_INSTR"]}',
          '${cablesUpload[i]["FORMDEV_NAME"]}',
          '${cablesUpload[i]["USERID_LIST_TITLE"]}',
          '${cablesUpload[i]["PHASE"]}',
          '${cablesUpload[i]["BEAM_AREA"]}',
          '${cablesUpload[i]["SECTOR_GROUP"]}',
          '${cablesUpload[i]["SECTOR_AREA_SOURCE"]}',
          '${cablesUpload[i]["SECTOR_AREA_DEST"]}',
          '${cablesUpload[i]["PENETRATION"]}',
          '${cablesUpload[i]["PENETRATION_2"]}',
          '${cablesUpload[i]["MIN_LENGTH"]}',
          '${cablesUpload[i]["MAX_LENGTH"]}',
          '${cablesUpload[i]["ADDNL_LENGTH"]}')`
        );
      }
    }
    res.json({ msg: "SUCCESS" });
  } catch (err) {
    console.error(err);
  }

  if (db) {
    try {
      await db.close();
    } catch (err) {
      console.error(err);
    }
  }
});

router.post("/createCable", cors(), async (req, res) => {
  //New variable for cables taht are being sent
  const oracledb = req.db;
  const conDetails = req.conDetails;
  let cable = req.body.cable;
  let user = req.body.user;
  oracledb.autoCommit = true;
  let db;
  var admins = JSON.stringify({ sung: false, seano: false });
  try {
    db = await oracledb.getConnection(conDetails);
    await db.execute(
      `UPDATE SMARTCAPTAR_PROJECTS SET NUM_CABLES =NUM_CABLES+1  WHERE PROJECT_NAME = '${cable.AREACODE}'`
    );

    const result = await db.execute(
      `INSERT INTO SMARTCAPTAR_UPLOAD (
        APPROVERS,
        STATUS,
        ENTEREDBY,
        CABLENUM,
        CABLETYPE,
        JOBNUM,
        FUNC,
        SYSTEM,
        LENGTH,
        ROUTING,
        LIST_NO,
        DWGNUM,
        DRAWING_TITLE,
        AREACODE,
        ORIGIN_LOC,
        ORIGIN_RACK,
        ORIGIN_SIDE,
        ORIGIN_ELE,
        ORIGIN_SLOT,
        ORIGIN_CONNUM,
        ORIGIN_PINLIST,
        ORIGIN_CONNTYPE,
        ORIGIN_STATION,
        ORIGIN_INSTR,
        STATION_OLD,
        DEST_LOC,
        DEST_RACK,
        DEST_SIDE,
        DEST_ELE,
        DEST_SLOT,
        DEST_CONNUM,
        DEST_PINLIST,
        DEST_CONNTYPE,
        DEST_STATION,
        DEST_INSTR,
        FORMDEV_NAME,
        PHASE,
        BEAM_AREA,
        SECTOR_GROUP,
        SECTOR_AREA_SOURCE,
        SECTOR_AREA_DEST,
        PENETRATION,
        PENETRATION_2,
        MIN_LENGTH,
        MAX_LENGTH,
        ADDNL_LENGTH,
        REVISION ) VALUES (
        '${admins}',
        '${"NEW"}',
        '${user}',
        '${cable.CABLENUM}',
        '${cable.CABLETYPE}',
        '${cable.JOBNUM}',
      '${cable.FUNC}',
                    '${cable.SYSTEM}',
        '${cable.LENGTH}',
                  '${cable.ROUTING}',
                    '${cable.LIST_NO}',
        '${cable.DWGNUM}',
              '${cable.DRAWING_TITLE}',
                    '${cable.AREACODE}',
            '${cable.ORIGIN_LOC}',
                  '${cable.ORIGIN_RACK}',
                    '${cable.ORIGIN_SIDE}',
            '${cable.ORIGIN_ELE}',
                  '${cable.ORIGIN_SLOT}',
                    '${cable.ORIGIN_CONNUM}',
                '${cable.ORIGIN_PINLIST}',
                  '${cable.ORIGIN_CONNTYPE}',
                    '${cable.ORIGIN_STATION}',
              '${cable.ORIGIN_INSTR}',
                  '${cable.STATION_OLD}',
          '${cable.DEST_LOC}',
                  '${cable.DEST_RACK}',
                    '${cable.DEST_SIDE}',
          '${cable.DEST_ELE}',
                  '${cable.DEST_SLOT}',
                    '${cable.DEST_CONNUM}',
              '${cable.DEST_PINLIST}',
                  '${cable.DEST_CONNTYPE}',
                    '${cable.DEST_STATION}',
            '${cable.DEST_INSTR}',
                  '${cable.FORMDEV_NAME}',
      '${cable.PHASE}',
                  '${cable.BEAM_AREA}',
                    '${cable.SECTOR_GROUP}',
                    '${cable.SECTOR_AREA_SOURCE}',
                  '${cable.SECTOR_AREA_DEST}',
                    '${cable.PENETRATION}',
              '${cable.PENETRATION_2}',
                  '${cable.MIN_LENGTH}',
                    '${cable.MAX_LENGTH}',
              '${cable.ADDNL_LENGTH}',
                  '${cable.REVISION}')`
    );

    res.json({ msg: "SUCCESS" });
  } catch (err) {
    console.error(err);
  }

  if (db) {
    try {
      await db.close();
    } catch (err) {
      console.error(err);
    }
  }
});
router.post("/uploadCableType", cors(), async (req, res) => {
  //New variable for cables taht are being sent
  const oracledb = req.db;
  const conDetails = req.conDetails;
  let CABLETYPE = req.body.CABLETYPE;
  let COMPAT = req.body.COMPAT;
  oracledb.autoCommit = true;
  let db;
  try {
    db = await oracledb.getConnection(conDetails);

    const result = await db.execute(
      `INSERT INTO SMARTCAPTAR_COMPATIBILITY (CABLETYPE,COMPAT) VALUES  ('${CABLETYPE}','${COMPAT}')`
    );

    res.json({ msg: "SUCCESS" });
  } catch (err) {
    console.error(err);
  }

  if (db) {
    try {
      await db.close();
    } catch (err) {
      console.error(err);
    }
  }
});
router.post("/checkCables", cors(), async (req, res) => {
  const oracledb = req.db;
  const conDetails = req.conDetails;
  //New variable for cables taht are being sent
  let cablesUpload = req.body.cables;
  let duplicateCables = [];
  let nonRecognizedCablenums = [];
  oracledb.autoCommit = true;
  let db;
  try {
    db = await oracledb.getConnection(conDetails);
    //CHECK WHICH CABLES EXISTS ALREADY
    for (var i = 0; i < cablesUpload.length; i++) {
      const result = await db.execute(
        `SELECT CABLENUM FROM SMARTCAPTAR_UPLOAD WHERE CABLENUM = '${cablesUpload[i]["CABLENUM"]}'`
      );
      if (result.rows.length > 0) {
        duplicateCables.push(cablesUpload[i]["CABLENUM"]);
      }
      if (
        result.rows.length == 0 &&
        cablesUpload[i]["CABLENUM"] != "NEW CABLE"
      ) {
        nonRecognizedCablenums.push(cablesUpload[i]["CABLENUM"]);
      }
    }
    for (var i = 0; i < cablesUpload.length; i++) {
      const result = await db.execute(
        `SELECT CABLENUM FROM SMARTCAPTAR_QUEUE WHERE CABLENUM = '${cablesUpload[i]["CABLENUM"]}'`
      );
      if (result.rows.length > 0) {
        duplicateCables.push(cablesUpload[i]["CABLENUM"]);
      }
    }
    res.json({ duplicateCables: duplicateCables, nonRecognizedCablenums });
  } catch (err) {
    console.error(err);
  }

  if (db) {
    try {
      await db.close();
    } catch (err) {
      console.error(err);
    }
  }
});
router.post("/queueCables", cors(), async (req, res) => {
  console.log("Start");
  console.time("timer");

  const oracledb = req.db;
  const conDetails = req.conDetails;
  let cablesUpload = req.body.cables;
  oracledb.autoCommit = true;
  let db;
  try {
    db = await oracledb.getConnection(conDetails);
    for (var i = 0; i < cablesUpload.length; i++) {
      const result = await db.execute(
        `INSERT INTO SMARTCAPTAR_QUEUE
          SELECT * FROM SMARTCAPTAR_UPLOAD WHERE CABLENUM = '${cablesUpload[i].CABLENUM}'`
      );
    }

    for (var i = 0; i < cablesUpload.length; i++) {
      const result = await db.execute(
        `DELETE FROM SMARTCAPTAR_UPLOAD WHERE CABLENUM = '${cablesUpload[i].CABLENUM}'`
      );
    }

    for (var i = 0; i < cablesUpload.length; i++) {
      const approversQuery = await db.execute(
        `SELECT ASSIGNED_USERS FROM SMARTCAPTAR_PROJECTS WHERE PROJECT_NAME = '${cablesUpload[i].AREACODE}'`
      );
      let approvers = !approversQuery.rows[0].ASSIGNED_USERS
        ? []
        : approversQuery.rows[0].ASSIGNED_USERS.split(",");
      let admins = {};
      for (var j = 0; j < approvers.length; j++) {
        admins[approvers[j]] = false;
      }
      admins = JSON.stringify(admins);

      const result = await db.execute(
        `UPDATE SMARTCAPTAR_QUEUE SET STATUS = 'PENDING', APPROVERS = '${admins}' WHERE CABLENUM = '${cablesUpload[i].CABLENUM}'`
      );
    }
  } catch (err) {
    console.error(err);
  }
  console.log("Stop");

  if (db) {
    try {
      await db.close();
    } catch (err) {
      console.error(err);
    }
  }
  console.timeEnd("timer");

  res.json({ ms: "Completed" });
});
router.post("/deleteCables", cors(), async (req, res) => {
  const oracledb = req.db;
  const conDetails = req.conDetails;
  let cablesUpload = req.body.cables;
  oracledb.autoCommit = true;
  let db;
  try {
    db = await oracledb.getConnection(conDetails);
    for (var i = 0; i < cablesUpload.length; i++) {
      const result = await db.execute(
        `DELETE FROM SMARTCAPTAR_UPLOAD WHERE CABLENUM = '${cablesUpload[i].CABLENUM}'`
      );
    }
  } catch (err) {
    console.error(err);
  }

  if (db) {
    try {
      await db.close();
    } catch (err) {
      console.error(err);
    }
  }

  res.json({ ms: "Completed" });
});
router.get("/getRejectedCables", cors(), async (req, res) => {
  //New variable for cables taht are being sent
  const oracledb = req.db;
  const conDetails = req.conDetails;
  oracledb.autoCommit = true;
  let db;
  try {
    db = await oracledb.getConnection(conDetails);
    const result = await db.execute(
      `SELECT * FROM SMARTCAPTAR_UPLOAD WHERE STATUS = 'REJECTED'`
    );
    res.json({ cables: result.rows });
  } catch (err) {
    console.error(err);
  }
  if (db) {
    try {
      await db.close();
    } catch (err) {
      console.error(err);
    }
  }
});
router.get("/getPendingCables", cors(), async (req, res) => {
  const oracledb = req.db;
  const conDetails = req.conDetails;
  //New variable for cables taht are being sent
  oracledb.autoCommit = true;
  let db;
  try {
    db = await oracledb.getConnection(conDetails);
    const result = await db.execute(
      `SELECT * FROM SMARTCAPTAR_QUEUE WHERE STATUS = 'PENDING'`
    );
    res.json({ cables: result.rows });
  } catch (err) {
    console.error(err);
  }
  if (db) {
    try {
      await db.close();
    } catch (err) {
      console.error(err);
    }
  }
});
router.post("/rejectCables", cors(), async (req, res) => {
  const oracledb = req.db;
  const conDetails = req.conDetails;
  //New variable for cables taht are being sent
  let cablesUpload = req.body.cables;
  let comment = req.body.comment;
  oracledb.autoCommit = true;
  console.log(comment);
  let db;
  try {
    db = await oracledb.getConnection(conDetails);

    for (var i = 0; i < cablesUpload.length; i++) {
      let temp = JSON.parse(cablesUpload[i].APPROVERS);
      const newObj = Object.keys(temp).reduce((accumulator, key) => {
        return { ...accumulator, [key]: false };
      }, {});
      await db.execute(
        `UPDATE SMARTCAPTAR_QUEUE SET APPROVERS = '${JSON.stringify(
          newObj
        )}', STATUS = 'REJECTED',COMMENTS = '${comment}' WHERE CABLENUM = '${
          cablesUpload[i].CABLENUM
        }'`
      );
    }

    for (var i = 0; i < cablesUpload.length; i++) {
      const result = await db.execute(
        `INSERT INTO SMARTCAPTAR_UPLOAD
          SELECT * FROM SMARTCAPTAR_QUEUE WHERE CABLENUM = '${cablesUpload[i].CABLENUM}'`
      );
    }

    for (var i = 0; i < cablesUpload.length; i++) {
      const result = await db.execute(
        `DELETE FROM SMARTCAPTAR_QUEUE WHERE CABLENUM = '${cablesUpload[i].CABLENUM}'`
      );
    }
  } catch (err) {
    console.error(err);
  }
  if (db) {
    try {
      await db.close();
    } catch (err) {
      console.error(err);
    }
  }
  res.json({ ms: "Completed" });
});
router.post("/cancelQueue", cors(), async (req, res) => {
  const oracledb = req.db;
  const conDetails = req.conDetails;
  //New variable for cables taht are being sent
  let cablesNum = req.body.cableNum;
  oracledb.autoCommit = true;
  let db;
  try {
    db = await oracledb.getConnection(conDetails);

    const resultOne = await db.execute(
      `INSERT INTO SMARTCAPTAR_UPLOAD
          SELECT * FROM SMARTCAPTAR_QUEUE WHERE CABLENUM = '${cablesNum}'`
    );

    const resultTwo = await db.execute(
      `DELETE FROM SMARTCAPTAR_QUEUE WHERE CABLENUM = '${cablesNum}'`
    );

    const resultThree = await db.execute(
      `UPDATE SMARTCAPTAR_UPLOAD SET STATUS = 'NEW' WHERE CABLENUM = '${cablesNum}'`
    );
  } catch (err) {
    console.error(err);
  }
  if (db) {
    try {
      await db.close();
    } catch (err) {
      console.error(err);
    }
  }
  res.json({ ms: "Completed" });
});
router.post("/approveCables", cors(), async (req, res) => {
  //New variable for cables taht are being sent
  const oracledb = req.db;
  const conDetails = req.conDetails;
  let cablesUpload = req.body.cables;
  let user = req.body.user;
  oracledb.autoCommit = true;
  let db;
  try {
    db = await oracledb.getConnection(conDetails);

    const allEqual = (arr) => arr.every((v) => v === true);

    for (var i = 0; i < cablesUpload.length; i++) {
      if (user != "ADMIN") {
        let temp = JSON.parse(cablesUpload[i].APPROVERS);
        temp[user] = true;
        cablesUpload[i].APPROVERS = JSON.stringify(temp);

        if (allEqual(Object.values(temp))) {
          await InsertIntoCableINV(user, cablesUpload, db);
          await LogInHistory(user, cablesUpload, db);
        } else {
          //If they dont all equal just mark the user who approved the cable
          await db.execute(
            `UPDATE SMARTCAPTAR_QUEUE SET APPROVERS = '${cablesUpload[i].APPROVERS}' WHERE CABLENUM = '${cablesUpload[i].CABLENUM}'`
          );
        }
      } else {
        //Approve the cable since the ADMIN Account Allowed it
        await InsertIntoCableINV(user, cablesUpload, db);
        //Log into History
        await LogInHistory(user, cablesUpload, db);
      }
    }
  } catch (err) {
    console.error(err);
  }

  if (db) {
    try {
      await db.close();
    } catch (err) {
      console.error(err);
    }
  }

  res.json({ ms: "Completed" });
});
router.post("/updateCable", cors(), async (req, res) => {
  const oracledb = req.db;
  const conDetails = req.conDetails;
  //New variable for cables taht are being sent
  let cable = req.body.cable;
  let user = req.body.user;

  for (const [key, value] of Object.entries(cable)) {
    console.log(`${key}: ${value}`);

    if (value == null) {
      cable[key] = "";
    }
  }
  console.log("TEST=================");
  console.log(cable);

  oracledb.autoCommit = true;
  let db;
  try {
    db = await oracledb.getConnection(conDetails);

    const result = await db.execute(`UPDATE ${req.query.table} SET 


        CABLETYPE = '${cable.CABLETYPE}',
        JOBNUM= '${cable.JOBNUM}',
        FUNC= '${cable.FUNC}',
        SYSTEM            = '${cable.SYSTEM}',
        LENGTH= '${cable.LENGTH}',
        ROUTING          = '${cable.ROUTING}',
        LIST_NO           = '${cable.LIST_NO}',
        DWGNUM= '${cable.DWGNUM}',
        DRAWING_TITLE= '${cable.DRAWING_TITLE}',
        AREACODE          = '${cable.AREACODE}',
        ORIGIN_LOC= '${cable.ORIGIN_LOC}',
        ORIGIN_RACK      = '${cable.ORIGIN_RACK}',
        ORIGIN_SIDE       = '${cable.ORIGIN_SIDE}',
        ORIGIN_ELE= '${cable.ORIGIN_ELE}',
        ORIGIN_SLOT      = '${cable.ORIGIN_SLOT}',
        ORIGIN_CONNUM     = '${cable.ORIGIN_CONNUM}',
        ORIGIN_PINLIST= '${cable.ORIGIN_PINLIST}',
        ORIGIN_CONNTYPE  = '${cable.ORIGIN_CONNTYPE}',
        ORIGIN_STATION    = '${cable.ORIGIN_STATION}',
        ORIGIN_INSTR= '${cable.ORIGIN_INSTR}',
        STATION_OLD      = '${cable.STATION_OLD}',
        DEST_LOC= '${cable.DEST_LOC}',
        DEST_RACK       = '${cable.DEST_RACK}',
        DEST_SIDE         = '${cable.DEST_SIDE}',
        DEST_ELE= '${cable.DEST_ELE}',
        DEST_SLOT       = '${cable.DEST_SLOT}',
        DEST_CONNUM       = '${cable.DEST_CONNUM}',
        DEST_PINLIST= '${cable.DEST_PINLIST}',
        DEST_CONNTYPE   = '${cable.DEST_CONNTYPE}',
        DEST_STATION      = '${cable.DEST_STATION}',
        DEST_INSTR= '${cable.DEST_INSTR}',
        FORMDEV_NAME    = '${cable.FORMDEV_NAME}',
        PHASE= '${cable.PHASE}',
        BEAM_AREA       = '${cable.BEAM_AREA}',
        SECTOR_GROUP      = '${cable.SECTOR_GROUP}',
        SECTOR_AREA_SOURCE= '${cable.SECTOR_AREA_SOURCE}',
        SECTOR_AREA_DEST= '${cable.SECTOR_AREA_DEST}',
        PENETRATION       = '${cable.PENETRATION}',
        PENETRATION_2= '${cable.PENETRATION_2}',
        MIN_LENGTH      = '${cable.MIN_LENGTH}',
        MAX_LENGTH        = '${cable.MAX_LENGTH}',
        ADDNL_LENGTH= '${cable.ADDNL_LENGTH}',
        REVISION        = '${cable.REVISION}'
        
        
        WHERE CABLENUM = '${cable.CABLENUM}'`);
  } catch (err) {
    console.error(err);
  }

  if (db) {
    try {
      await db.close();
    } catch (err) {
      console.error(err);
    }
  }
  res.json({ ms: "Completed" });
});
module.exports = router;
