function validateCreateUser(req, res, next) {

    if (!("name" in req.body) || !("age" in req.body)) {
        return res.status(400).json({
            message: "name and age are required"
        });
    }

    if(typeof req.body.name !== "string" || typeof req.body.age !== "number"){
        return res.status(400).json({
            "message" : "name must be a string and age must be a number"
        })
    }
    if(req.body.name.trim() === ""){
        return res.status(400).json({
            "message" : "name cannot be empty"
        })
    }
    if(req.body.age <= 0){
        return res.status(400).json({
            "message" : "age should be positive"
        })
    }
    next();
}

export default validateCreateUser;