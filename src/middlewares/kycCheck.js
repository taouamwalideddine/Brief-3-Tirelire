module.exports = (req, res,next) => {
    if(req.user.role === 'Admin') return next();

    if(req.user.kycStatus !== 'verified'){
        return res.status(403).json({ message: 'Action denied, Kyc verificatioon required.'});
    }
    next();
}