const {
  buildSuccessObject,
  buildErrObject,
  itemNotFound,
} = require("../middleware/utils");
const { strFun } = require("../../common");

/**
 * Builds sorting
 * @param {string} sort - field to sort from
 * @param {number} order - order for query (1,-1)
 */
const buildSort = (sort, order) => {
  const sortBy = {};
  sortBy[sort] = order;
  return sortBy;
};

const buildSortArray = (sort, order) => {
  const sortBy = {};
  for (const iterator of sort) {
    sortBy[iterator] = order;
  }
  return sortBy;
};

/**
 * Hack for mongoose-paginate, removes 'id' from results
 * @param {Object} result - result object
 */
const cleanPaginationID = (result) => {
  result.docs.map((element) => delete element.id);
  return result;
};

/**
 * Builds initial options for query
 * @param {Object} query - query object
 */
const listInitOptions = async (req) => {
  return new Promise(async (resolve) => {
    const order = req.order || -1;
    const sort =
      typeof req.sort === "object"
        ? await sortOptions(req.sort)
        : req.sort || "createdAt";
    const sortBy =
      typeof req.sort === "object"
        ? buildSortArray(sort, order)
        : buildSort(sort, order);
    const page = parseInt(req.page, 10) || 1;
    const limit = parseInt(req.limit, 10) || 20;
    const select = req.select || null;
    const populate = req.populate
      ? Array.isArray(req.populate)
        ? req.populate
        : {
          path: req.populate,
          select: req.selectPopulate || null,
          sort: { _id: -1 },
        }
      : null;
    let skip;
    if (req.skip) {
      skip = req.skip;
      console.log("skip :>> ", skip);
    }
    const options = {
      select: select,
      populate: populate,
      sort: sortBy,
      lean: "lean" in req ? req.lean : true,
      pagination: req.hasOwnProperty("pagination") ? req.pagination : true,
      page,
      limit,
      skip,
    };
    resolve(options);
  });
};

/**
 * Builds initial options for query ( Aggregate )
 * @param {Object} query - query object
 */
const listInitOptionsAggregate = async (req) => {
  return new Promise(async (resolve) => {
    const page = parseInt(req.page, 10) || 1;
    const limit = parseInt(req.limit, 10) || 20;
    const options = {
      page,
      limit,
    };
    resolve(options);
  });
};

const sortOptions = async (req) => {
  return new Promise((resolve) => {
    const array = [];
    req.map((item) => {
      array.push(item);
    });
    resolve(array);
  });
};

