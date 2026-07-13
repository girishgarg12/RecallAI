export default function validatePatchUser(req, res, next){
    if(Object.keys(req.body).length === 0) {
        return res.status(400).json({
            message : "At least one field is required"
        })
    }

    const allowedFields = ['name', 'age'];
    const receivedFields = Object.keys(req.body);
    const isValid = receivedFields.every(field =>
        allowedFields.includes(field)
    );
    if(!isValid) {
        return res.status(400).json({
            message : "Request contains unsupported fields"
        });
    }

    if("name" in req.body){
        if(typeof req.body.name !== "string"){
            return res.status(400).json({
                message : "Name must be a string"
            });
        }

        if(req.body.name.trim() === ""){
            return res.status(400).json({
                message : "Name can not be empty"
            });
        }
    }

    if("age" in req.body){
        if(typeof req.body.age !== "number"){
            return res.status(400).json({
                message : "Age must be a number"
            });
        }

        if(req.body.age < 0){
            return res.status(400).json({
                message : "Age cannot be negative"
            });
        }
    }
    next();
}