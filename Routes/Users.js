const express = require("express");
const router = express.Router();

router.get("/getAdmins", async (req, res) => {
  const oracledb = req.db;
  const conDetails = req.conDetails;
  let db;
  let AREACODE = req.query.AREACODE;
  try {
    db = await oracledb.getConnection(conDetails);

    const result = await db.execute(
      `SELECT * FROM SMARTCAPTAR_USERS WHERE ADMIN = '1'`
    );
    let resultArr = [];
    for (var i = 0; i < result.rows.length; i++) {
      if (result.rows[i].PROJECTS != null) {
        result.rows[i].PROJECTS = result.rows[i].PROJECTS.split(",");
        if (result.rows[i].PROJECTS.includes(AREACODE)) {
          resultArr.push(result.rows[i]);
        }
      }
    }

    res.json({ admins: resultArr });
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
router.get("/getAllUsers", async (req, res) => {
  const oracledb = req.db;
  const conDetails = req.conDetails;
  let db;

  try {
    db = await oracledb.getConnection(conDetails);

    const result = await db.execute(`SELECT * FROM SMARTCAPTAR_USERS`);
    const resultCount = await db.execute(
      `SELECT COUNT(*) as count FROM SMARTCAPTAR_USERS`
    );
    res.json({ users: result.rows, total: resultCount.rows[0].COUNT });
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
router.get("/getAllProjects", async (req, res) => {
  const oracledb = req.db;
  const conDetails = req.conDetails;
  let offset = req.query.offset;
  let db;
  try {
    db = await oracledb.getConnection(conDetails);
    const result = await db.execute(`SELECT * FROM SMARTCAPTAR_PROJECTS`);
    const resultCount = await db.execute(
      `SELECT COUNT(*) as count FROM SMARTCAPTAR_PROJECTS`
    );
    res.json({ projects: result.rows, total: resultCount.rows[0].COUNT });
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
router.get("/getProjects", async (req, res) => {
  const oracledb = req.db;
  const conDetails = req.conDetails;
  let offset = req.query.offset;
  let db;
  try {
    db = await oracledb.getConnection(conDetails);
    const result = await db.execute(`SELECT * FROM SMARTCAPTAR_PROJECTS`);

    res.json({ projects: result.rows });
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
router.post("/addUser", async (req, res) => {
  const oracledb = req.db;
  const conDetails = req.conDetails;
  //New variable for cables taht are being sent
  let user = req.body.user;
  let admin = req.body.admin ? 1 : 0;
  let projects = req.body.projects;
  console.log(projects);
  oracledb.autoCommit = true;
  let db;

  //get user projects,
  //add user to project they are given
  try {
    db = await oracledb.getConnection(conDetails);

    const arr = projects.split(",");
    console.log(arr);
    for (var i = 0; i < arr.length; i++) {
      //get assigned users for a project
      const result = await db.execute(
        `SELECT ASSIGNED_USERS FROM SMARTCAPTAR_PROJECTS WHERE PROJECT_NAME = '${arr[i]}'`
      );
      var currUsers = result.rows[0].ASSIGNED_USERS;
      if (currUsers == null) {
        console.log("HERE IN NULL");
        currUsers = [];
      } else {
        currUsers = currUsers.split(",");
      }

      currUsers.push(user);
      //update the assigned users with new username
      //update the projects with new uysers
      const resultUpdate = await db.execute(
        `UPDATE SMARTCAPTAR_PROJECTS SET ASSIGNED_USERS = '${currUsers.toString()}' WHERE PROJECT_NAME = '${
          arr[i]
        }'`
      );
    }

    const result = await db.execute(
      `INSERT INTO SMARTCAPTAR_USERS (USERNAME,PROJECTS) VALUES  ('${user}','${projects}')`
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
router.post("/modifyUser", async (req, res) => {
  const oracledb = req.db;
  const conDetails = req.conDetails;
  //New variable for cables taht are being sent
  let user = req.body.user;
  let oldProjects = !req.body.oldProjects
    ? []
    : req.body.oldProjects.split(",");
  let admin = req.body.admin ? 1 : 0;
  let projects = req.body.projects.split(",");
  let removedProjects = oldProjects.filter((x) => !projects.includes(x));
  let newProjects = !req.body.projects ? [] : req.body.projects.split(",");
  oracledb.autoCommit = true;
  let db;

  try {
    db = await oracledb.getConnection(conDetails);

    for (var i = 0; i < newProjects.length; i++) {
      console.log(projects);
      //get assigned users for a project
      const result = await db.execute(
        `SELECT ASSIGNED_USERS FROM SMARTCAPTAR_PROJECTS WHERE PROJECT_NAME = '${newProjects[i]}'`
      );
      var currUsers = result.rows[0].ASSIGNED_USERS;
      if (currUsers == null) {
        console.log("HERE IN NULL");
        currUsers = [];
      } else {
        currUsers = currUsers.split(",");
      }

      if (!currUsers.includes(user)) {
        currUsers.push(user);
      }

      //update the assigned users with new username
      //update the projects with new uysers
      const resultUpdate = await db.execute(
        `UPDATE SMARTCAPTAR_PROJECTS SET ASSIGNED_USERS = '${currUsers.toString()}' WHERE PROJECT_NAME = '${
          newProjects[i]
        }'`
      );
    }

    for (var i = 0; i < removedProjects.length; i++) {
      //approvers for each cable
      const resultProj = await db.execute(
        `SELECT CABLENUM, APPROVERS FROM SMARTCAPTAR_QUEUE WHERE AREACODE = '${removedProjects[i]}'`
      );
      console.log(resultProj.rows);
      for (var j = 0; j < resultProj.rows.length; j++) {
        let approvers = JSON.parse(resultProj.rows[j].APPROVERS);

        if (approvers[user] == false || approvers[user] == true) {
          console.log("FOUND");
          delete approvers[user];
        }
        approvers = JSON.stringify(approvers);
        const result = await db.execute(
          `UPDATE SMARTCAPTAR_QUEUE SET APPROVERS = '${approvers}' WHERE CABLENUM = '${resultProj.rows[j].CABLENUM}'`
        );
      }
    }

    for (var i = 0; i < removedProjects.length; i++) {
      //get assigned users for a project
      const result = await db.execute(
        `SELECT ASSIGNED_USERS FROM SMARTCAPTAR_PROJECTS WHERE PROJECT_NAME = '${removedProjects[i]}'`
      );
      var currUsers = result.rows[0].ASSIGNED_USERS;
      if (currUsers == null) {
        console.log("HERE IN NULL");
        currUsers = [];
      } else {
        currUsers = currUsers.split(",");
      }

      const index = currUsers.indexOf(user);

      if (index > -1) {
        // only splice array when item is found
        currUsers.splice(index, 1); // 2nd parameter means remove one item only
      }

      const resultUpdate = await db.execute(
        `UPDATE SMARTCAPTAR_PROJECTS SET ASSIGNED_USERS = '${currUsers.toString()}' WHERE PROJECT_NAME = '${
          removedProjects[i]
        }'`
      );
    }
    const result = await db.execute(
      `UPDATE SMARTCAPTAR_USERS SET USERNAME = '${user}', PROJECTS = '${projects}' WHERE USERNAME = '${user}'`
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
router.post("/deleteUser", async (req, res) => {
  const oracledb = req.db;
  const conDetails = req.conDetails;
  let user = req.body.user;
  let projects = !req.body.projects ? [] : req.body.projects.split(",");

  oracledb.autoCommit = true;
  let db;
  try {
    db = await oracledb.getConnection(conDetails);

    for (var i = 0; i < projects.length; i++) {
      //get assigned users for a project
      const result = await db.execute(
        `SELECT ASSIGNED_USERS FROM SMARTCAPTAR_PROJECTS WHERE PROJECT_NAME = '${projects[i]}'`
      );
      var currUsers = result.rows[0].ASSIGNED_USERS;
      if (currUsers == null) {
        console.log("HERE IN NULL");
        currUsers = [];
      } else {
        currUsers = currUsers.split(",");
      }

      const index = currUsers.indexOf(user);

      if (index > -1) {
        // only splice array when item is found
        currUsers.splice(index, 1); // 2nd parameter means remove one item only
      }

      const resultUpdate = await db.execute(
        `UPDATE SMARTCAPTAR_PROJECTS SET ASSIGNED_USERS = '${currUsers.toString()}' WHERE PROJECT_NAME = '${
          projects[i]
        }'`
      );
    }

    for (var i = 0; i < projects.length; i++) {
      //approvers for each cable
      const resultProj = await db.execute(
        `SELECT CABLENUM, APPROVERS FROM SMARTCAPTAR_QUEUE WHERE AREACODE = '${projects[i]}'`
      );
      console.log(resultProj.rows);
      for (var j = 0; j < resultProj.rows.length; j++) {
        let approvers = JSON.parse(resultProj.rows[j].APPROVERS);

        if (approvers[user] == false || approvers[user] == true) {
          console.log("FOUND");
          delete approvers[user];
        }
        approvers = JSON.stringify(approvers);
        const result = await db.execute(
          `UPDATE SMARTCAPTAR_QUEUE SET APPROVERS = '${approvers}' WHERE CABLENUM = '${resultProj.rows[j].CABLENUM}'`
        );
      }
    }

    //go through each assigned project and remove from projects in the project list
    const result = await db.execute(
      `DELETE FROM SMARTCAPTAR_USERS WHERE USERNAME = '${user}'`
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
router.post("/addProject", async (req, res) => {
  const oracledb = req.db;
  const conDetails = req.conDetails;
  //New variable for cables taht are being sent
  let project = req.body.project;
  let prefix = req.body.prefix;
  let area = req.body.area;
  oracledb.autoCommit = true;
  let db;
  try {
    db = await oracledb.getConnection(conDetails);

    const result = await db.execute(
      `INSERT INTO SMARTCAPTAR_PROJECTS (PROJECT_NAME,PREFIX,NUM_CABLES) VALUES  ('${project}','${prefix}','${0}')`
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
router.post("/updateProject", async (req, res) => {
  const oracledb = req.db;
  const conDetails = req.conDetails;
  //New variable for cables taht are being sent
  let project = req.body.project;
  let prefix = req.body.prefix;
  let old = req.body.oldProject;

  let area = req.body.area;
  oracledb.autoCommit = true;
  let db;
  console.log(project);
  console.log(prefix);
  try {
    db = await oracledb.getConnection(conDetails);

    const result = await db.execute(
      `UPDATE SMARTCAPTAR_PROJECTS SET PROJECT_NAME = '${project}', PREFIX = '${prefix}' WHERE PROJECT_NAME = '${old}'`
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
router.post("/addToWorkspace", async (req, res) => {
  //New variable for cables taht are being sent
  const oracledb = req.db;
  const conDetails = req.conDetails;
  let cable = req.body.cable;
  let user = req.body.user;
  oracledb.autoCommit = true;
  let db;
  try {
    db = await oracledb.getConnection(conDetails);
    const check = await db.execute(
      `SELECT CABLENUM FROM SMARTCAPTAR_UPLOAD WHERE CABLENUM = '${cable.CABLENUM}' UNION SELECT CABLENUM FROM SMARTCAPTAR_QUEUE WHERE CABLENUM = '${cable.CABLENUM}'`
    );
    if (check.rows.length > 0) {
      res.status(400).send({ message: "Cable is Already Being Edited" });
    } else {
      let keys = Object.keys(cable);
      for (var i = 0; i < keys.length; i++) {
        if (cable[keys[i]] == null) {
          cable[keys[i]] = "";
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
        ('${cable["CABLENUM"]}',
        '${cable["CABLETYPE"]}',
        '${cable["JOBNUM"]}',
        '${user}',
        TO_TIMESTAMP_TZ(CURRENT_TIMESTAMP, 'DD-MON-RR HH.MI.SSXFF PM TZH:TZM'),
        '${cable["FUNC"]}',
        '${cable["LENGTH"]}',
        '${cable["ROUTING"]}',
        '${cable["REV"]}',
        '${cable["DWGNUM"]}',
        '${cable["DRAWING_TITLE"]}',
        'NEW',
        '${cable["AREACODE"]}',
        '${cable["ORIGIN_LOC"]}',
        '${cable["ORIGIN_RACK"]}',
        '${cable["ORIGIN_SIDE"]}',
        '${cable["ORIGIN_ELE"]}',
        '${cable["ORIGIN_SIDE"]}',
        '${cable["ORIGIN_CONNUM"]}',
        '${cable["ORIGIN_PINLIST"]}',
        '${cable["ORIGIN_CONNTYPE"]}',
        '${cable["ORIGIN_STATION"]}',
        '${cable["ORIGIN_INSTR"]}',
        '${cable["DEST_LOC"]}',
        '${cable["DEST_RACK"]}',
        '${cable["DEST_SIDE"]}',
        '${cable["DEST_ELE"]}',
        '${cable["DEST_SIDE"]}',
        '${cable["DEST_CONNUM"]}',
        '${cable["DEST_PINLIST"]}',
        '${cable["DEST_CONNTYPE"]}',
        '${cable["DEST_STATION"]}',
        '${cable["DEST_INSTR"]}',
        '${cable["FORMDEV_NAME"]}',
        '${cable["USERID_LIST_TITLE"]}',
        '${cable["PHASE"]}',
        '${cable["BEAM_AREA"]}',
        '${cable["SECTOR_GROUP"]}',
        '${cable["SECTOR_AREA_SOURCE"]}',
        '${cable["SECTOR_AREA_DEST"]}',
        '${cable["PENETRATION"]}',
        '${cable["PENETRATION_2"]}',
        '${cable["MIN_LENGTH"]}',
        '${cable["MAX_LENGTH"]}',
        '${cable["ADDNL_LENGTH"]}')`
      );

      res.json({ msg: "SUCCESS" });
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
});
module.exports = router;
