const db = require('../config/database');

class Model {
  constructor() {
    this.db = db;
  }

  async lastInsertedId() {
    try {
      const data = await this.db.query('SELECT LAST_INSERT_ID() AS id');
      return data[0].id;
    } catch (error) {
      console.error('Error fetching last inserted ID:', error);
      throw error;
    }
  }

  async request(sql, params = []) {
    try {
      const [rows] = await this.db.query(sql, params);
      return {
        rows: rows,
        count: rows.length,
        lastInsertedId: await this.lastInsertedId()
      };
    } catch (error) {
      console.error('Error executing SQL query:', error);
      throw error;
    }
  }

  async findConnexion(){
    try {
        //Recupérer la liste des connexions depuis le serveur avec PPROCESSLIST
        const sql = 'SHOW PROCESSLIST';
        const [rows] = await this.db.query(sql);

        return {
            rows: rows,
            count: rows.length
        };
    } catch (error) {
        console.error('Error fetching connection status:', error);
        throw error;
    }
  }
}

module.exports = Model;
