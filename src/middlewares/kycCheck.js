module.exports = (req, res, next) => {
    if (req.user.role === 'Admin') return next();

    if (req.user.kycStatus !== 'Verified') {
        return res.status(403).json({ message: 'Action denied, KYC verification required.' });
    }
    next();
};