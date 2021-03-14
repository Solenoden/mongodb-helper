const MongoClient = require('mongodb').MongoClient
const ObjectID = require('mongodb').ObjectID
const q = require('q')

class MongoDBHelper {
    static mongoClient
    static database

    static connectToDatabase(app, dbName, dbUser, dbPassword) {
        let deferred = q.defer()

        const uri = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.151v2.mongodb.net/${dbName}?retryWrites=true&w=majority`

        if (!MongoDBHelper.mongoClient) {
            MongoDBHelper.mongoClient = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true})
            MongoDBHelper.mongoClient.connect(error => {
                app.on('close', () => MongoDBHelper.mongoClient.close())
                this.database = MongoDBHelper.mongoClient.db(dbName)

                (error) ? deferred.reject(error) : deferred.resolve()
            })
        }

        return deferred.promise
    }

    static getAll(collectionName, query = {}, sort = {}, limit = 0) {
        let deferred = q.defer()

        const collection = MongoDBHelper.database.collection(collectionName)
        collection.find(query, {sort, limit}).toArray().then(result => {
            deferred.resolve(result)
        }).catch(error => {
            deferred.reject(error)
        })

        return deferred.promise
    }

    static get(collectionName, query = {}) {
        let deferred = q.defer()

        MongoDBHelper.getAll(collectionName, query, {}, 1).then(result => {
            deferred.resolve(result[0])
        }).catch(error => {
            deferred.reject(error)
        })

        return deferred.promise
    }

    static getById(collectionName, id) {
        const query = {_id: new ObjectID(id)}
        return MongoDBHelper.get(collectionName, query)
    }

    static insert(collectionName, documentData) {
        let deferred = q.defer()
        const collection = MongoDBHelper.database.collection(collectionName)

        collection.insertOne(documentData).then(result => {
            documentData.id = result.insertedId.toString()
            delete documentData._id

            deferred.resolve(documentData)
        }).catch(error => {
            deferred.reject(error)
        })

        return deferred.promise
    }

    static update(collectionName, documentData, query, shouldUpsert = false) {
        const collection = MongoDBHelper.database.collection(collectionName)

        return collection.updateOne(query, {$set: documentData}, {shouldUpsert})
    }

    static updateById(collectionName, documentData, id, shouldUpsert = false) {
        const query = {_id: new ObjectID(id)}
        return update(collectionName, documentData, query, shouldUpsert)
    }
}

module.exports = MongoDBHelper
