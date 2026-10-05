const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

let gridFSBucket;

const getGridFSBucket = () => {
  if (gridFSBucket) {
    return gridFSBucket;
  }

  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB is not connected");
  }

  gridFSBucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: "uploads",
  });

  return gridFSBucket;
};

module.exports = getGridFSBucket;