module.exports = {
  async checkQueryString(query) {
    return new Promise((resolve, reject) => {
      try {
        if (
          typeof query.filter !== "undefined" &&
          typeof query.fields !== "undefined"
        ) {
          if (!query.searchType) query.searchType = 1;
          const data = {
            $and: [],
          };
          const array = [];
          const arrayFields = query.fields.split(",");
          arrayFields.map((item) => {
            array.push({
              [item]: {
                $regex: new RegExp(
                  `^.*(${strFun[
                    query.searchType === 1
                      ? "getRegexWordSearch"
                      : "getRegexStringSearch"
                  ](query.filter)}).*$`,
                  "i"
                ),
              },
            });
          });
          data.$and.push({ $or: array });
          resolve(data);
        } else {
          resolve({});
        }
      } catch (err) {
        reject(buildErrObject(422, "ERROR WITH FILTER"));
      }
    });
  },

  async get(req, model, query) {
    const options = await listInitOptions(req);
    return new Promise((resolve, reject) => {
      model.paginate(query, options, (err, items) => {
        if (err) {
          reject(buildErrrObject(422, err.message));
        }
        resolve(cleanPaginationID(items));
      });
    });
  },

  async getData({ req, model, query }) {
    const options = await listInitOptions(req);
    return new Promise((resolve, reject) => {
      if (!("isDeleted" in query)) {
        query.isDeleted = {
          $ne: true,
        };
      }
      model.paginate(query, options, (err, items) => {
        if (err) {
          return reject(buildErrObject(422, err.message));
        }
        resolve(cleanPaginationID(items));
      });
    });
  },

  async getAllAggregate({ aggregate, model }) {
    return new Promise((resolve, reject) => {
      model.aggregate(aggregate, (err, items) => {
        if (err) {
          return reject(buildErrObject(422, err.message));
        }
        resolve(items);
      });
    });
  },

  async aggregateCount({ aggregate, model }) {
    return new Promise((resolve, reject) => {
      aggregate.push({
        $count: "count",
      });
      model.aggregate(aggregate, (err, items) => {
        if (err) {
          return reject(buildErrObject(422, err.message));
        }
        resolve(items[0] ? items[0].count || 0 : 0);
      });
    });
  },

  async getAggregate({ data, model, query }) {
    const options = await listInitOptionsAggregate(data);
    return new Promise((resolve, reject) => {
      model.aggregatePaginate(model.aggregate(query), options, (err, items) => {
        if (err) {
          return reject(buildErrObject(422, err.message));
        }
        resolve(cleanPaginationID(items));
      });
    });
  },

  async getAll({ model, query, select, isReturn, options }) {
    return new Promise((resolve, reject) => {
      model.find(query, select, options, (err, item) => {
        if (err || (!isReturn && !item))
          itemNotFound(err, item, reject, "DATA_DOES_NOT_EXIST");
        resolve(item);
      });
    });
  },

  async find(req, model, query, isReturn) {
    return new Promise((resolve, reject) => {
      if (!("isDeleted" in query)) {
        query.isDeleted = {
          $ne: true,
        };
      }
      model.findOne(query, (err, item) => {
        itemNotFound(err, item, reject, "DATA DOES NOT EXIST");
        resolve(item);
      });
    });
  },

  async findData({ req, model, query, select, isReturn, options }) {
    return new Promise((resolve, reject) => {
      model.findOne(query, select, options, (err, item) => {
        if (err && err !== null) {
          console.log("err :>> ", err, query);
          itemNotFound(err, item, reject, "DATA_DOES_NOT_EXIST");
        }
        resolve(item);

      });
    });
  },

  async findById(id, model, field, select) {
    return new Promise((resolve, reject) => {
      model
        .findOne({ _id: id })
        .populate(field)
        .select(select)
        .lean()
        .exec((err, item) => {
          itemNotFound(err, item, reject, "NOT_FOUND");
          resolve(item);
        });
    });
  },

  async findByIdPop(id, model, field, isReturn) {
    return new Promise((resolve, reject) => {
      model
        .findById(id)
        .populate(field)
        .lean()
        .exec((err, item) => {
          if (err || (!isReturn && !item))
            itemNotFound(err, item, reject, "NOT_FOUND");
          resolve(item);
        });
    });
  },

  async create(req, model) {
    console.log('req, model :>> ', req, model);
    return new Promise((resolve, reject) => {
      model.create(req, (err, item) => {
        if (err) {
          console.log("err", err.message);
          reject(buildErrObject(422, err.message));
        }
        console.log('item :>> ', item);
        resolve(item);
      });
    });
  },

  async insertMany(req, model) {
    return new Promise((resolve, reject) => {
      model.insertMany(req, (err, item) => {
        if (err) {
          reject(buildErrObject(422, err.message));
        }
        resolve(item);
      });
    });
  },
  async create(req, model) {
    return new Promise((resolve, reject) => {
      model.create(req, (err, item) => {
        if (err) {
          reject(buildErrObject(422, err.message));
        }
        resolve(item);
      });
    });
  },

  async update(id, model, req) {
    return new Promise((resolve, reject) => {
      model.findByIdAndUpdate(
        id,
        req,
        {
          new: true,
          runValidators: true,
        },
        (err, item) => {
          itemNotFound(err, item, reject, "NOT FOUND");
          resolve(item);
        }
      );
    });
  },

  async updateData(id, model, data) {
    return new Promise((resolve, reject) => {
      model.findByIdAndUpdate(
        id,
        data,
        {
          new: true,
          upsert: true,
        },
        (err, item) => {
          if (err) {
            console.log('err :>> ', err);
            reject(err);
          }
          resolve(item);
        }
      );
    });
  },

  async updateMany(id, model, req) {
    return new Promise((resolve, reject) => {
      model.updateMany(
        id,
        {
          $set: req,
        },
        {
          multi: true,
          runValidators: true,
        },
        (err, item) => {
          itemNotFound(err, item, reject, "NOT FOUND");
          resolve(item);
        }
      );
    });
  },

  async findOneAndUpdateWithOption({ filter, model, update, options }) {
    return new Promise((resolve, reject) => {
      model.findOneAndUpdate(filter, update, options, (err, item) => {
        itemNotFound(err, item, reject, "NOT FOUND");
        resolve(item);
      });
    });
  },

  async findOneAndUpdate({ filter, model, update }) {
    return new Promise((resolve, reject) => {
      model.findOneAndUpdate(
        filter,
        update,
        {
          new: true,
          upsert: true,
          rawResult: true,
        },
        (err, item) => {
          itemNotFound(err, item, reject, "NOT FOUND");
          resolve(item);
        }
      );
    });
  },
  async updateOne(condition, model, req) {
    return new Promise((resolve, reject) => {
      model.updateOne(
        condition,
        {
          $set: req,
        },
        {
          runValidators: true,
        },
        (err, item) => {
          itemNotFound(err, item, reject, "NOT FOUND");
          resolve(item);
        }
      );
    });
  },

  async delete(id, model) {
    return new Promise((resolve, reject) => {
      model.findOne({ _id: id }, "_id", (err, item) => {
        if (!item || err)
          return itemNotFound(err, item, reject, "DATA_DOES_NOT_EXIST");
        item.remove((err) => {
          itemNotFound(err, item, reject, "DATA_DOES_NOT_EXIST");
          resolve(item);
        });
      });
      // model.findByIdAndRemove(id, (err, item) => {
      //   itemNotFound(err, item, reject, "NOT FOUND");
      //   resolve(buildSuccessObject("DELETED"));
      // });
    });
  },

  async deleteMany(condition, model) {
    return new Promise((resolve, reject) => {
      model.deleteMany(condition, (err, item) => {
        itemNotFound(err, item, reject, "NOT FOUND");
        resolve(buildSuccessObject("DELETED"));
      });
    });
  },

  async findWithLean({ filter, elemMatch, model, select }) {
    return new Promise((resolve, reject) => {
      model
        .findOne(filter, elemMatch)
        .select(select)
        .lean()
        .exec((err, item) => {
          resolve(item);
        });
    });
  },

  async findAllWithLean({ filter, elemMatch, model, select }) {
    return new Promise((resolve, reject) => {
      model
        .find(filter, elemMatch)
        .select(select)
        .lean()
        .exec((err, item) => {
          resolve(item);
        });
    });
  },

  async removeArrayObject({ filter, removeObj, model }) {
    return new Promise((resolve, reject) => {
      model.update(filter, removeObj, { safe: true }, (err, item) => {
        itemNotFound(err, item, reject, "NOT FOUND");
        resolve(item);
      });
    });
  },

  async count({ query, model }) {
    return new Promise((resolve, reject) => {
      model.countDocuments(query, (err, item) => {
        resolve(item);
      });
    });
  },

  async distinct({ field, query, model }) {
    return new Promise((resolve, reject) => {
      model.distinct(field, query, (err, item) => {
        resolve(item);
      });
    });
  },
};
