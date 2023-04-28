import sqlite3 from "sqlite3";

export class Sqlite {
    public readonly dbConn: sqlite3.Database;
    public readonly apiTokenTable = 'api_token';
    public readonly livenessTable = 'liveness_config';
    public readonly manualKycTable = 'manual_kyc_config';

    constructor(sqliteDb: string) {
        this.dbConn = new sqlite3.Database(sqliteDb, (err) => {
            if (err) {
                return console.error(err.message);
            }

            console.log('Connected to the in-memory SQlite database.');
        })
        
        const db = this.dbConn;

        this.createToggleFeatureTable(this.livenessTable, db);
        this.createToggleFeatureTable(this.manualKycTable, db);

        db.run(`CREATE TABLE IF NOT EXISTS ${this.apiTokenTable} (
            token TEXT PRIMARY KEY
        )`, [], (err) => {
            if (err) {
                console.log(err);
            }
        });
    }

    private createToggleFeatureTable(tableName: string, db: sqlite3.Database) {
        // 1. check if table not exist -> create table
        db.run(`CREATE TABLE IF NOT EXISTS ${tableName} (
            enable TEXT CHECK( enable IN ('yes','no') ) NOT NULL DEFAULT 'yes'
        )`, [], (err) => {
        if (err) {
            console.log(err);
        }
        
        // 2. query record from table -> if null insert record
        db.get(`SELECT enable from ${tableName} LIMIT 1`, (err, row) => {
            if (err) {
                console.log(err);
            }

            if (row == null) {
                db.run(`INSERT INTO ${tableName} VALUES('yes')`, [], (err) => {
                    if (err) {
                        console.log(err);
                    }
                });       
            }
        });
    });
    }

    public queryRecord(query, params = []) {
        const db = this.dbConn;
        return new Promise(function (resolve, reject) {
            db.get(query, params, function(err, row) {
                if (err) {
                    reject(err);
                }

                resolve(row);
            });
        });
    }

    public runQueryRecord(query, data) {
        const db = this.dbConn;
        return new Promise(function (resolve, reject) {
            db.run(query, data, function(err) {
                if (err) {
                    reject(err);
                }

                resolve(this.changes);
            });       
        });
    }
}