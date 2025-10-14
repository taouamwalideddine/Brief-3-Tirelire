const jwt = require('jsonwebtoken');

module.exports = function(req, res, next){
    const token = req.header('Authorization')?.replace('Bearer', '') || req.query.token;
    if(!token) return res.status(401).json({message :'no access, need token'});

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }catch (error){
        res.status(400).json({message: 'no token'});
    }
};