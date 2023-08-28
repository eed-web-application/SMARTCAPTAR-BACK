async function addApproverToCables(user, projects, db) {
  for (var i = 0; i < projects.length; i++) {
    //approvers for each cable
    const result = await db.execute(
      `SELECT CABLENUM, APPROVERS FROM SMARTCAPTAR_QUEUE WHERE PROJECT_NAME = '${projects[i]}'`
    );

    for (var j = 0; j < result.rows.length; i++) {
      let approvers = result.rows[j].APPROVERS.split(",");
      approvers.push(user);
      const result = await db.execute(
        `UPDATE SMARTCAPTAR_QUEUE SET APPROVERS = '${approvers}' WHERE CABLENUM = '${result.rows[j].CABLENUM}'`
      );
    }
  }
}

async function InsertIntoCableINV(user, cables, db) {
  const resultCount = await db.execute(
    `SELECT CAPTARIN_UPLOAD_LOG_SEQ.nextval from dual`
  );
  let UPLOAD_ID = resultCount.rows[0].NEXTVAL;
  console.log("UPLOADID:" + UPLOAD_ID);

  for (var i = 0; i < cables.length; i++) {
    Object.keys(cables[i]).map((key) =>
      cables[i][key] === null ? (cables[i][key] = "") : cables[i][key]
    );
    //Insert into Cable INV
    // I need to Create a List_NO
    //insert extra data seperatly
    //insert into captar upload
    await db.execute(
      `INSERT INTO CAPTARIN_UPLOAD_LOG (UPLOAD_ID,UPLOADED_BY,DATE_UPLOADED) VALUES ('${UPLOAD_ID}','SMCAPTAR',TO_TIMESTAMP_TZ(CURRENT_TIMESTAMP, 'DD-MON-RR HH.MI.SSXFF PM TZH:TZM'))`
    );

    console.log(cables[i]);
    await db.execute(
      `INSERT INTO CAPTARIN_UPLOAD (ID,
UPLOAD_ID,
CABLENUM,
FORMAL_DEVICE_NAME,
CABLE_FUNCTION,
CABLE_TYPE,
ORIGIN_LOC,
ORIGIN_RACK,
ORIGIN_SIDE,
ORIGIN_ELE,
ORIGIN_SLOT,
ORIGIN_CONN,
ORIGIN_PIN_LIST,
ORIGIN_CONN_TYPE,
ORIGIN_STATION,
ORIGIN_INS,
DEST_LOC,
DEST_RACK,
DEST_SIDE,
DEST_ELE,
DEST_SLOT,
DEST_CONN,
DEST_PIN_LIST,
DEST_CONN_TYPE,
DEST_STATION,
DEST_INS,
LENGTH,
ROUTING,
REVISION,
JOB,
DRAWING,
DRAWING_TITLE,
USER_ID,
LIST_TITLE,
AREA_CODE,
USERNAME,
DATE_CREATED,
CREATED_BY) VALUES(
'${UPLOAD_ID}',
'${UPLOAD_ID}',
'${cables[i].CABLENUM}',
'${cables[i].FORMDEV_NAME}',
'${cables[i].FUNC}',
'${cables[i].CABLETYPE}',
'${cables[i].ORIGIN_LOC}',
'${cables[i].ORIGIN_RACK}',
'${cables[i].ORIGIN_SIDE}',
'${cables[i].ORIGIN_ELE}',
'${cables[i].ORIGIN_SLOT}',
'${cables[i].ORIGIN_CONNUM}',
'${cables[i].ORIGIN_PINLIST}',
'${cables[i].ORIGIN_CONNTYPE}',
'${cables[i].ORIGIN_STATION}',
'${cables[i].ORIGIN_INSTR}',
'${cables[i].DEST_LOC}',
'${cables[i].DEST_RACK}',
'${cables[i].DEST_SIDE}',
'${cables[i].DEST_ELE}',
'${cables[i].DEST_SLOT}',
'${cables[i].DEST_CONNUM}',
'${cables[i].DEST_PINLIST}',
'${cables[i].DEST_CONNTYPE}',
'${cables[i].DEST_STATION}',
'${cables[i].DEST_INSTR}',
'${cables[i].LENGTH}',
'${cables[i].ROUTING}',
'${cables[i].REVISION}',
'${cables[i].JOBNUM}',
'${cables[i].DWGNUM}',
'${cables[i].DRAWING_TITLE}',
'${user}',
'${cables[i].USERID_LIST_TITLE}',
'${cables[i].AREACODE}',
'${user}',
 TO_TIMESTAMP_TZ(CURRENT_TIMESTAMP, 'DD-MON-RR HH.MI.SSXFF PM TZH:TZM'),
'${user}'
) `
    );

    await db.execute(
      `DECLARE 
       name   NVARCHAR2 (2000) := 'SMCAPTAR';
       proc   NVARCHAR2 (2000) := 'PROCESS';
       over   NVARCHAR2 (2000) := 'OVERWRITE';
       choose  NVARCHAR2 (2000) := 'Y';
      error  NVARCHAR2 (2000) := 'ERROR';

       
       
       BEGIN CAPTARIN.LoadData(name,proc,over,choose,${UPLOAD_ID},error); END;`
    );
  }
}
async function LogInHistory(user, cables, db) {
  for (var i = 0; i < cables.length; i++) {
    //////////////////////INSERT FROM HISTORY AND REMOVE FROM QUE/////////////////UE
    //Insert into History
    await db.execute(
      `INSERT INTO SMARTCAPTAR_HISTORY
          SELECT * FROM SMARTCAPTAR_QUEUE WHERE CABLENUM = '${cables[i].CABLENUM}'`
    );
    //Update History
    await db.execute(
      `UPDATE SMARTCAPTAR_HISTORY SET STATUS = 'APPROVED', APPROVERS = '${cables[i].APPROVERS}', MODIFIED_DATE = TO_TIMESTAMP_TZ(CURRENT_TIMESTAMP, 'DD-MON-RR HH.MI.SSXFF PM TZH:TZM')  WHERE CABLENUM = '${cables[i].CABLENUM}'`
    );
    //Delete from Queue Once everything else is done
    await db.execute(
      `DELETE FROM SMARTCAPTAR_QUEUE WHERE CABLENUM = '${cables[i].CABLENUM}'`
    );
  }
}
module.exports = { addApproverToCables, LogInHistory, InsertIntoCableINV };
