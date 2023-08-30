

# # FROM oraclelinux:8

# # RUN  dnf -y install oracle-instantclient-release-el8 && \
# #      dnf -y install oracle-instantclient-basic oracle-instantclient-devel oracle-instantclient-sqlplus && \
# #      rm -rf /var/cache/dnf
# # ENV PATH=$PATH:/usr/lib/oracle/21/client64/bin

# # CMD ["sqlplus", "-v"]
# # # Uncomment if the tools package is added
# # # ENV PATH=$PATH:/usr/lib/oracle/21/client64/bin
# # FROM node:12.8.1-slim
# # # RUN apt-get update \
# # #  && apt-get install -y unzip wget libaio1 \
# # #  && mkdir -p opt/oracle \
# # # # ADD ORACLE INSTANT CLIENT from local system
# # #  && unzip instantclient-basic-linux.x64-19.3.0.0.0dbru.zip -d /opt/oracle \
# # #  && mv /opt/oracle/instantclient_19_3 /opt/oracle/instantclient

# # # # Setup the path to find the instantclient with node-oracledb library
# # # ENV LD_LIBRARY_PATH="/opt/oracle/instantclient"

# # WORKDIR /usr/app
# # COPY package*.json ./
# # RUN npm install
# # COPY . . 
# # EXPOSE 1337
# # CMD ["node","index.js"]

# FROM oraclelinux:7-slim as builder

# ARG release=19
# ARG update=5

# RUN yum -y install oracle-release-el7
# RUN yum -y install oracle-instantclient${release}.${update}-basiclite

# RUN rm -rf /usr/lib/oracle/${release}.${update}/client64/bin
# WORKDIR /usr/lib/oracle/${release}.${update}/client64/lib/
# RUN rm -rf *jdbc* *occi* *mysql* *jar

# # Get a new image
# FROM node:12-buster-slim

# # Copy the Instant Client libraries, licenses and config file from the previous image
# COPY --from=builder /usr/lib/oracle /usr/lib/oracle
# COPY --from=builder /usr/share/oracle /usr/share/oracle
# COPY --from=builder /etc/ld.so.conf.d/oracle-instantclient.conf /etc/ld.so.conf.d/oracle-instantclient.conf
# ENV LD_LIBRARY_PATH="/usr/lib/oracle"

# RUN apt-get update && apt-get -y upgrade && apt-get -y dist-upgrade && apt-get install -y libaio1 && \
#     apt-get -y autoremove && apt-get -y clean && \
#     ldconfig
# WORKDIR /usr/app
# COPY package*.json ./
# RUN npm install
# COPY . . 
# EXPOSE 1337
# CMD ["node","index.js"]
FROM node:18-buster-slim

RUN apt-get update && apt-get install -y libaio1 wget unzip

WORKDIR /opt/oracle

RUN wget https://download.oracle.com/otn_software/linux/instantclient/instantclient-basiclite-linuxx64.zip && \
    unzip instantclient-basiclite-linuxx64.zip && rm -f instantclient-basiclite-linuxx64.zip && \
    cd /opt/oracle/instantclient* && rm -f *jdbc* *occi* *mysql* *mql1* *ipc1* *jar uidrvci genezi adrci && \
    echo /opt/oracle/instantclient* > /etc/ld.so.conf.d/oracle-instantclient.conf && ldconfig


# COPY tnsnames.ora /opt/oracle/instantclient_21_11/network/admin
# ENV TNS_ADMIN /opt/oracle/instantclient_21_11/network/admin

WORKDIR /myapp
ADD package.json index.js /myapp/
RUN npm install
COPY . .
EXPOSE 1337
CMD exec node index.js

