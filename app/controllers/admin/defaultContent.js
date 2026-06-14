const models = require("../../models").default;
const db = require("../../middleware/db");

exports.updatePrivacyPolicy = async (req, res) => {
    try {
        const { description,domain } = req.body;
        if(!domain){
            return res.status(404).json({
                success: false,
                status: 404,
                error: true,
                message: "Domain is required.",
            });    
        }
        const getData = await models.PrivacyPolicy.findOne({domain});
        if (getData) {
            const updateData = await models.PrivacyPolicy.findOneAndUpdate({ _id: getData._id }, { $set: { description: description } });
            return res.status(200).json({
                success: true,
                status: 200,
                data: updateData,
                message: "PrivacyPolicy Updated Successfully",
            });
        } else {
            const createData = await models.PrivacyPolicy.create(req.body);
            return res.status(200).json({
                success: true,
                status: 200,
                data: createData,
                message: "PrivacyPolicy Created Successfully",
            });
        }
    } catch (error) {
        return res.status(error.code ? error.code : 500).json({
            success: false,
            status: error.code ? error.code : 500,
            error: true,
            message: error.message,
        });
    }
}

exports.getPrivacyPolicy = async (req, res) => {
    try {
        const { domain } = req.query;
        let query={}
        if(domain){
            query={domain}
        }
        const getData = await models.PrivacyPolicy.findOne(query);
        return res.status(200).json({
            success: true,
            status: 200,
            data: getData,
            message: "Record found Successfully",
        });
    } catch (error) {
        return res.status(error.code ? error.code : 500).json({
            success: false,
            status: error.code ? error.code : 500,
            error: true,
            message: error.message,
        });
    }
}

exports.updateTermsAndCondition = async (req, res) => {
    try {
        const { description,domain } = req.body;
        if(!domain){
            return res.status(404).json({
                success: false,
                status: 404,
                error: true,
                message: "Domain is required.",
            });    
        }
        const getData = await models.TermsAndCondition.findOne({domain});
        if (getData) {
            const updateData = await models.TermsAndCondition.findOneAndUpdate({ _id: getData._id }, { $set: { description: description } });
            return res.status(200).json({
                success: true,
                status: 200,
                data: updateData,
                message: "TermsAndCondition Updated Successfully",
            });
        } else {
            const createData = await models.TermsAndCondition.create(req.body);
            return res.status(200).json({
                success: true,
                status: 200,
                data: createData,
                message: "TermsAndCondition Created Successfully",
            });
        }
    } catch (error) {
        return res.status(error.code ? error.code : 500).json({
            success: false,
            status: error.code ? error.code : 500,
            error: true,
            message: error.message,
        });
    }
}

exports.getTermsAndCondition = async (req, res) => {
    try {
        const { domain } = req.query;
        let query={}
        if(domain){
            query={domain}
        }
        const getData = await models.TermsAndCondition.findOne(query);
        return res.status(200).json({
            success: true,
            status: 200,
            data: getData,
            message: "Record found Successfully",
        });
    } catch (error) {
        return res.status(error.code ? error.code : 500).json({
            success: false,
            status: error.code ? error.code : 500,
            error: true,
            message: error.message,
        });
    }
}