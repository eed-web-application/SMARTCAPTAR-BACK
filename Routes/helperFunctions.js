export async function addApproverToCables(user,projects,db){
          
            for(var i = 0; i < projects.length; i++){
              //approvers for each cable
               const result = await db.execute(
              `SELECT CABLENUM, APPROVERS FROM SMARTCAPTAR_QUEUE WHERE PROJECT_NAME = '${projects[i]}'`);

              for(var j = 0; j < result.rows.length; i++){
                let approvers = result.rows[j].APPROVERS.split(",")
                approvers.push(user)
                const result = await db.execute(
                    `UPDATE SMARTCAPTAR_QUEUE SET APPROVERS = '${approvers}' WHERE CABLENUM = '${result.rows[j].CABLENUM}'`);

              }
               }
}
