const Log = require('../models/Log');

module.exports = (action, resource) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      if (res.statusCode < 400) {
        const log = new Log({
          user: req.user.userId,
          action,
          resource,
          resourceId: req.params.id || req.params.groupId,
          details: JSON.stringify(req.body),
          groupId: req.params.groupId
        });
        log.save().catch(console.error);
      }
      originalSend.call(this, data);
    };
    
    next();
  };
};

