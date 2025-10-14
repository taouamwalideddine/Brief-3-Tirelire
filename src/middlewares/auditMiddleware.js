const AuditService = require('../services/auditService');

// Middleware to log actions
const auditMiddleware = (action, details = '') => {
  return async (req, res, next) => {
    // Store original res.json to intercept the response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log the action after the response is sent
      if (req.user && req.user.userId) {
        const metadata = {
          statusCode: res.statusCode,
          success: res.statusCode < 400,
          responseData: data
        };
        
        AuditService.logAction(
          req.user.userId,
          action,
          details,
          metadata,
          req.params.groupId || null,
          req
        ).catch(err => {
          console.error('Audit logging failed:', err);
        });
      }
      
      // Call the original json method
      return originalJson.call(this, data);
    };
    
    next();
  };
};

module.exports = auditMiddleware;
